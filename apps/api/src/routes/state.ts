import type { FastifyInstance } from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError, badRequest } from '../errors';
import { requireAuth } from '../auth/session';
import { syncReminders } from '../reminders/engine';

/**
 * The student's app state, stored as documents. EVERY query is scoped by the session's user id; there is no way to
 * name another user's record. A write carries the version the client last saw: a stale version gets 409 and the
 * server copy, so two devices never silently overwrite each other.
 *
 * Only the fields listed here are stored; anything else the client sends is dropped. The fictional demo student and
 * the editors' local overrides are never part of a document.
 */
export const STATE_DOCS: Record<string, string[]> = {
  /** preferences and small lists */
  core: ['lang', 'displayCurrency', 'rates', 'reminders', 'readNotices', 'compare', 'saved', 'finder', 'mascot', 'liveAI', 'aiOff'],
  profile: ['profile', 'onboardingDraft'],
  plans: ['applications', 'customEvents', 'budgets', 'comparisons'],
  writing: ['drafts', 'cvText', 'consistency', 'growth'],
  /** AI chat, interviews and uploaded documents (text only) */
  ai: ['chat', 'chatThreads', 'interviews', 'advisorDocs'],
  /** dated items the app computed from the other documents; reminders and the calendar feed are built from it */
  calendar: ['events', 'reminderDays'],
};
export const DOC_LIMIT_BYTES = 8_000_000;
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

function pick(key: string, data: Record<string, unknown>): Record<string, unknown> {
  const allowed = STATE_DOCS[key]!;
  return Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
}

const putBody = z.object({ data: z.record(z.string(), z.unknown()), version: z.number().int().min(0).optional() }).strict();
const out = (r: { data: unknown; version: number; updatedAt: Date }) => ({ data: r.data, version: r.version, updatedAt: r.updatedAt });

export function registerStateRoutes(app: FastifyInstance, d: { config: Config; prisma: PrismaClient }) {
  const { prisma } = d;

  app.get('/me', async (req) => {
    const { user } = requireAuth(req);
    const identities = await prisma.authIdentity.findMany({ where: { userId: user.id }, select: { provider: true, telegramUsername: true } });
    return { id: user.id, displayName: user.displayName, lang: user.lang, role: user.role, createdAt: user.createdAt, identities };
  });

  // ---- all documents at once (what the app pulls after sign-in) -----------------------------------
  app.get('/me/state', async (req) => {
    const { user } = requireAuth(req);
    const rows = await prisma.stateDoc.findMany({ where: { userId: user.id } });
    return { docs: Object.fromEntries(rows.map((r) => [r.key, out(r)])) };
  });

  app.put<{ Params: { key: string } }>('/me/state/:key', { bodyLimit: 12_000_000 }, async (req) => {
    const { user } = requireAuth(req);
    const key = req.params.key;
    if (!STATE_DOCS[key]) throw badRequest(`Unknown document "${key}"`);
    const b = putBody.parse(req.body);
    const data = pick(key, b.data) as Prisma.InputJsonObject;
    if (JSON.stringify(data).length > DOC_LIMIT_BYTES) throw new ApiError(413, 'too_large', 'This document is too large to save.');
    if (key === 'core' && typeof data.lang === 'string' && ['uz', 'ru', 'en'].includes(data.lang)) await prisma.user.update({ where: { id: user.id }, data: { lang: data.lang } });

    const where = { userId_key: { userId: user.id, key } };
    const existing = await prisma.stateDoc.findUnique({ where });
    let row;
    if (!existing) {
      if (b.version) throw new ApiError(404, 'not_found', 'Document not found');
      try {
        row = await prisma.stateDoc.create({ data: { userId: user.id, key, data } });
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
          const server = await prisma.stateDoc.findUniqueOrThrow({ where });
          throw new ApiError(409, 'version_conflict', 'The document was created on another device', { server: out(server) });
        }
        throw e;
      }
    } else {
      if (b.version !== existing.version) throw new ApiError(409, 'version_conflict', 'The document changed on another device', { server: out(existing) });
      const r = await prisma.stateDoc.updateMany({ where: { userId: user.id, key, version: existing.version }, data: { data, version: { increment: 1 } } });
      row = await prisma.stateDoc.findUniqueOrThrow({ where });
      if (r.count === 0) throw new ApiError(409, 'version_conflict', 'The document changed on another device', { server: out(row) });
    }
    if (key === 'calendar') await syncReminders(prisma, d.config, user.id);
    return out(row);
  });

  // ---- sessions ------------------------------------------------------------------------------------
  app.get('/me/sessions', async (req) => {
    const { user, sessionId } = requireAuth(req);
    const rows = await prisma.session.findMany({ where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    return { items: rows.map((s) => ({ id: s.id, createdAt: s.createdAt, userAgent: s.userAgent, current: s.id === sessionId })) };
  });
  app.delete<{ Params: { id: string } }>('/me/sessions/:id', async (req, reply) => {
    const { user } = requireAuth(req);
    await prisma.session.updateMany({ where: { id: req.params.id, userId: user.id }, data: { revokedAt: new Date() } });
    return reply.status(204).send();
  });

  // ---- data portability and deletion ---------------------------------------------------------------
  app.get('/me/export', async (req, reply) => {
    const { user } = requireAuth(req);
    const [docs, identities, reminders, usage] = await Promise.all([
      prisma.stateDoc.findMany({ where: { userId: user.id } }),
      prisma.authIdentity.findMany({ where: { userId: user.id }, select: { provider: true, telegramUsername: true, createdAt: true } }),
      prisma.reminder.findMany({ where: { userId: user.id }, select: { ref: true, itemDate: true, dueAt: true, status: true } }),
      prisma.aiUsage.count({ where: { userId: user.id } }),
    ]);
    reply.header('content-disposition', 'attachment; filename="edubridge-export.json"').header('cache-control', 'no-store');
    return {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, lang: user.lang, createdAt: user.createdAt },
      identities,
      state: Object.fromEntries(docs.map((r) => [r.key, r.data])),
      reminders,
      aiRequests: usage,
    };
  });

  app.delete('/me', async (req, reply) => {
    const { user } = requireAuth(req);
    z.object({ confirm: z.literal('DELETE') }).strict().parse(req.body);
    await prisma.user.delete({ where: { id: user.id } }); // every table cascades
    return reply.status(204).send();
  });
}
