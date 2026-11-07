import type { PrismaClient } from '@prisma/client';
import type { Config } from '../config';
import type { CatalogRepo } from '../lib/catalogRepo';
import type { TelegramApi } from '../bot/telegram';
import { collectCalendarItems, type CalItem } from '../calendar/items';
import { isLang, reminderText, type Lang } from '../calendar/texts';

const TASHKENT_H = 5;
/** Days before an item when a reminder is sent. */
export const OFFSETS = [7, 1] as const;
const SEND_HOUR = 9; // local time, inside the default waking hours
const MAX_ATTEMPTS = 5;

const refOf = (uid: string, days: number) => `${uid}|${days}`;

/** 09:00 Asia/Tashkent, `days` before the all-day item, as a UTC instant. */
export function dueAtFor(itemDate: string, days: number): Date {
  const [y, m, d] = itemDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - days, SEND_HOUR - TASHKENT_H, 0, 0));
}

/** True during quiet hours (default 22:00-08:00 Asia/Tashkent). Handles a window that crosses midnight. */
export function inQuietHours(now: Date, start: number, end: number): boolean {
  const h = (now.getUTCHours() + TASHKENT_H) % 24;
  if (start === end) return false;
  return start > end ? h >= start || h < end : h >= start && h < end;
}

export const backoffMs = (attempts: number) => Math.min(6 * 3_600_000, 5 * 60_000 * 2 ** Math.max(0, attempts - 1));

const daysUntil = (itemDate: string, now: Date) => Math.round((Date.parse(itemDate + 'T00:00:00Z') - Date.parse(new Date(now.getTime() + TASHKENT_H * 3_600_000).toISOString().slice(0, 10) + 'T00:00:00Z')) / 86_400_000);

export type CycleReport = { users: number; created: number; revived: number; cancelled: number; sent: number; deferredQuiet: number; failed: number; retried: number; skipped: string | null };

/**
 * Makes sure every opted-in student has a pending reminder for each upcoming item at each offset,
 * and cancels reminders whose item is gone (unsaved, done, date changed) or whose owner opted out.
 * Idempotent: running it twice creates nothing new.
 */
export async function materialise(prisma: PrismaClient, repo: CatalogRepo, now = new Date()): Promise<Pick<CycleReport, 'users' | 'created' | 'revived' | 'cancelled'>> {
  const links = await prisma.telegramLink.findMany({ select: { userId: true, optIn: true } });
  const r = { users: 0, created: 0, revived: 0, cancelled: 0 };

  // opted out: nothing may stay pending
  const out = links.filter((l) => !l.optIn).map((l) => l.userId);
  if (out.length) r.cancelled += (await prisma.reminder.updateMany({ where: { userId: { in: out }, status: 'pending' }, data: { status: 'cancelled' } })).count;

  for (const { userId } of links.filter((l) => l.optIn)) {
    r.users++;
    const items = await collectCalendarItems(prisma, repo, userId, now);
    const want = new Map<string, { item: CalItem; days: number; dueAt: Date }>();
    for (const item of items) {
      for (const days of OFFSETS) {
        const dueAt = dueAtFor(item.date, days);
        if (dueAt.getTime() < now.getTime() - 12 * 3_600_000) continue; // never send a stale "in 7 days"
        want.set(`${item.kind}|${refOf(item.uid, days)}|${dueAt.toISOString()}`, { item, days, dueAt });
      }
    }
    const existing = await prisma.reminder.findMany({ where: { userId, kind: { in: ['deadline', 'task', 'event'] } } });
    const have = new Map(existing.map((e) => [`${e.kind}|${e.ref}|${e.dueAt.toISOString()}`, e]));

    for (const [key, w] of want) {
      const e = have.get(key);
      if (!e) {
        await prisma.reminder.create({ data: { userId, kind: w.item.kind, ref: refOf(w.item.uid, w.days), dueAt: w.dueAt, channel: 'telegram' } });
        r.created++;
      } else if (e.status === 'cancelled') {
        await prisma.reminder.update({ where: { id: e.id }, data: { status: 'pending', attempts: 0, nextAttemptAt: null, lastError: null } });
        r.revived++;
      }
    }
    const stale = existing.filter((e) => e.status === 'pending' && !want.has(`${e.kind}|${e.ref}|${e.dueAt.toISOString()}`)).map((e) => e.id);
    if (stale.length) r.cancelled += (await prisma.reminder.updateMany({ where: { id: { in: stale } }, data: { status: 'cancelled' } })).count;
  }
  return r;
}

