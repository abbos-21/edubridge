import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, type PrismaClient, type Role } from '@prisma/client';
import { z } from 'zod';
import { checkCatalogue } from '@edubridge/shared';
import type { Config } from '../config';
import { ApiError, badRequest, notFound } from '../errors';
import { toUniversityRecord, type CatalogRepo } from '../lib/catalogRepo';
import type { AuthContext } from '../auth/session';
import { dayStart, monthStart } from '../ai/guard';
import { ENTITY_TYPES, OPEN_STATUSES, applyRecord, audit, authorise, bumpCatalogueVersion, changesOf, loadEntity, validateDraft, type EntityType } from '../admin/core';
import { gapsReport } from '../admin/gaps';
import { toCsv, grantRows, universityRows } from '../admin/exporter';
import { registerRecheckRoutes } from '../admin/recheckRoutes';

export type AdminRouteInfo = { method: string; url: string; roles: readonly Role[] };
type Deps = { config: Config; prisma: PrismaClient; repo: CatalogRepo; secret: string };

const EDITORS: readonly Role[] = ['editor', 'admin'];
const ADMINS: readonly Role[] = ['admin'];
const typeP = z.enum(ENTITY_TYPES);
const uuid = z.string().uuid();

/** Registers every /admin route. Each one declares the roles that may call it; nothing else is reachable. */
export function registerAdminRoutes(app: FastifyInstance, d: Deps): AdminRouteInfo[] {
  const { config, prisma, repo, secret } = d;
  const routes: AdminRouteInfo[] = [];

  function route(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, roles: readonly Role[], handler: (req: FastifyRequest, reply: FastifyReply, a: AuthContext) => Promise<unknown>) {
    routes.push({ method, url: `/admin${url}`, roles });
    app.route({
      method,
      url: `/admin${url}`,
      handler: async (req, reply) => {
        const a = authorise(req, config, roles);
        reply.header('cache-control', 'no-store');
        return handler(req, reply, a);
      },
    });
  }
  const params = <T extends z.ZodType>(req: FastifyRequest, s: T): z.infer<T> => s.parse(req.params);
  const query = <T extends z.ZodType>(req: FastifyRequest, s: T): z.infer<T> => s.parse(req.query ?? {});
  const body = <T extends z.ZodType>(req: FastifyRequest, s: T): z.infer<T> => s.parse(req.body ?? {});

  // ------------------------------------------------------------------ who am I

  route('GET', '/me', EDITORS, async (_req, _reply, a) => ({
    role: a.user.role,
    reauthRequiredAfter: new Date(a.signedInAt.getTime() + config.ADMIN_REAUTH_MINUTES * 60_000).toISOString(),
  }));

  // ------------------------------------------------------------------ catalogue records

  route('GET', '/entities', EDITORS, async (req) => {
    const q = query(req, z.object({ type: typeP.default('university'), q: z.string().max(80).optional(), country: z.string().max(3).optional(), status: z.enum(['published', 'hidden']).optional() }));
    const text = q.q?.trim();
    const [marks, open] = await Promise.all([
      prisma.catalogueMark.findMany({ where: { entityType: q.type } }),
      prisma.catalogueRevision.findMany({ where: { entityType: q.type, status: { in: [...OPEN_STATUSES] } }, select: { id: true, entityId: true, status: true } }),
    ]);
    const markOf = new Map(marks.map((m) => [m.entityId, m]));
    const openOf = new Map(open.map((r) => [r.entityId, r]));
    const common = { ...(q.status ? { status: q.status } : {}) };
    const textWhere = text ? { OR: [{ name: { contains: text, mode: 'insensitive' as const } }, { id: { contains: text, mode: 'insensitive' as const } }] } : {};
    const rows =
      q.type === 'university'
        ? (await prisma.university.findMany({ where: { ...common, ...textWhere, ...(q.country ? { countryCode: q.country.toUpperCase() } : {}) }, orderBy: [{ countryCode: 'asc' }, { position: 'asc' }] })).map((u) => ({ id: u.id, name: u.name, country: u.countryCode, status: u.status, version: u.version, lastChecked: u.lastChecked as string | null, detail: u.tier as string | null }))
        : (await prisma.grant.findMany({ where: { ...common, ...textWhere, ...(q.country ? { country: q.country.toUpperCase() } : {}) }, orderBy: [{ kind: 'asc' }, { position: 'asc' }] })).map((g) => ({ id: g.id, name: g.name, country: g.country, status: g.status, version: g.version, lastChecked: g.checked as string | null, detail: g.kind as string | null }));
    return {
      type: q.type,
      count: rows.length,
      items: rows.map((r) => ({ ...r, reviewedAt: markOf.get(r.id)?.reviewedAt ?? null, openRevision: openOf.get(r.id) ?? null })),
    };
  });

  route('GET', '/entities/:type/:id', EDITORS, async (req) => {
    const p = params(req, z.object({ type: typeP, id: z.string().min(1).max(120) }));
    const e = await loadEntity(prisma, p.type, p.id);
    if (!e) throw notFound('Record');
    const [mark, revisions, sources] = await Promise.all([
      prisma.catalogueMark.findUnique({ where: { entityType_entityId: { entityType: p.type, entityId: p.id } } }),
      prisma.catalogueRevision.findMany({ where: { entityType: p.type, entityId: p.id }, orderBy: { createdAt: 'desc' }, take: 20, select: revisionSelect }),
      prisma.source.findMany({ where: { entityType: p.type, entityId: p.id }, orderBy: [{ field: 'asc' }] }),
    ]);
    return { ...e, mark, revisions, sources };
  });

  route('POST', '/entities/:type/:id/reviewed', EDITORS, async (req, _reply, a) => {
    const p = params(req, z.object({ type: typeP, id: z.string().min(1).max(120) }));
    const b = body(req, z.object({ reviewed: z.boolean(), note: z.string().max(500).optional() }));
    if (!(await loadEntity(prisma, p.type, p.id))) throw notFound('Record');
    const key = { entityType_entityId: { entityType: p.type, entityId: p.id } };
    await prisma.$transaction(async (tx) => {
      await tx.catalogueMark.upsert({
        where: key,
        create: { entityType: p.type, entityId: p.id, reviewedAt: b.reviewed ? new Date() : null, reviewedBy: b.reviewed ? a.user.id : null, note: b.note ?? null },
        update: { reviewedAt: b.reviewed ? new Date() : null, reviewedBy: b.reviewed ? a.user.id : null, note: b.note ?? null },
      });
      await audit(tx, req, secret, b.reviewed ? 'mark.reviewed' : 'mark.unreviewed', p.type, p.id, b.note ? { note: b.note } : undefined);
    });
    return { ok: true };
  });

  route('POST', '/entities/:type/:id/hide', ADMINS, async (req, _reply, a) => {
    const p = params(req, z.object({ type: typeP, id: z.string().min(1).max(120) }));
    const b = body(req, z.object({ hidden: z.boolean(), reason: z.string().trim().min(3).max(500) }));
    const e = await loadEntity(prisma, p.type, p.id);
    if (!e) throw notFound('Record');
    const next = b.hidden ? 'hidden' : 'published';
    if (e.status === next) return { ok: true, changed: false, status: next };
    const version = await prisma.$transaction(async (tx) => {
      const data = { status: next as 'hidden' | 'published', version: { increment: 1 } };
      if (p.type === 'university') await tx.university.update({ where: { id: p.id }, data });
      else await tx.grant.update({ where: { id: p.id }, data });
      const v = await bumpCatalogueVersion(tx);
      await audit(tx, req, secret, b.hidden ? 'entity.hide' : 'entity.unhide', p.type, p.id, { reason: b.reason, by: a.user.id, catalogueVersion: v });
      return v;
    });
    repo.invalidate();
    return { ok: true, changed: true, status: next, catalogueVersion: version };
  });

  // ------------------------------------------------------------------ revisions: draft -> review -> published

  const revisionSelect = { id: true, entityType: true, entityId: true, version: true, status: true, authorId: true, reviewedBy: true, reviewedAt: true, comment: true, createdAt: true } as const;
  const canEdit = (rev: { authorId: string | null }, a: AuthContext) => a.user.role === 'admin' || rev.authorId === a.user.id;
  const revId = z.object({ id: uuid });

  async function mustRevision(id: string) {
    const r = await prisma.catalogueRevision.findUnique({ where: { id } });
    if (!r) throw notFound('Revision');
    return r;
  }
  const unsourced = (issues: unknown[]) => new ApiError(422, 'invalid_draft', 'This draft breaks the data rules, so it cannot be saved', { issues });

  route('GET', '/revisions', EDITORS, async (req) => {
    const q = query(req, z.object({ status: z.enum(['open', 'draft', 'in_review', 'rejected', 'published', 'superseded']).optional(), entityType: typeP.optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }));
    const where: Prisma.CatalogueRevisionWhereInput = {
      ...(q.entityType ? { entityType: q.entityType } : {}),
      ...(q.status ? { status: q.status === 'open' ? { in: [...OPEN_STATUSES] } : q.status } : {}),
    };
    const items = await prisma.catalogueRevision.findMany({ where, orderBy: { createdAt: 'desc' }, take: q.limit, select: revisionSelect });
    return { count: items.length, items };
  });

  route('GET', '/revisions/:id', EDITORS, async (req) => {
    const { id } = params(req, revId);
    const rev = await mustRevision(id);
    const type = rev.entityType as EntityType;
    const current = await loadEntity(prisma, type, rev.entityId);
    const v = validateDraft(type, rev.data, current?.record);
    return {
      revision: { ...rev, data: undefined },
      data: rev.data,
      published: current?.record ?? null,
      changes: changesOf(current?.record, rev.data),
      issues: v.issues,
      stale: !!current && current.version !== rev.version,
    };
  });

  route('POST', '/revisions', EDITORS, async (req, reply, a) => {
    const b = body(req, z.object({ entityType: typeP, entityId: z.string().min(1).max(120) }));
    const e = await loadEntity(prisma, b.entityType, b.entityId);
    if (!e) throw notFound('Record');
    const existing = await prisma.catalogueRevision.findFirst({ where: { entityType: b.entityType, entityId: b.entityId, status: { in: [...OPEN_STATUSES] } }, select: revisionSelect });
    if (existing) throw new ApiError(409, 'revision_open', 'This record already has a draft in progress', { revisionId: existing.id, status: existing.status });
    try {
      const rev = await prisma.$transaction(async (tx) => {
        const r = await tx.catalogueRevision.create({ data: { entityType: b.entityType, entityId: b.entityId, version: e.version, data: e.record as Prisma.InputJsonValue, status: 'draft', authorId: a.user.id }, select: revisionSelect });
        await audit(tx, req, secret, 'revision.create', b.entityType, b.entityId, { revisionId: r.id, baseVersion: e.version });
        return r;
      });
      return reply.status(201).send(rev);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new ApiError(409, 'revision_open', 'This record already has a draft in progress');
      throw err;
    }
  });

  route('PUT', '/revisions/:id', EDITORS, async (req, _reply, a) => {
    const { id } = params(req, revId);
    const b = body(req, z.object({ data: z.record(z.string(), z.unknown()) }));
    const rev = await mustRevision(id);
    if (!canEdit(rev, a)) throw new ApiError(403, 'forbidden', 'This draft belongs to another editor');
    if (rev.status !== 'draft' && rev.status !== 'rejected') throw new ApiError(409, 'not_editable', 'Only a draft can be edited');
    const type = rev.entityType as EntityType;
    const current = await loadEntity(prisma, type, rev.entityId);
    if (!current) throw notFound('Record');
    const v = validateDraft(type, b.data, current.record);
    if (v.issues.length || !v.record) throw unsourced(v.issues);
    const changes = changesOf(current.record, v.record);
    await prisma.$transaction(async (tx) => {
      await tx.catalogueRevision.update({ where: { id }, data: { data: v.record as Prisma.InputJsonValue, status: 'draft' } });
      await audit(tx, req, secret, 'revision.save', rev.entityType, rev.entityId, changes);
    });
    return { ok: true, changes: changes.length };
  });

  route('POST', '/revisions/:id/submit', EDITORS, async (req, _reply, a) => {
    const { id } = params(req, revId);
    const rev = await mustRevision(id);
    if (!canEdit(rev, a)) throw new ApiError(403, 'forbidden', 'This draft belongs to another editor');
    if (rev.status !== 'draft' && rev.status !== 'rejected') throw new ApiError(409, 'not_editable', 'Only a draft can be sent for review');
    const type = rev.entityType as EntityType;
    const current = await loadEntity(prisma, type, rev.entityId);
    if (!current) throw notFound('Record');
    const v = validateDraft(type, rev.data, current.record);
    if (v.issues.length) throw unsourced(v.issues);
    const changes = changesOf(current.record, rev.data);
    if (!changes.length) throw new ApiError(400, 'no_changes', 'There is nothing to review: the draft equals the published record');
    await prisma.$transaction(async (tx) => {
      await tx.catalogueRevision.update({ where: { id }, data: { status: 'in_review', comment: null } });
      await audit(tx, req, secret, 'revision.submit', rev.entityType, rev.entityId, { revisionId: id, changes: changes.length });
    });
    return { ok: true, status: 'in_review' };
  });

  route('DELETE', '/revisions/:id', EDITORS, async (req, reply, a) => {
    const { id } = params(req, revId);
    const rev = await mustRevision(id);
    if (!canEdit(rev, a)) throw new ApiError(403, 'forbidden', 'This draft belongs to another editor');
    if (!(OPEN_STATUSES as readonly string[]).includes(rev.status)) throw new ApiError(409, 'not_editable', 'A published revision cannot be discarded');
    await prisma.$transaction(async (tx) => {
      await tx.catalogueRevision.delete({ where: { id } });
      await audit(tx, req, secret, 'revision.discard', rev.entityType, rev.entityId, { revisionId: id });
    });
    return reply.status(204).send();
  });

  route('POST', '/revisions/:id/approve', ADMINS, async (req, _reply, a) => {
    const { id } = params(req, revId);
    const b = body(req, z.object({ comment: z.string().max(1000).optional() }));
    const rev = await mustRevision(id);
    if (rev.status !== 'in_review') throw new ApiError(409, 'not_in_review', 'Only a revision that is in review can be approved');
    const type = rev.entityType as EntityType;
    const current = await loadEntity(prisma, type, rev.entityId);
    if (!current) throw notFound('Record');
    if (current.version !== rev.version) throw new ApiError(409, 'stale_revision', 'The published record changed after this draft was started. Reject it and start again from the current version.', { baseVersion: rev.version, currentVersion: current.version });
    const v = validateDraft(type, rev.data, current.record);
    if (v.issues.length || !v.record) throw unsourced(v.issues);
    const changes = changesOf(current.record, v.record);
    const version = await prisma.$transaction(async (tx) => {
      await applyRecord(tx, type, v.record!);
      await tx.catalogueRevision.update({ where: { id }, data: { status: 'published', reviewedBy: a.user.id, reviewedAt: new Date(), comment: b.comment ?? null } });
      const cv = await bumpCatalogueVersion(tx);
      await audit(tx, req, secret, 'revision.publish', rev.entityType, rev.entityId, changes);
      return cv;
    });
    repo.invalidate();
    return { ok: true, status: 'published', catalogueVersion: version };
  });

  route('POST', '/revisions/:id/reject', ADMINS, async (req, _reply, a) => {
    const { id } = params(req, revId);
    const b = body(req, z.object({ comment: z.string().trim().min(3).max(1000) }));
    const rev = await mustRevision(id);
    if (rev.status !== 'in_review') throw new ApiError(409, 'not_in_review', 'Only a revision that is in review can be rejected');
    await prisma.$transaction(async (tx) => {
      await tx.catalogueRevision.update({ where: { id }, data: { status: 'rejected', reviewedBy: a.user.id, reviewedAt: new Date(), comment: b.comment } });
      await audit(tx, req, secret, 'revision.reject', rev.entityType, rev.entityId, { revisionId: id, comment: b.comment });
    });
    return { ok: true, status: 'rejected' };
  });

  // ------------------------------------------------------------------ audit log

  route('GET', '/audit', EDITORS, async (req) => {
    const q = query(req, z.object({ entityType: z.string().max(40).optional(), entityId: z.string().max(120).optional(), actorId: uuid.optional(), action: z.string().max(60).optional(), before: z.iso.datetime().optional(), limit: z.coerce.number().int().min(1).max(200).default(50) }));
    const where: Prisma.AuditLogWhereInput = {
      ...(q.entityType ? { entityType: q.entityType } : {}),
      ...(q.entityId ? { entityId: q.entityId } : {}),
      ...(q.actorId ? { actorId: q.actorId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.before ? { createdAt: { lt: new Date(q.before) } } : {}),
    };
    const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: q.limit });
    const actors = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorId).filter((x): x is string => !!x))] } }, select: { id: true, displayName: true, role: true } });
    const who = new Map(actors.map((u) => [u.id, u]));
    return {
      count: rows.length,
      next: rows.length === q.limit ? rows[rows.length - 1]!.createdAt.toISOString() : null,
      items: rows.map((r) => ({ id: r.id, action: r.action, entityType: r.entityType, entityId: r.entityId, diff: r.diff, createdAt: r.createdAt, actor: r.actorId ? (who.get(r.actorId) ?? { id: r.actorId, displayName: null, role: null }) : null })),
    };
  });

  // ------------------------------------------------------------------ data quality

  route('GET', '/gaps', EDITORS, async (req) => {
    const q = query(req, z.object({ staleDays: z.coerce.number().int().min(1).max(3650).default(180) }));
    return gapsReport(await allUniversities(), q.staleDays);
  });

  /** Every university row (including hidden ones), in the public record shape. */
  async function allUniversities() {
    const rows = await prisma.university.findMany({ include: { levels: true }, orderBy: [{ countryCode: 'asc' }, { position: 'asc' }] });
    return rows.map((r) => ({ ...toUniversityRecord(r), status: r.status }));
  }

  route('GET', '/check', EDITORS, async () => {
    const all = await allUniversities();
    const published = all.filter((u) => u.status === 'published');
    const structure = checkCatalogue(published);
    const invalid = all
      .map((u) => ({ id: u.id, issues: validateDraft('university', u, u).issues }))
      .filter((x) => x.issues.length);
    return {
      checkedAt: new Date().toISOString(),
      universities: all.length,
      published: published.length,
      hidden: all.length - published.length,
      problems: structure.problems,
      violations: structure.violations,
      invalid,
      ok: structure.problems.length === 0 && structure.violations.length === 0 && invalid.length === 0,
    };
  });

  route('GET', '/export', EDITORS, async (req, reply) => {
    const q = query(req, z.object({ type: typeP.default('university'), format: z.enum(['json', 'csv']).default('json') }));
    if (q.type === 'university') {
      const all = await allUniversities();
      if (q.format === 'json') return { type: q.type, count: all.length, items: all };
      reply.header('content-disposition', 'attachment; filename="universities.csv"').type('text/csv; charset=utf-8');
      return toCsv(universityRows(all));
    }
    const grants = await prisma.grant.findMany({ orderBy: [{ kind: 'asc' }, { position: 'asc' }] });
    const recs = grants.map((g) => ({ ...(g.data as object), id: g.id, kind: g.kind, name: g.name, country: g.country, checked: g.checked, status: g.status }));
    if (q.format === 'json') return { type: q.type, count: recs.length, items: recs };
    reply.header('content-disposition', 'attachment; filename="grants.csv"').type('text/csv; charset=utf-8');
    return toCsv(grantRows(recs as Array<Record<string, unknown>>));
  });

  // ------------------------------------------------------------------ users and AI

  route('GET', '/users', ADMINS, async (req) => {
    const q = query(req, z.object({ q: z.string().max(60).optional(), role: z.enum(['student', 'editor', 'admin']).optional(), limit: z.coerce.number().int().min(1).max(200).default(100) }));
    const users = await prisma.user.findMany({
      where: { ...(q.role ? { role: q.role } : {}), ...(q.q ? { OR: [{ displayName: { contains: q.q, mode: 'insensitive' } }, ...(uuid.safeParse(q.q).success ? [{ id: q.q }] : [])] } : {}) },
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      include: { identities: { select: { provider: true } } },
    });
    const ids = users.map((u) => u.id);
    const [today, month] = await Promise.all([
      prisma.aiUsage.groupBy({ by: ['userId'], where: { userId: { in: ids }, createdAt: { gte: dayStart() } }, _count: { _all: true } }),
      prisma.aiUsage.groupBy({ by: ['userId'], where: { userId: { in: ids }, createdAt: { gte: monthStart() } }, _count: { _all: true }, _sum: { costUsdEst: true } }),
    ]);
    const t = new Map(today.map((x) => [x.userId, x._count._all]));
    const m = new Map(month.map((x) => [x.userId, x]));
    return {
      count: users.length,
      dailyLimit: config.AI_DAILY_REQUESTS_PER_USER,
      items: users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        role: u.role,
        lang: u.lang,
        createdAt: u.createdAt,
        suspendedAi: u.suspendedAi,
        providers: [...new Set(u.identities.map((i) => i.provider))],
        aiToday: t.get(u.id) ?? 0,
        aiMonthRequests: m.get(u.id)?._count._all ?? 0,
        aiMonthCostUsd: Number(m.get(u.id)?._sum.costUsdEst ?? 0),
      })),
    };
  });

  route('PATCH', '/users/:id/role', ADMINS, async (req, _reply, a) => {
    const { id } = params(req, revId);
    const b = body(req, z.object({ role: z.enum(['student', 'editor', 'admin']) }));
    if (id === a.user.id) throw new ApiError(400, 'self_role', 'You cannot change your own role');
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw notFound('User');
    if (u.role === b.role) return { ok: true, changed: false };
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { role: b.role } });
      await audit(tx, req, secret, 'user.role', 'user', id, { from: u.role, to: b.role });
    });
    return { ok: true, changed: true, role: b.role };
  });

  route('PATCH', '/users/:id/ai', ADMINS, async (req) => {
    const { id } = params(req, revId);
    const b = body(req, z.object({ suspended: z.boolean() }));
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw notFound('User');
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { suspendedAi: b.suspended } });
      await audit(tx, req, secret, b.suspended ? 'user.ai_suspend' : 'user.ai_restore', 'user', id);
    });
    return { ok: true, suspended: b.suspended };
  });

  route('GET', '/ai/usage', ADMINS, async (req) => {
    const q = query(req, z.object({ days: z.coerce.number().int().min(1).max(90).default(30) }));
    const since = new Date(Date.now() - q.days * 86_400_000);
    const [perDay, perTask, perUser, monthAgg, todayCount, byStatus] = await Promise.all([
      prisma.$queryRaw<Array<{ day: string; n: bigint; cost: Prisma.Decimal }>>`
        SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD') AS day, count(*) AS n, coalesce(sum("costUsdEst"), 0) AS cost
        FROM "AiUsage" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
      prisma.aiUsage.groupBy({ by: ['task'], where: { createdAt: { gte: since } }, _count: { _all: true }, _sum: { costUsdEst: true, inputTokens: true, outputTokens: true } }),
      prisma.aiUsage.groupBy({ by: ['userId'], where: { createdAt: { gte: since }, userId: { not: null } }, _count: { _all: true }, _sum: { costUsdEst: true }, orderBy: { _sum: { costUsdEst: 'desc' } }, take: 20 }),
      prisma.aiUsage.aggregate({ where: { createdAt: { gte: monthStart() } }, _sum: { costUsdEst: true }, _count: { _all: true } }),
      prisma.aiUsage.count({ where: { createdAt: { gte: dayStart() } } }),
      prisma.aiUsage.groupBy({ by: ['status'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    ]);
    const names = await prisma.user.findMany({ where: { id: { in: perUser.map((x) => x.userId!).filter(Boolean) } }, select: { id: true, displayName: true, suspendedAi: true } });
    const nm = new Map(names.map((u) => [u.id, u]));
    const spent = Number(monthAgg._sum.costUsdEst ?? 0);
    return {
      days: q.days,
      note: 'Costs are estimates from token counts and the configured prices, not invoices.',
      month: { requests: monthAgg._count._all, spentUsd: spent, budgetUsd: config.AI_MONTHLY_BUDGET_USD, percent: config.AI_MONTHLY_BUDGET_USD > 0 ? Math.round((spent / config.AI_MONTHLY_BUDGET_USD) * 1000) / 10 : null, paused: spent >= config.AI_MONTHLY_BUDGET_USD },
      today: { requests: todayCount, dailyLimitPerUser: config.AI_DAILY_REQUESTS_PER_USER },
      aiEnabled: config.AI_ENABLED,
      perDay: perDay.map((r) => ({ day: r.day, requests: Number(r.n), costUsd: Number(r.cost) })),
      perTask: perTask.map((r) => ({ task: r.task, requests: r._count._all, costUsd: Number(r._sum.costUsdEst ?? 0), inputTokens: r._sum.inputTokens ?? 0, outputTokens: r._sum.outputTokens ?? 0 })).sort((a, b) => b.costUsd - a.costUsd),
      perUser: perUser.map((r) => ({ userId: r.userId, displayName: nm.get(r.userId!)?.displayName ?? null, suspendedAi: nm.get(r.userId!)?.suspendedAi ?? false, requests: r._count._all, costUsd: Number(r._sum.costUsdEst ?? 0) })),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    };
  });

  // ------------------------------------------------------------------ demo snapshots (saved real AI results)

  route('POST', '/demo-snapshots', ADMINS, async (req, reply, a) => {
    const b = body(req, z.object({ kind: z.enum(['document_analysis', 'interview_feedback', 'coach_plan']), title: z.string().trim().min(3).max(120), lang: z.enum(['uz', 'ru', 'en']).optional(), payload: z.record(z.string(), z.unknown()) }));
    if (JSON.stringify(b.payload).length > 200_000) throw badRequest('The snapshot is too large (200 KB at most)');
    const snap = await prisma.$transaction(async (tx) => {
      // A result produced by the canned mock is a sample, never a real answer: remember that on the server.
      const s = await tx.demoSnapshot.create({ data: { kind: b.kind, title: b.title, lang: b.lang ?? null, payload: b.payload as Prisma.InputJsonValue, mock: config.AI_MOCK, savedBy: a.user.id } });
      await audit(tx, req, secret, 'demo.save', 'demo_snapshot', s.id, { kind: b.kind, title: b.title, mock: s.mock });
      return s;
    });
    return reply.status(201).send({ id: snap.id, kind: snap.kind, title: snap.title, mock: snap.mock, savedAt: snap.savedAt });
  });

  route('DELETE', '/demo-snapshots/:id', ADMINS, async (req, reply) => {
    const { id } = params(req, revId);
    const s = await prisma.demoSnapshot.findUnique({ where: { id } });
    if (!s) throw notFound('Snapshot');
    await prisma.$transaction(async (tx) => {
      await tx.demoSnapshot.delete({ where: { id } });
      await audit(tx, req, secret, 'demo.delete', 'demo_snapshot', id, { title: s.title });
    });
    return reply.status(204).send();
  });

  registerRecheckRoutes(route, { prisma, secret });
  return routes;
}
