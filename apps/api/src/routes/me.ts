import type { FastifyInstance } from 'fastify';
import type { PrismaClient, User } from '@prisma/client';
import { z } from 'zod';
import { LANGS } from '@edubridge/shared';
import type { Config } from '../config';
import { ApiError, notFound } from '../errors';
import { clearSessionCookies, requireAuth } from '../auth/session';

const uuid = z.uuid();

export async function mePayload(prisma: PrismaClient, user: User, sessionId: string) {
  const identities = await prisma.authIdentity.findMany({ where: { userId: user.id }, select: { provider: true, createdAt: true } });
  return {
    id: user.id,
    lang: user.lang,
    role: user.role,
    displayName: user.displayName,
    createdAt: user.createdAt,
    aiSuspended: user.suspendedAi,
    identities,
    sessionId,
  };
}

export function registerMeRoutes(app: FastifyInstance, d: { config: Config; prisma: PrismaClient }) {
  const { config, prisma } = d;

  app.get('/me', async (req) => {
    const { user, sessionId } = requireAuth(req);
    return mePayload(prisma, user, sessionId);
  });

  /** For the web app's start-up check: answers 200 for guests too (a 401 would show up as a console error). */
  app.get('/auth/session', async (req, reply) => {
    reply.header('cache-control', 'no-store');
    if (!req.auth) return { user: null };
    return { user: await mePayload(prisma, req.auth.user, req.auth.sessionId) };
  });

  app.patch('/me', async (req) => {
    const { user } = requireAuth(req);
    const b = z.object({ lang: z.enum(LANGS).optional(), displayName: z.string().max(60).nullable().optional() }).strict().parse(req.body);
    const u = await prisma.user.update({ where: { id: user.id }, data: b });
    return { id: u.id, lang: u.lang, displayName: u.displayName };
  });

  /** Hard delete of the account and every private row (cascade), after typed confirmation. */
  app.delete('/me', async (req, reply) => {
    const { user } = requireAuth(req);
    const b = z.object({ confirm: z.literal('DELETE') }).safeParse(req.body);
    if (!b.success) throw new ApiError(400, 'confirmation_required', 'Send {"confirm":"DELETE"} to delete the account');
    await prisma.$transaction([
      prisma.auditLog.updateMany({ where: { actorId: user.id }, data: { actorId: null, ipHash: null } }),
      prisma.catalogueRevision.updateMany({ where: { authorId: user.id }, data: { authorId: null } }),
      prisma.catalogueRevision.updateMany({ where: { reviewedBy: user.id }, data: { reviewedBy: null } }),
      prisma.demoSnapshot.updateMany({ where: { savedBy: user.id }, data: { savedBy: null } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    clearSessionCookies(reply, config);
    return reply.status(204).send();
  });

  app.get('/me/sessions', async (req) => {
    const { user, sessionId } = requireAuth(req);
    const rows = await prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    });
    return { items: rows.map((s) => ({ ...s, current: s.id === sessionId })) };
  });

  app.delete<{ Params: { id: string } }>('/me/sessions/:id', async (req, reply) => {
    const { user } = requireAuth(req);
    if (!uuid.safeParse(req.params.id).success) throw notFound('Session');
    const r = await prisma.session.updateMany({ where: { id: req.params.id, userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (r.count === 0) throw notFound('Session');
    return reply.status(204).send();
  });

  /** A sign-in method can be removed only while another one remains. */
  app.delete<{ Params: { provider: string } }>('/me/identities/:provider', async (req, reply) => {
    const { user } = requireAuth(req);
    const provider = z.enum(['telegram', 'google']).safeParse(req.params.provider);
    if (!provider.success) throw notFound('Sign-in method');
    const all = await prisma.authIdentity.findMany({ where: { userId: user.id } });
    if (!all.some((i) => i.provider === provider.data)) throw notFound('Sign-in method');
    if (all.length < 2) throw new ApiError(409, 'last_identity', 'You cannot remove your only sign-in method');
    await prisma.authIdentity.deleteMany({ where: { userId: user.id, provider: provider.data } });
    return reply.status(204).send();
  });
}
