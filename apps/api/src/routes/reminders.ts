import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError, notFound } from '../errors';
import { requireAuth } from '../auth/session';
import { randomToken, safeEqual, sha256hex } from '../auth/crypto';
import type { CatalogRepo } from '../lib/catalogRepo';
import { buildIcs } from '../calendar/ics';
import { collectCalendarItems } from '../calendar/items';
import { isLang, itemTitle, type Lang } from '../calendar/texts';
import { cancelPendingReminders, handleUpdate, hashCode } from '../bot/handler';
import type { TelegramApi } from '../bot/telegram';

type Deps = { config: Config; prisma: PrismaClient; repo: CatalogRepo; telegram: TelegramApi };

const langOf = (x: string): Lang => (isLang(x) ? x : 'uz');
const LINK_CODE_MINUTES = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters

function newCode(): string {
  const bytes = Buffer.from(randomToken(16), 'base64url');
  return Array.from({ length: 8 }, (_, i) => CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]).join('');
}

export function registerReminderRoutes(app: FastifyInstance, d: Deps) {
  const { config, prisma, repo, telegram } = d;

  // ------------------------------------------------------------------ calendar

  const icsReply = async (userId: string, lang: string) => buildIcs(await collectCalendarItems(prisma, repo, userId), langOf(lang));

  app.get('/me/calendar.ics', async (req, reply) => {
    const { user } = requireAuth(req);
    reply.header('content-disposition', 'attachment; filename="edubridge.ics"').header('cache-control', 'no-store').type('text/calendar; charset=utf-8');
    return icsReply(user.id, user.lang);
  });

  app.get('/me/calendar', async (req) => {
    const { user } = requireAuth(req);
    const feed = await prisma.calendarFeed.findUnique({ where: { userId: user.id } });
    const items = await collectCalendarItems(prisma, repo, user.id);
    return { feed: feed ? { active: true, createdAt: feed.createdAt } : { active: false }, upcoming: items.slice(0, 20).map((i) => ({ date: i.date, kind: i.kind, title: itemTitle(i, langOf(user.lang)) })), total: items.length };
  });

  /** Creates (or replaces) the secret feed URL. The token is shown once; only its hash is stored. */
  app.post('/me/calendar/token', async (req, reply) => {
    const { user } = requireAuth(req);
    const token = randomToken(32);
    await prisma.calendarFeed.upsert({ where: { userId: user.id }, create: { userId: user.id, tokenHash: sha256hex(token) }, update: { tokenHash: sha256hex(token), createdAt: new Date() } });
    return reply.status(201).send({ token, url: `${config.APP_ORIGIN}/api/v1/calendar/${token}.ics` });
  });

  app.delete('/me/calendar/token', async (req, reply) => {
    const { user } = requireAuth(req);
    await prisma.calendarFeed.deleteMany({ where: { userId: user.id } });
    return reply.status(204).send();
  });

  /** Public, but only for someone who holds the secret token. Revoking it makes this 404. */
  app.get<{ Params: { file: string } }>('/calendar/:file', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
    const token = req.params.file.replace(/\.ics$/, '');
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) throw notFound('Calendar');
    const feed = await prisma.calendarFeed.findUnique({ where: { tokenHash: sha256hex(token) }, include: { user: true } });
    if (!feed) throw notFound('Calendar');
    reply.header('cache-control', 'private, max-age=900').type('text/calendar; charset=utf-8');
    return icsReply(feed.userId, feed.user.lang);
  });

  // ------------------------------------------------------------------ Telegram link and reminders

  app.get('/me/telegram', async (req) => {
    const { user } = requireAuth(req);
    const link = await prisma.telegramLink.findUnique({ where: { userId: user.id } });
    return { botUsername: config.TELEGRAM_BOT_USERNAME || null, botAvailable: telegram.configured && !!config.TELEGRAM_BOT_USERNAME, linked: !!link, optIn: link?.optIn ?? false, linkedAt: link?.linkedAt ?? null };
  });

  app.post('/me/telegram/link-code', async (req, reply) => {
    const { user } = requireAuth(req);
    if (!telegram.configured || !config.TELEGRAM_BOT_USERNAME) throw new ApiError(503, 'telegram_not_configured', 'Telegram reminders are not available right now.');
    const code = newCode();
    const expiresAt = new Date(Date.now() + LINK_CODE_MINUTES * 60_000);
    await prisma.$transaction([
      prisma.telegramLinkCode.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.telegramLinkCode.create({ data: { userId: user.id, codeHash: hashCode(code), expiresAt } }),
    ]);
    return reply.status(201).send({ code, expiresAt, deepLink: `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=${code}` });
  });

  app.put('/me/telegram', async (req) => {
    const { user } = requireAuth(req);
    const b = z.object({ optIn: z.boolean() }).strict().parse(req.body);
    const link = await prisma.telegramLink.findUnique({ where: { userId: user.id } });
    if (!link) throw new ApiError(409, 'not_linked', 'Connect Telegram first.');
    await prisma.telegramLink.update({ where: { userId: user.id }, data: { optIn: b.optIn } });
    if (!b.optIn) await cancelPendingReminders(prisma, user.id);
    return { linked: true, optIn: b.optIn };
  });

  app.delete('/me/telegram', async (req, reply) => {
    const { user } = requireAuth(req);
    await cancelPendingReminders(prisma, user.id);
    await prisma.telegramLink.deleteMany({ where: { userId: user.id } });
    return reply.status(204).send();
  });

  app.get('/me/reminders', async (req) => {
    const { user } = requireAuth(req);
    const [rows, items] = await Promise.all([
      prisma.reminder.findMany({ where: { userId: user.id, status: 'pending' }, orderBy: { dueAt: 'asc' }, take: 30 }),
      collectCalendarItems(prisma, repo, user.id),
    ]);
    const byUid = new Map(items.map((i) => [i.uid, i]));
    return {
      items: rows.map((r) => {
        const uid = r.ref.slice(0, r.ref.lastIndexOf('|'));
        const i = byUid.get(uid);
        return { id: r.id, kind: r.kind, dueAt: r.dueAt, itemDate: i?.date ?? null, title: i ? itemTitle(i, langOf(user.lang)) : null };
      }),
    };
  });

  // ------------------------------------------------------------------ webhook

  /** Telegram calls this. It must present the secret token we registered; without a configured secret the webhook is off. */
  app.post('/telegram/webhook', async (req, reply) => {
    const secret = config.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) throw new ApiError(503, 'webhook_disabled', 'Not configured');
    const given = req.headers['x-telegram-bot-api-secret-token'];
    if (typeof given !== 'string' || !safeEqual(given, secret)) throw new ApiError(401, 'bad_secret', 'Unauthorized');
    try {
      await handleUpdate({ prisma, telegram }, req.body);
    } catch (err) {
      // Telegram retries on errors; a bad update should not loop. Log and acknowledge.
      req.log.error({ err }, 'telegram update failed');
    }
    return reply.status(200).send({ ok: true });
  });
}
