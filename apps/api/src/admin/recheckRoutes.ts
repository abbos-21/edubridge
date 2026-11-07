import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, type PrismaClient, type Role } from '@prisma/client';
import { z } from 'zod';
import { ApiError, notFound } from '../errors';
import type { AuthContext } from '../auth/session';
import { OPEN_STATUSES, audit, loadEntity, type EntityType } from './core';

export type RouteFn = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, roles: readonly Role[], handler: (req: FastifyRequest, reply: FastifyReply, a: AuthContext) => Promise<unknown>) => void;

const EDITORS: readonly Role[] = ['editor', 'admin'];
const ADMINS: readonly Role[] = ['admin'];
const uuid = z.string().uuid();

/** Recheck (ToR F9): the review queue. Findings are only suggestions; nothing here edits published data. */
export function registerRecheckRoutes(route: RouteFn, d: { prisma: PrismaClient; secret: string }) {
  const { prisma, secret } = d;

  route('GET', '/recheck/runs', EDITORS, async () => {
    const items = await prisma.recheckRun.findMany({ orderBy: { createdAt: 'desc' }, take: 12 });
    return { items };
  });

  /** Queues a run for the worker. Only one waiting or running run at a time. */
  route('POST', '/recheck/run', ADMINS, async (req, reply, a) => {
    const busy = await prisma.recheckRun.findFirst({ where: { status: { in: ['queued', 'running'] } } });
    if (busy) throw new ApiError(409, 'recheck_busy', 'A recheck is already waiting or running', { runId: busy.id, status: busy.status });
    const run = await prisma.$transaction(async (tx) => {
      const r = await tx.recheckRun.create({ data: { trigger: 'manual', status: 'queued', requestedBy: a.user.id } });
      await audit(tx, req, secret, 'recheck.queue', 'recheck_run', r.id);
      return r;
    });
    return reply.status(202).send({ id: run.id, status: run.status });
  });

  route('GET', '/recheck/findings', EDITORS, async (req) => {
    const q = z.object({ status: z.enum(['open', 'accepted', 'dismissed']).default('open'), kind: z.enum(['changed', 'broken', 'blocked', 'moved']).optional(), limit: z.coerce.number().int().min(1).max(200).default(100) }).parse(req.query ?? {});
    const rows = await prisma.recheckFinding.findMany({ where: { status: q.status, ...(q.kind ? { kind: q.kind } : {}) }, include: { source: true, run: { select: { startedAt: true, createdAt: true } } }, orderBy: { run: { createdAt: 'desc' } }, take: q.limit });
    const urls = [...new Set(rows.map((r) => r.source.url))];
    const sharing = urls.length ? await prisma.source.findMany({ where: { url: { in: urls } }, select: { url: true, entityType: true, entityId: true, field: true } }) : [];
    return {
      count: rows.length,
      items: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        status: r.status,
        url: r.source.url,
        entities: sharing.filter((s) => s.url === r.source.url).map((s) => ({ type: s.entityType, id: s.entityId, field: s.field })),
        snippet: r.diffSnippet,
        oldHash: r.oldHash,
        newHash: r.newHash,
        httpStatus: r.httpStatus,
        finalUrl: r.finalUrl,
        note: r.note,
        previouslyCheckedAt: r.prevCheckedAt,
        checkedAt: r.run.startedAt ?? r.run.createdAt,
      })),
    };
  });

  /** Accepting opens a DRAFT for the editor from the current published record. It changes no value by itself. */
  route('POST', '/recheck/findings/:id/accept', ADMINS, async (req, _reply, a) => {
    const { id } = z.object({ id: uuid }).parse(req.params);
    const f = await prisma.recheckFinding.findUnique({ where: { id }, include: { source: true } });
    if (!f) throw notFound('Finding');
    if (f.status !== 'open') throw new ApiError(409, 'not_open', 'This finding was already handled');
    const type = f.source.entityType as EntityType;
    const ent = await loadEntity(prisma, type, f.source.entityId);
    if (!ent) throw notFound('Record');
    const existing = await prisma.catalogueRevision.findFirst({ where: { entityType: type, entityId: f.source.entityId, status: { in: [...OPEN_STATUSES] } }, select: { id: true } });
    const out = await prisma.$transaction(async (tx) => {
      let revisionId = existing?.id;
      if (!revisionId) {
        const r = await tx.catalogueRevision.create({ data: { entityType: type, entityId: f.source.entityId, version: ent.version, data: ent.record as Prisma.InputJsonValue, status: 'draft', authorId: a.user.id }, select: { id: true } });
        revisionId = r.id;
        await audit(tx, req, secret, 'revision.create', type, f.source.entityId, { revisionId, via: 'recheck', findingId: id });
      }
      await tx.recheckFinding.update({ where: { id }, data: { status: 'accepted', reviewedBy: a.user.id, reviewedAt: new Date() } });
      await audit(tx, req, secret, 'recheck.accept', type, f.source.entityId, { findingId: id, kind: f.kind, url: f.source.url, revisionId });
      return { revisionId, created: !existing };
    });
    return { ok: true, entityType: type, entityId: f.source.entityId, ...out };
  });

  route('POST', '/recheck/findings/:id/dismiss', ADMINS, async (req, _reply, a) => {
    const { id } = z.object({ id: uuid }).parse(req.params);
    const b = z.object({ note: z.string().max(500).optional() }).parse(req.body ?? {});
    const f = await prisma.recheckFinding.findUnique({ where: { id }, include: { source: true } });
    if (!f) throw notFound('Finding');
    if (f.status !== 'open') throw new ApiError(409, 'not_open', 'This finding was already handled');
    await prisma.$transaction(async (tx) => {
      await tx.recheckFinding.update({ where: { id }, data: { status: 'dismissed', reviewedBy: a.user.id, reviewedAt: new Date() } });
      await audit(tx, req, secret, 'recheck.dismiss', f.source.entityType, f.source.entityId, { findingId: id, kind: f.kind, url: f.source.url, note: b.note });
    });
    return { ok: true };
  });

  /** Links that refuse automation, to be opened by a person. */
  route('GET', '/recheck/manual', EDITORS, async () => {
    const rows = await prisma.source.findMany({ where: { blocksAutomation: true }, orderBy: [{ url: 'asc' }] });
    const byUrl = new Map<string, { url: string; lastCheckedAt: Date | null; entities: Array<{ type: string; id: string; field: string }> }>();
    for (const r of rows) {
      const e = byUrl.get(r.url) ?? { url: r.url, lastCheckedAt: r.lastCheckedAt, entities: [] };
      e.entities.push({ type: r.entityType, id: r.entityId, field: r.field });
      byUrl.set(r.url, e);
    }
    return { count: byUrl.size, items: [...byUrl.values()] };
  });

  /** "I opened this page myself and it is fine." Records the date; it does not change the catalogue. */
  route('POST', '/recheck/manual/checked', EDITORS, async (req) => {
    const b = z.object({ url: z.string().url().max(2000) }).parse(req.body);
    const n = await prisma.$transaction(async (tx) => {
      const r = await tx.source.updateMany({ where: { url: b.url, blocksAutomation: true }, data: { lastCheckedAt: new Date(), lastStatus: 'checked_manually' } });
      if (r.count) await audit(tx, req, secret, 'recheck.manual_checked', 'source', b.url.slice(0, 200));
      return r.count;
    });
    if (!n) throw notFound('Link');
    return { ok: true };
  });
}
