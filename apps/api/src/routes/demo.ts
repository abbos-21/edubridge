import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { notFound } from '../errors';

/** Public, read-only: saved AI results shown in the demo. Always labelled with the date they were saved. */
export function registerDemoRoutes(app: FastifyInstance, prisma: PrismaClient) {
  app.get('/demo-snapshots', async (req, reply) => {
    const q = z.object({ kind: z.enum(['document_analysis', 'interview_feedback', 'coach_plan']).optional() }).parse(req.query ?? {});
    reply.header('cache-control', 'public, max-age=60, must-revalidate');
    const items = await prisma.demoSnapshot.findMany({ where: q.kind ? { kind: q.kind } : {}, orderBy: { savedAt: 'desc' }, take: 50, select: { id: true, kind: true, title: true, lang: true, mock: true, savedAt: true } });
    return { count: items.length, items };
  });

  app.get<{ Params: { id: string } }>('/demo-snapshots/:id', async (req, reply) => {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw notFound('Snapshot');
    const s = await prisma.demoSnapshot.findUnique({ where: { id: id.data } });
    if (!s) throw notFound('Snapshot');
    reply.header('cache-control', 'public, max-age=300');
    // saved + savedAt let the page say "saved on <date>" and never present this as a live answer.
    return { id: s.id, kind: s.kind, title: s.title, lang: s.lang, mock: s.mock, saved: true, savedAt: s.savedAt, payload: s.payload };
  });
}
