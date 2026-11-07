import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ApiError, notFound } from '../errors';
import { requireAuth } from '../auth/session';

/**
 * Private student data. EVERY query below is scoped by the session's user id; a record that belongs to
 * someone else is indistinguishable from one that does not exist (404). Records carry a `version` for
 * optimistic concurrency: a write with a stale version gets 409 and the server copy.
 */

const jsonData = z.record(z.string(), z.unknown()).refine((o) => JSON.stringify(o).length <= 500_000, 'data too large');
const version = z.number().int().min(0).optional();
const uuid = z.uuid();

type Row = Record<string, any>;

type SingletonCfg = { path: string; model: 'profile' | 'growthPlan' | 'userSettings' };
type CollectionCfg = {
  path: string;
  model: 'application' | 'customEvent' | 'budget' | 'chatThread' | 'interview' | 'advisorDoc';
  cap: number;
  bodyLimit?: number;
  /** body schema for create and update */
  schema: z.ZodType<Row>;
  /** fields to store, in order, taken from the validated body */
  fields: string[];
};

export const SINGLETONS: SingletonCfg[] = [
  { path: 'profile', model: 'profile' },
  { path: 'growth', model: 'growthPlan' },
  { path: 'settings', model: 'userSettings' },
];

export const COLLECTIONS: CollectionCfg[] = [
  { path: 'applications', model: 'application', cap: 100, fields: ['opportunityRef', 'data'], schema: z.object({ opportunityRef: z.string().min(1).max(200), data: jsonData, version }).strict() },
  { path: 'events', model: 'customEvent', cap: 500, fields: ['data'], schema: z.object({ data: jsonData, version }).strict() },
  { path: 'budgets', model: 'budget', cap: 50, fields: ['data'], schema: z.object({ data: jsonData, version }).strict() },
  { path: 'chats', model: 'chatThread', cap: 200, fields: ['title', 'data'], schema: z.object({ title: z.string().max(200), data: jsonData, version }).strict() },
  { path: 'interviews', model: 'interview', cap: 100, fields: ['data'], schema: z.object({ data: jsonData, version }).strict() },
  {
    path: 'documents',
    model: 'advisorDoc',
    cap: 50,
    bodyLimit: 12_000_000,
    fields: ['kind', 'title', 'originalText', 'workingText', 'analysis', 'history'],
    schema: z
      .object({
        kind: z.string().min(1).max(40),
        title: z.string().max(200),
        // Text only (never the uploaded file). 2 MB per text.
        originalText: z.string().max(2_000_000),
        workingText: z.string().max(2_000_000),
        analysis: z.unknown().optional(),
        history: z.unknown().optional(),
        version,
      })
      .strict(),
  },
];

export const MAX_SAVED = 500;

const outSingleton = (r: Row) => ({ data: r.data, version: r.version, updatedAt: r.updatedAt });
const outCollection = (r: Row) => {
  const { userId: _u, ...rest } = r;
  return rest;
};

