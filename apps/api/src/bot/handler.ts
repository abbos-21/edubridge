import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sha256hex } from '../auth/crypto';
import { BOT, isLang, type Lang } from '../calendar/texts';
import type { TelegramApi } from './telegram';

const update = z.object({
  message: z
    .object({
      text: z.string().max(4096).optional(),
      chat: z.object({ id: z.union([z.number(), z.string()]), type: z.string() }),
      from: z.object({ language_code: z.string().optional() }).partial().optional(),
    })
    .optional(),
});

export const hashCode = (code: string) => sha256hex(`tg-link|${code.trim().toUpperCase()}`);

const guess = (code?: string): Lang => (code?.startsWith('ru') ? 'ru' : code?.startsWith('uz') ? 'uz' : 'en');

/** Cancels everything still waiting for this user (used by /stop and by unlinking). */
export async function cancelPendingReminders(prisma: PrismaClient, userId: string) {
  await prisma.reminder.updateMany({ where: { userId, status: 'pending' }, data: { status: 'cancelled' } });
}

/**
 * Handles one Telegram update. The bot only links a chat, stops/starts reminders, shows status and switches
 * language. It never asks for passwords, documents or payment details. Private chats only.
 */
export async function handleUpdate(d: { prisma: PrismaClient; telegram: TelegramApi }, raw: unknown, now = new Date()): Promise<void> {
  const parsed = update.safeParse(raw);
  const msg = parsed.success ? parsed.data.message : undefined;
  if (!msg || msg.chat.type !== 'private') return;
  const chatId = String(msg.chat.id);
  const text = (msg.text ?? '').trim();
  const [cmdRaw = '', ...args] = text.split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, '');

  const link = await d.prisma.telegramLink.findUnique({ where: { chatId }, include: { user: true } });
  const lang: Lang = link && isLang(link.user.lang) ? link.user.lang : guess(msg.from?.language_code);
  const say = (t: Record<Lang, string>) => d.telegram.send(chatId, t[lang]);

  if (cmd === '/start') {
    const code = args[0];
    if (code) {
      const row = await d.prisma.telegramLinkCode.findUnique({ where: { codeHash: hashCode(code) }, include: { user: true } });
      if (!row || row.usedAt || row.expiresAt.getTime() < now.getTime()) {
        await say(BOT.badCode);
        return;
      }
      const userLang: Lang = isLang(row.user.lang) ? row.user.lang : lang;
      await d.prisma.$transaction([
        d.prisma.telegramLinkCode.update({ where: { id: row.id }, data: { usedAt: now } }),
        // a chat belongs to one account at a time; an account has one chat
        d.prisma.telegramLink.deleteMany({ where: { OR: [{ chatId }, { userId: row.userId }] } }),
        d.prisma.telegramLink.create({ data: { userId: row.userId, chatId, optIn: true } }),
      ]);
      await d.telegram.send(chatId, BOT.linked[userLang]);
      return;
    }
    if (link) {
      await d.prisma.telegramLink.update({ where: { userId: link.userId }, data: { optIn: true } });
      await say(BOT.resumed);
    } else await say(BOT.needCode);
    return;
  }

  if (cmd === '/stop') {
    if (!link) return void (await say(BOT.notLinked));
    await d.prisma.telegramLink.update({ where: { userId: link.userId }, data: { optIn: false } });
    await cancelPendingReminders(d.prisma, link.userId);
    return void (await say(BOT.stopped));
  }

  if (cmd === '/status') {
    if (!link) return void (await say(BOT.notLinked));
    if (!link.optIn) return void (await say(BOT.off));
    const next = await d.prisma.reminder.findMany({ where: { userId: link.userId, status: 'pending' }, orderBy: { dueAt: 'asc' }, take: 5 });
    if (!next.length) return void (await say(BOT.none));
    const lines = next.map((r) => `• ${r.dueAt.toISOString().slice(0, 10)} — ${r.ref.split('|')[0]!.replace(/^(deadline|task|event)-/, '').slice(0, 60)}`);
    await d.telegram.send(chatId, `${BOT.scheduled[lang]}\n${lines.join('\n')}`);
    return;
  }

  if (cmd === '/language') {
    if (!link) return void (await say(BOT.notLinked));
    const want = args[0]?.toLowerCase();
    if (!isLang(want)) return void (await say(BOT.langUsage));
    await d.prisma.user.update({ where: { id: link.userId }, data: { lang: want } });
    await d.telegram.send(chatId, BOT.langSet[want]);
    return;
  }

  await say(link ? BOT.help : BOT.needCode);
}
