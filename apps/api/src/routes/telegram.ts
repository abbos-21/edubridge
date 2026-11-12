import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError } from '../errors';
import { randomToken, safeEqual, sha256hex } from '../auth/crypto';
import { requireAuth } from '../auth/session';
import type { TelegramApi } from '../bot/telegram';
import { buildIcs } from '../calendar/ics';
import { syncReminders } from '../reminders/engine';

type Lang = 'uz' | 'ru' | 'en';
const HELP: Record<Lang, string> = {
  uz: 'EduBridge eslatmalari. Buyruqlar: /status — holat, /stop — o‘chirish, /language — til.',
  ru: 'Напоминания EduBridge. Команды: /status — состояние, /stop — отключить, /language — язык.',
  en: 'EduBridge reminders. Commands: /status, /stop, /language.',
};
const LINKED: Record<Lang, string> = { uz: '✅ Ulandi. Muddatlar haqida eslatib turaman.', ru: '✅ Подключено. Я буду напоминать о сроках.', en: '✅ Connected. I will remind you about your dates.' };
const BAD_CODE: Record<Lang, string> = { uz: 'Kod noto‘g‘ri yoki muddati tugagan. Saytda yangisini oling.', ru: 'Код неверный или истёк. Получите новый на сайте.', en: 'That code is wrong or has expired. Get a new one on the website.' };

