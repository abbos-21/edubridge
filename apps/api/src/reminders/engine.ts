import type { Prisma, PrismaClient } from '@prisma/client';
import type { Config } from '../config';
import type { TelegramApi } from '../bot/telegram';

/**
 * Telegram reminders. The web app computes the student's dated items (confirmed deadlines of saved opportunities,
 * plan task dates, own dates) and sends them as the `calendar` document; this module turns those into scheduled
 * messages. A date the app marked as unverified or demo is never reminded. A message is never sent between the
 * quiet hours (Tashkent time), and a student who blocks the bot is not messaged again.
 */
export type CalendarEvent = { id: string; date: string; title: { en: string; uz: string; ru?: string }; kind?: string; trust?: string; done?: boolean };
type Lang = 'uz' | 'ru' | 'en';

const TASHKENT_MS = 5 * 3_600_000;
const SEND_HOUR = 9; // local hour a reminder is due
export const DEFAULT_DAYS = [7, 1];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const REMINDABLE = new Set(['verified', 'student', 'suggested', undefined]);

export function parseEvents(raw: unknown): CalendarEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is CalendarEvent => !!e && typeof e.id === 'string' && typeof e.date === 'string' && isoDate.test(e.date) && !!e.title && typeof e.title.en === 'string').slice(0, 1000);
}

/** The instant (UTC) that is `hour` o'clock in Tashkent on the given calendar day minus `daysBefore`. */
export function dueInstant(date: string, daysBefore: number, hour = SEND_HOUR): Date {
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() - daysBefore * 86_400_000 + (hour * 3_600_000 - TASHKENT_MS));
}

export const inQuietHours = (now: Date, config: Pick<Config, 'REMINDER_QUIET_START' | 'REMINDER_QUIET_END'>): boolean => {
  const h = new Date(now.getTime() + TASHKENT_MS).getUTCHours();
  const { REMINDER_QUIET_START: s, REMINDER_QUIET_END: e } = config;
  return s > e ? h >= s || h < e : h >= s && h < e;
};

const MESSAGES: Record<Lang, (days: number, title: string, date: string) => string> = {
  uz: (n, t, date) => (n === 0 ? `⏰ Bugun: ${t}` : `⏰ ${n} kun qoldi: ${t} (${date})`),
  ru: (n, t, date) => (n === 0 ? `⏰ Сегодня: ${t}` : `⏰ Осталось дней: ${n} — ${t} (${date})`),
  en: (n, t, date) => (n === 0 ? `⏰ Today: ${t}` : `⏰ ${n} day${n === 1 ? '' : 's'} left: ${t} (${date})`),
};
const pickTitle = (t: CalendarEvent['title'], lang: Lang) => (lang === 'ru' ? t.ru ?? t.en : lang === 'uz' ? t.uz || t.en : t.en);

/** Makes the reminder rows match the student's calendar: new dates get rows, removed or finished ones are cancelled. */
export async function syncReminders(prisma: PrismaClient, _config: Config, userId: string, now = new Date()) {
  const link = await prisma.telegramLink.findUnique({ where: { userId } });
  const docs = await prisma.stateDoc.findMany({ where: { userId, key: { in: ['calendar', 'core'] } } });
  const cal = (docs.find((d) => d.key === 'calendar')?.data ?? {}) as { events?: unknown; reminderDays?: unknown };
  const core = (docs.find((d) => d.key === 'core')?.data ?? {}) as { reminders?: unknown };
  const wanted = new Map<string, { ref: string; date: string; title: CalendarEvent['title']; dueAt: Date }>();
  if (link?.optIn) {
    const daysRaw = Array.isArray(cal.reminderDays) ? cal.reminderDays : Array.isArray(core.reminders) ? core.reminders : DEFAULT_DAYS;
    const days = [...new Set(daysRaw.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 120))].slice(0, 8);
    for (const e of parseEvents(cal.events)) {
      if (e.done || !REMINDABLE.has(e.trust)) continue;
      for (const n of days) {
        const dueAt = dueInstant(e.date, n);
        if (dueAt.getTime() <= now.getTime()) continue;
        wanted.set(`${e.id}|${dueAt.toISOString()}`, { ref: e.id, date: e.date, title: e.title, dueAt });
      }
    }
  }
  const existing = await prisma.reminder.findMany({ where: { userId, status: 'pending' } });
  const have = new Set(existing.map((r) => `${r.ref}|${r.dueAt.toISOString()}`));
  const stale = existing.filter((r) => !wanted.has(`${r.ref}|${r.dueAt.toISOString()}`));
  if (stale.length) await prisma.reminder.updateMany({ where: { id: { in: stale.map((r) => r.id) } }, data: { status: 'cancelled' } });
  const fresh = [...wanted.entries()].filter(([k]) => !have.has(k)).map(([, v]) => v);
  if (fresh.length) {
    await prisma.reminder.createMany({
      data: fresh.map((v) => ({ userId, ref: v.ref, itemDate: v.date, title: v.title as Prisma.InputJsonValue, dueAt: v.dueAt })),
      skipDuplicates: true,
    });
  }
  return { created: fresh.length, cancelled: stale.length };
}

/** Sends the reminders that are due. Safe to call every minute from several workers: a row is leased before sending. */
export async function runDueReminders(prisma: PrismaClient, config: Config, telegram: TelegramApi, now = new Date(), limit = 50) {
  const stats = { sent: 0, deferred: 0, failed: 0, cancelled: 0 };
  if (!telegram.configured) return stats;
  if (inQuietHours(now, config)) return stats;
  const due = await prisma.reminder.findMany({
    where: { status: 'pending', dueAt: { lte: now }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    orderBy: { dueAt: 'asc' },
    take: limit,
    include: { user: { include: { telegramLink: true } } },
  });
  for (const r of due) {
    // lease: another worker that picked the same row loses this update
    const lease = await prisma.reminder.updateMany({ where: { id: r.id, status: 'pending', OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, data: { nextAttemptAt: new Date(now.getTime() + 120_000), attempts: { increment: 1 } } });
    if (lease.count === 0) continue;
    const link = r.user.telegramLink;
    const daysLeft = Math.round((Date.parse(`${r.itemDate}T00:00:00Z`) - (now.getTime() + TASHKENT_MS - ((now.getTime() + TASHKENT_MS) % 86_400_000))) / 86_400_000);
    if (!link?.optIn || daysLeft < 0) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: 'cancelled' } });
      stats.cancelled++;
      continue;
    }
    const lang = (['uz', 'ru', 'en'].includes(r.user.lang) ? r.user.lang : 'uz') as Lang;
    const res = await telegram.send(link.chatId, MESSAGES[lang](daysLeft, pickTitle(r.title as CalendarEvent['title'], lang), r.itemDate));
    if (res.ok) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: 'sent', sentAt: new Date(), lastError: null } });
      stats.sent++;
    } else if (res.blocked) {
      await prisma.telegramLink.update({ where: { userId: r.userId }, data: { optIn: false } });
      await prisma.reminder.updateMany({ where: { userId: r.userId, status: 'pending' }, data: { status: 'cancelled' } });
      stats.cancelled++;
    } else if (r.attempts >= 5) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: 'failed', lastError: res.error } });
      stats.failed++;
    } else {
      const backoffMin = [1, 5, 15, 60, 180][Math.min(r.attempts, 4)]!;
      await prisma.reminder.update({ where: { id: r.id }, data: { nextAttemptAt: new Date(now.getTime() + backoffMin * 60_000), lastError: res.error } });
      stats.deferred++;
    }
  }
  return stats;
}