export function registerUserDataRoutes(app: FastifyInstance, d: { prisma: PrismaClient }) {
  const prisma = d.prisma as unknown as Record<string, any>;

  // ---------------------------------------------------------------- singletons
  for (const cfg of SINGLETONS) {
    const m = () => prisma[cfg.model];
    const url = `/me/${cfg.path}`;

    app.get(url, async (req) => {
      const { user } = requireAuth(req);
      const row = await m().findUnique({ where: { userId: user.id } });
      if (!row) throw notFound(cfg.path);
      return outSingleton(row);
    });

    app.put(url, async (req) => {
      const { user } = requireAuth(req);
      const b = z.object({ data: jsonData, version }).strict().parse(req.body);
      const existing = await m().findUnique({ where: { userId: user.id } });
      if (!existing) {
        if (b.version) throw new ApiError(404, 'not_found', `${cfg.path} not found`);
        try {
          return outSingleton(await m().create({ data: { userId: user.id, data: b.data } }));
        } catch (e) {
          if ((e as { code?: string }).code === 'P2002') {
            throw new ApiError(409, 'version_conflict', 'The record was created elsewhere', { server: outSingleton(await m().findUniqueOrThrow({ where: { userId: user.id } })) });
          }
          throw e;
        }
      }
      if (b.version !== existing.version) {
        throw new ApiError(409, 'version_conflict', 'The record changed on another device', { server: outSingleton(existing) });
      }
      const r = await m().updateMany({ where: { userId: user.id, version: existing.version }, data: { data: b.data, version: { increment: 1 } } });
      const row = await m().findUniqueOrThrow({ where: { userId: user.id } });
      if (r.count === 0) throw new ApiError(409, 'version_conflict', 'The record changed on another device', { server: outSingleton(row) });
      return outSingleton(row);
    });

    app.delete(url, async (req, reply) => {
      const { user } = requireAuth(req);
      await m().deleteMany({ where: { userId: user.id } });
      return reply.status(204).send();
    });
  }

  // --------------------------------------------------------------- collections
  for (const cfg of COLLECTIONS) {
    const m = () => prisma[cfg.model];
    const base = `/me/${cfg.path}`;
    const opts = cfg.bodyLimit ? { bodyLimit: cfg.bodyLimit } : {};
    const pickFields = (body: Row) => Object.fromEntries(cfg.fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

    app.get(base, async (req) => {
      const { user } = requireAuth(req);
      const rows: Row[] = await m().findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: cfg.cap });
      return { items: rows.map(outCollection) };
    });

    app.post(base, opts, async (req, reply) => {
      const { user } = requireAuth(req);
      const body = cfg.schema.parse(req.body);
      if ((await m().count({ where: { userId: user.id } })) >= cfg.cap) {
        throw new ApiError(409, 'limit_reached', `You can keep at most ${cfg.cap} items here. Delete one first.`);
      }
      const row = await m().create({ data: { userId: user.id, ...pickFields(body) } });
      return reply.status(201).send(outCollection(row));
    });

    app.get<{ Params: { id: string } }>(`${base}/:id`, async (req) => {
      const { user } = requireAuth(req);
      if (!uuid.safeParse(req.params.id).success) throw notFound(cfg.path);
      const row = await m().findFirst({ where: { id: req.params.id, userId: user.id } });
      if (!row) throw notFound(cfg.path);
      return outCollection(row);
    });

    app.put<{ Params: { id: string } }>(`${base}/:id`, opts, async (req) => {
      const { user } = requireAuth(req);
      if (!uuid.safeParse(req.params.id).success) throw notFound(cfg.path);
      const body = cfg.schema.parse(req.body);
      const existing = await m().findFirst({ where: { id: req.params.id, userId: user.id } });
      if (!existing) throw notFound(cfg.path);
      if ((body as Row).version !== existing.version) {
        throw new ApiError(409, 'version_conflict', 'The record changed on another device', { server: outCollection(existing) });
      }
      const r = await m().updateMany({
        where: { id: existing.id, userId: user.id, version: existing.version },
        data: { ...pickFields(body), version: { increment: 1 } },
      });
      const row = await m().findFirstOrThrow({ where: { id: existing.id, userId: user.id } });
      if (r.count === 0) throw new ApiError(409, 'version_conflict', 'The record changed on another device', { server: outCollection(row) });
      return outCollection(row);
    });

    app.delete<{ Params: { id: string } }>(`${base}/:id`, async (req, reply) => {
      const { user } = requireAuth(req);
      if (!uuid.safeParse(req.params.id).success) throw notFound(cfg.path);
      const r = await m().deleteMany({ where: { id: req.params.id, userId: user.id } });
      if (r.count === 0) throw notFound(cfg.path);
      return reply.status(204).send();
    });
  }

  // --------------------------------------------------------------------- saved
  const savedBody = z.object({ items: z.array(z.object({ kind: z.string().min(1).max(30), ref: z.string().min(1).max(200) }).strict()).max(MAX_SAVED) }).strict();

  app.get('/me/saved', async (req) => {
    const { user } = requireAuth(req);
    const rows = await d.prisma.savedItem.findMany({ where: { userId: user.id }, select: { kind: true, ref: true } });
    return { items: rows };
  });

  app.put('/me/saved', async (req) => {
    const { user } = requireAuth(req);
    const b = savedBody.parse(req.body);
    const unique = [...new Map(b.items.map((i) => [`${i.kind}|${i.ref}`, i])).values()];
    await d.prisma.$transaction([
      d.prisma.savedItem.deleteMany({ where: { userId: user.id } }),
      d.prisma.savedItem.createMany({ data: unique.map((i) => ({ userId: user.id, kind: i.kind, ref: i.ref })) }),
    ]);
    return { items: unique };
  });
}