export function registerTelegramRoutes(app: FastifyInstance, d: { config: Config; prisma: PrismaClient; telegram: TelegramApi }) {
  const { config, prisma, telegram } = d;

  const status = async (userId: string) => {
    const link = await prisma.telegramLink.findUnique({ where: { userId } });
    return { botAvailable: telegram.configured && !!config.TELEGRAM_BOT_USERNAME, botUsername: config.TELEGRAM_BOT_USERNAME || null, linked: !!link, optIn: link?.optIn ?? false };
  };
  app.get('/me/telegram', async (req) => status(requireAuth(req).user.id));

  app.post('/me/telegram/link-code', async (req) => {
    const { user } = requireAuth(req);
    if (!telegram.configured) throw new ApiError(503, 'telegram_unavailable', 'Telegram reminders are not available yet.');
    const code = randomToken(9);
    await prisma.telegramLinkCode.deleteMany({ where: { userId: user.id } });
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await prisma.telegramLinkCode.create({ data: { userId: user.id, codeHash: sha256hex(code), expiresAt } });
    return { code, expiresAt, deepLink: `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=${code}` };
  });

  app.put('/me/telegram', async (req) => {
    const { user } = requireAuth(req);
    const { optIn } = z.object({ optIn: z.boolean() }).strict().parse(req.body);
    await prisma.telegramLink.updateMany({ where: { userId: user.id }, data: { optIn } });
    await syncReminders(prisma, config, user.id);
    return status(user.id);
  });
  app.delete('/me/telegram', async (req) => {
    const { user } = requireAuth(req);
    await prisma.telegramLink.deleteMany({ where: { userId: user.id } });
    await prisma.reminder.updateMany({ where: { userId: user.id, status: 'pending' }, data: { status: 'cancelled' } });
    return status(user.id);
  });
  app.get('/me/reminders', async (req) => {
    const { user } = requireAuth(req);
    const items = await prisma.reminder.findMany({ where: { userId: user.id, status: 'pending' }, orderBy: { dueAt: 'asc' }, take: 50, select: { id: true, ref: true, itemDate: true, dueAt: true, title: true } });
    return { items };
  });

  // ---- the bot ---------------------------------------------------------------------------------------
  const update = z.object({ message: z.object({ text: z.string().max(200).optional(), chat: z.object({ id: z.union([z.number(), z.string()]) }) }).optional() }).passthrough();
  app.post('/telegram/webhook', async (req, reply) => {
    const secret = config.TELEGRAM_WEBHOOK_SECRET;
    const presented = String(req.headers['x-telegram-bot-api-secret-token'] ?? '');
    if (!secret || !safeEqual(presented, secret)) return reply.status(404).send(); // the webhook "does not exist" without the secret
    const m = update.parse(req.body).message;
    if (!m?.text) return { ok: true };
    const chatId = String(m.chat.id);
    const link = await prisma.telegramLink.findUnique({ where: { chatId }, include: { user: true } });
    const lang = (['uz', 'ru', 'en'].includes(link?.user.lang ?? '') ? link!.user.lang : 'uz') as Lang;
    const [cmd, arg] = m.text.trim().split(/\s+/, 2);
    if (cmd === '/start' && arg) {
      const row = await prisma.telegramLinkCode.findUnique({ where: { codeHash: sha256hex(arg) } });
      if (!row || row.usedAt || row.expiresAt < new Date()) await telegram.send(chatId, BAD_CODE[lang]);
      else {
        await prisma.$transaction([
          prisma.telegramLinkCode.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
          prisma.telegramLink.deleteMany({ where: { OR: [{ userId: row.userId }, { chatId }] } }),
          prisma.telegramLink.create({ data: { userId: row.userId, chatId } }),
        ]);
        await syncReminders(prisma, config, row.userId);
        const u = await prisma.user.findUnique({ where: { id: row.userId } });
        await telegram.send(chatId, LINKED[(['uz', 'ru', 'en'].includes(u?.lang ?? '') ? u!.lang : 'uz') as Lang]);
      }
    } else if (cmd === '/stop' && link) {
      await prisma.telegramLink.update({ where: { userId: link.userId }, data: { optIn: false } });
      await syncReminders(prisma, config, link.userId);
      await telegram.send(chatId, '⏸️ OK');
    } else if (cmd === '/status') {
      await telegram.send(chatId, link ? `${link.optIn ? '✅' : '⏸️'} ${lang === 'ru' ? 'Напоминания' : lang === 'en' ? 'Reminders' : 'Eslatmalar'}` : HELP[lang]);
    } else if (cmd === '/language' && link) {
      const order: Lang[] = ['uz', 'ru', 'en'];
      const nextLang = order[(order.indexOf(lang) + 1) % 3]!;
      await prisma.user.update({ where: { id: link.userId }, data: { lang: nextLang } });
      await telegram.send(chatId, `🌐 ${nextLang.toUpperCase()}`);
    } else await telegram.send(chatId, HELP[lang]);
    return { ok: true };
  });

  // ---- calendar file and secret feed ----------------------------------------------------------------
  const icsFor = async (userId: string, lang: string) => {
    const doc = await prisma.stateDoc.findUnique({ where: { userId_key: { userId, key: 'calendar' } } });
    return buildIcs((doc?.data as { events?: unknown } | undefined)?.events, (['uz', 'ru', 'en'].includes(lang) ? lang : 'uz') as Lang);
  };
  app.get('/me/calendar', async (req) => {
    const { user } = requireAuth(req);
    const feed = await prisma.calendarFeed.findUnique({ where: { userId: user.id } });
    return { feed: { active: !!feed, createdAt: feed?.createdAt } };
  });
  app.get('/me/calendar.ics', async (req, reply) => {
    const { user } = requireAuth(req);
    reply.header('content-type', 'text/calendar; charset=utf-8').header('content-disposition', 'attachment; filename="edubridge.ics"').header('cache-control', 'no-store');
    return icsFor(user.id, user.lang);
  });
  app.post('/me/calendar/token', async (req) => {
    const { user } = requireAuth(req);
    const token = randomToken(24);
    await prisma.calendarFeed.upsert({ where: { userId: user.id }, create: { userId: user.id, tokenHash: sha256hex(token) }, update: { tokenHash: sha256hex(token), createdAt: new Date() } });
    return { url: `${config.APP_ORIGIN}/api/v1/calendar/${token}.ics` };
  });
  app.delete('/me/calendar/token', async (req, reply) => {
    const { user } = requireAuth(req);
    await prisma.calendarFeed.deleteMany({ where: { userId: user.id } });
    return reply.status(204).send();
  });
  app.get<{ Params: { file: string } }>('/calendar/:file', async (req, reply) => {
    const m = /^([A-Za-z0-9_-]{20,})\.ics$/.exec(req.params.file);
    const feed = m ? await prisma.calendarFeed.findUnique({ where: { tokenHash: sha256hex(m[1]!) }, include: { user: true } }) : null;
    if (!feed) return reply.status(404).send({ error: { code: 'not_found', message: 'Not found', requestId: req.id } });
    reply.header('content-type', 'text/calendar; charset=utf-8').header('cache-control', 'private, max-age=300');
    return icsFor(feed.userId, feed.user.lang);
  });
}