/** Sends what is due. At-least-once with a lease: a reminder is claimed before sending so two workers never send the same one. */
export async function deliver(prisma: PrismaClient, repo: CatalogRepo, telegram: TelegramApi, config: Config, now = new Date()): Promise<Pick<CycleReport, 'sent' | 'deferredQuiet' | 'failed' | 'retried'>> {
  const r = { sent: 0, deferredQuiet: 0, failed: 0, retried: 0 };
  if (inQuietHours(now, config.REMINDER_QUIET_START, config.REMINDER_QUIET_END)) {
    r.deferredQuiet = await prisma.reminder.count({ where: { status: 'pending', channel: 'telegram', dueAt: { lte: now } } });
    return r;
  }
  const due = await prisma.reminder.findMany({
    where: { status: 'pending', channel: 'telegram', dueAt: { lte: now }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    orderBy: { dueAt: 'asc' },
    take: 200,
    include: { user: { include: { telegramLink: true } } },
  });
  const cache = new Map<string, CalItem[]>();

  for (const rem of due) {
    const link = rem.user.telegramLink;
    if (!link || !link.optIn) {
      await prisma.reminder.update({ where: { id: rem.id }, data: { status: 'cancelled' } });
      continue;
    }
    // claim (lease for 10 minutes)
    const claimed = await prisma.reminder.updateMany({ where: { id: rem.id, status: 'pending', OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, data: { nextAttemptAt: new Date(now.getTime() + 600_000) } });
    if (!claimed.count) continue;

    const uid = rem.ref.slice(0, rem.ref.lastIndexOf('|'));
    const days = Number(rem.ref.slice(rem.ref.lastIndexOf('|') + 1));
    if (!cache.has(rem.userId)) cache.set(rem.userId, await collectCalendarItems(prisma, repo, rem.userId, now));
    const item = cache.get(rem.userId)!.find((i) => i.uid === uid);
    // the item was removed / finished / its date passed: nothing to remind about
    if (!item || daysUntil(item.date, now) < 0) {
      await prisma.reminder.update({ where: { id: rem.id }, data: { status: 'cancelled' } });
      continue;
    }
    const lang: Lang = isLang(rem.user.lang) ? rem.user.lang : 'uz';
    const res = await telegram.send(link.chatId, reminderText(item, Math.max(1, Math.min(days, daysUntil(item.date, now))), lang));
    if (res.ok) {
      await prisma.reminder.update({ where: { id: rem.id }, data: { status: 'sent', sentAt: now, lastError: null } });
      r.sent++;
    } else if (res.blocked) {
      // the student blocked the bot: stop messaging them
      await prisma.telegramLink.update({ where: { userId: rem.userId }, data: { optIn: false } });
      await prisma.reminder.updateMany({ where: { userId: rem.userId, status: 'pending' }, data: { status: 'cancelled', lastError: res.error } });
    } else {
      const attempts = rem.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.reminder.update({ where: { id: rem.id }, data: { status: 'failed', attempts, lastError: res.error } });
        r.failed++;
      } else {
        await prisma.reminder.update({ where: { id: rem.id }, data: { attempts, nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)), lastError: res.error } });
        r.retried++;
      }
    }
  }
  return r;
}

export async function runCycle(d: { prisma: PrismaClient; repo: CatalogRepo; telegram: TelegramApi; config: Config }, now = new Date()): Promise<CycleReport> {
  const m = await materialise(d.prisma, d.repo, now);
  if (!d.telegram.configured) return { ...m, sent: 0, deferredQuiet: 0, failed: 0, retried: 0, skipped: 'telegram not configured: reminders stay pending' };
  return { ...m, ...(await deliver(d.prisma, d.repo, d.telegram, d.config, now)), skipped: null };
}
