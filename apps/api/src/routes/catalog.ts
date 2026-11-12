import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError, badRequest, notFound } from '../errors';
import { requireRole } from '../auth/roles';
import { hashIp } from '../auth/session';
import { CatalogStore, isDataset, keyOf, type DatasetName } from '../lib/catalogStore';

type Rec = Record<string, unknown>;
const isObj = (x: unknown): x is Rec => !!x && typeof x === 'object' && !Array.isArray(x);
const title = (r: unknown): string => (isObj(r) ? String((typeof r.name === 'string' ? r.name : isObj(r.name) ? (r.name as Rec).en : r.title ?? r.id ?? '') ?? '') : String(r));

/** A short diff for the audit log: which top-level fields changed. */
function changed(before: unknown, after: unknown): Record<string, { before: unknown; after: unknown }> {
  const out: Record<string, { before: unknown; after: unknown }> = {};
  const b = isObj(before) ? before : {};
  const a = isObj(after) ? after : {};
  for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) out[k] = { before: b[k] ?? null, after: a[k] ?? null };
  return out;
}

export function registerCatalogRoutes(app: FastifyInstance, d: { config: Config; prisma: PrismaClient; store: CatalogStore; secret: string }) {
  const { config, store } = d;

  // ---- public: the app loads this once at start -------------------------------------------------
  app.get('/catalog', async (req, reply) => {
    const version = await store.version();
    if (version < 1) throw new ApiError(503, 'catalog_empty', 'The catalogue has not been imported yet.');
    const etag = `"catalog-${version}"`;
    reply.header('etag', etag).header('cache-control', 'public, max-age=60, must-revalidate');
    if (req.headers['if-none-match'] === etag) return reply.status(304).send();
    return store.publicCatalog();
  });
  app.get('/catalog/version', async () => ({ version: await store.version() }));

  // ---- staff: read and edit records --------------------------------------------------------------
  app.get('/admin/catalog', async (req) => {
    requireRole(req, config, ['editor', 'admin']);
    const raw = await store.raw();
    return { version: await store.version(), datasets: Object.entries(raw).map(([name, data]) => ({ name, kind: Array.isArray(data) ? 'records' : 'value', count: Array.isArray(data) ? data.length : null })) };
  });

  app.get<{ Params: { name: string }; Querystring: { q?: string } }>('/admin/catalog/:name', async (req) => {
    requireRole(req, config, ['editor', 'admin']);
    if (!isDataset(req.params.name)) throw notFound('dataset');
    const data = await store.dataset(req.params.name);
    if (!Array.isArray(data)) return { name: req.params.name, kind: 'value', value: data };
    const q = (req.query.q ?? '').toLowerCase();
    const items = data
      .map((r, i) => ({ key: keyOf(r, i), title: title(r), hidden: isObj(r) && r.hidden === true }))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
    return { name: req.params.name, kind: 'records', count: data.length, items };
  });

  app.get<{ Params: { name: string; key: string } }>('/admin/catalog/:name/:key', async (req) => {
    requireRole(req, config, ['editor', 'admin']);
    const { name, key } = req.params;
    if (!isDataset(name)) throw notFound('dataset');
    const data = await store.dataset(name);
    if (!Array.isArray(data)) throw badRequest('This dataset is a single value; use PUT /admin/catalog/:name.');
    const i = data.findIndex((r, idx) => keyOf(r, idx) === key);
    if (i < 0) throw notFound('record');
    return { name, key, record: data[i] };
  });

  const recordBody = z.object({ record: z.record(z.string(), z.unknown()).refine((o) => JSON.stringify(o).length <= 500_000, 'record too large') }).strict();

  app.put<{ Params: { name: string; key: string } }>('/admin/catalog/:name/:key', async (req) => {
    const auth = requireRole(req, config, ['editor', 'admin']);
    const { name, key } = req.params;
    if (!isDataset(name)) throw notFound('dataset');
    const { record } = recordBody.parse(req.body);
    const data = await store.dataset(name);
    if (!Array.isArray(data)) throw badRequest('This dataset is a single value; use PUT /admin/catalog/:name.');
    const i = data.findIndex((r, idx) => keyOf(r, idx) === key);
    if (i < 0) throw notFound('record');
    const next = [...data];
    next[i] = record;
    const version = await store.write(name, next, { actorId: auth.user.id, action: 'record.update', entityId: key, diff: changed(data[i], record), ipHash: hashIp(req.ip, d.secret) });
    return { version };
  });

  app.post<{ Params: { name: string } }>('/admin/catalog/:name', async (req, reply) => {
    const auth = requireRole(req, config, ['admin']);
    const name = req.params.name as DatasetName;
    if (!isDataset(name)) throw notFound('dataset');
    const { record } = recordBody.parse(req.body);
    const data = await store.dataset(name);
    if (!Array.isArray(data)) throw badRequest('This dataset is a single value.');
    const k = keyOf(record, data.length);
    if (data.some((r, idx) => keyOf(r, idx) === k)) throw new ApiError(409, 'exists', 'A record with this id already exists.');
    const version = await store.write(name, [...data, record], { actorId: auth.user.id, action: 'record.create', entityId: k, diff: record, ipHash: hashIp(req.ip, d.secret) });
    return reply.status(201).send({ version, key: k });
  });

  app.delete<{ Params: { name: string; key: string } }>('/admin/catalog/:name/:key', async (req) => {
    const auth = requireRole(req, config, ['admin']);
    const { name, key } = req.params;
    if (!isDataset(name)) throw notFound('dataset');
    const data = await store.dataset(name);
    if (!Array.isArray(data)) throw badRequest('This dataset is a single value.');
    const i = data.findIndex((r, idx) => keyOf(r, idx) === key);
    if (i < 0) throw notFound('record');
    const version = await store.write(name, data.filter((_, idx) => idx !== i), { actorId: auth.user.id, action: 'record.delete', entityId: key, diff: data[i], ipHash: hashIp(req.ip, d.secret) });
    return { version };
  });

  // single-value datasets (the "checked on" date, the country texts): admins only
  app.put<{ Params: { name: string } }>('/admin/catalog/:name', async (req) => {
    // editors may mark records inactive or reviewed (the "overrides" value); the other single values are admin-only
    const auth = requireRole(req, config, req.params.name === 'overrides' ? ['editor', 'admin'] : ['admin']);
    const name = req.params.name as DatasetName;
    if (!isDataset(name)) throw notFound('dataset');
    const { value } = z.object({ value: z.unknown() }).strict().parse(req.body);
    const data = await store.dataset(name);
    if (Array.isArray(data)) throw badRequest('This dataset holds records; edit them one by one.');
    const version = await store.write(name, value, { actorId: auth.user.id, action: 'value.update', entityId: name, diff: { before: data, after: value }, ipHash: hashIp(req.ip, d.secret) });
    return { version };
  });

  app.get<{ Querystring: { limit?: string } }>('/admin/audit', async (req) => {
    requireRole(req, config, ['editor', 'admin']);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const items = await d.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return { items };
  });
}
