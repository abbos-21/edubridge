import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError, notFound } from '../errors';
import { requireRole } from '../auth/roles';

/** Staff view of the link recheck: runs, findings, and what needs a manual check. Nothing here edits the catalogue. */
export function registerRecheckRoutes(app: FastifyInstance, d: { config: Config; prisma: PrismaClient }) {
  const { config, prisma } = d;

  app.get('/admin/recheck', async (req) => {
    requireRole(req, config, ['editor', 'admin']);
    const [runs, open, manual] = await Promise.all([
      prisma.recheckRun.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.recheckFinding.findMany({ where: { status: 'open' }, orderBy: { id: 'desc' }, take: 200, include: { source: true } }),
      prisma.source.findMany({ where: { blocksAutomation: true }, take: 200, orderBy: { url: 'asc' } }),
    ]);
    return { runs, findings: open, manual, sources: await prisma.source.count() };
  });

  app.post('/admin/recheck/run', async (req, reply) => {
    const auth = requireRole(req, config, ['admin']);
    if (await prisma.recheckRun.findFirst({ where: { status: { in: ['queued', 'running'] } } })) throw new ApiError(409, 'already_running', 'A recheck is already queued or running.');
    const run = await prisma.recheckRun.create({ data: { trigger: 'manual', requestedBy: auth.user.id } });
    return reply.status(202).send({ id: run.id, status: run.status });
  });

  app.post<{ Params: { id: string } }>('/admin/recheck/findings/:id', async (req) => {
    const auth = requireRole(req, config, ['admin']);
    const { action } = z.object({ action: z.enum(['accept', 'dismiss']) }).strict().parse(req.body);
    const f = await prisma.recheckFinding.findUnique({ where: { id: req.params.id } });
    if (!f) throw notFound('finding');
    await prisma.recheckFinding.update({ where: { id: f.id }, data: { status: action === 'accept' ? 'accepted' : 'dismissed', reviewedBy: auth.user.id, reviewedAt: new Date() } });
    await prisma.auditLog.create({ data: { actorId: auth.user.id, action: `recheck.${action}`, entityType: 'recheck', entityId: f.id } });
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>('/admin/recheck/sources/:id/checked', async (req) => {
    const auth = requireRole(req, config, ['editor', 'admin']);
    await prisma.source.update({ where: { id: req.params.id }, data: { lastCheckedAt: new Date(), lastStatus: 'manual' } });
    await prisma.auditLog.create({ data: { actorId: auth.user.id, action: 'recheck.manual_check', entityType: 'source', entityId: req.params.id } });
    return { ok: true };
  });
}
