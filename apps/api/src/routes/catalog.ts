import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { COUNTRY_CODES, LEVELS, TIERS, searchUniversities } from '@edubridge/shared';
import type { CatalogRepo } from '../lib/catalogRepo';
import { badRequest, notFound } from '../errors';

const boolQ = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const searchQuery = z.object({
  q: z.string().max(100).optional(),
  country: z.enum(COUNTRY_CODES).optional(),
  tier: z.enum(TIERS).optional(),
  level: z.enum(LEVELS).optional(),
  subject: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  funding: boolQ.optional(),
  confirmedDeadline: boolQ.optional(),
  confirmedFee: boolQ.optional(),
  ielts: z.coerce.number().min(0).max(9).optional(),
});

type Cached = { body: string; etag: string; gzip: Buffer };

/**
 * The catalogue changes a few times a month and is read all day, so each distinct answer is built, hashed and
 * compressed once per catalogue version and then served from memory. (Under 200 concurrent first-time visitors
 * this took the full list from ~260 to thousands of requests per second.)
 */
class ResponseCache {
  private map = new Map<string, Cached>();
  private version = -1;
  private static readonly MAX = 300;

  get(version: number, key: string, build: () => unknown): Cached {
    if (version !== this.version) {
      this.map.clear();
      this.version = version;
    }
    let hit = this.map.get(key);
    if (!hit) {
      const body = JSON.stringify(build());
      hit = {
        body,
        etag: `W/"v${version}-${createHash('sha1').update(body).digest('base64url').slice(0, 16)}"`,
        gzip: gzipSync(body, { level: 6 }),
      };
      if (this.map.size >= ResponseCache.MAX) this.map.clear(); // distinct filter combinations are bounded by the schema; this is a backstop
      this.map.set(key, hit);
    }
    return hit;
  }
}

export function registerCatalogRoutes(app: FastifyInstance, repo: CatalogRepo) {
  const cache = new ResponseCache();

  /** Sends a cached JSON answer with a weak ETag; answers 304 when the client already has it. */
  function send(req: FastifyRequest, reply: FastifyReply, version: number, build: () => unknown) {
    const c = cache.get(version, req.url, build);
    reply.header('etag', c.etag).header('cache-control', 'public, max-age=60, must-revalidate').header('vary', 'Accept-Encoding').type('application/json');
    if (req.headers['if-none-match'] === c.etag) return reply.code(304).send();
    if (String(req.headers['accept-encoding'] ?? '').includes('gzip')) return reply.header('content-encoding', 'gzip').send(c.gzip);
    return reply.send(c.body);
  }

  app.get('/catalog/version', async (_req, reply) => {
    reply.header('cache-control', 'no-cache');
    return { version: await repo.version() };
  });

  app.get('/catalog/countries', async (req, reply) => {
    const s = await repo.snapshot();
    return send(req, reply, s.version, () => ({
      version: s.version,
      items: s.countries.map((c) => ({ ...c, universityCount: s.universities.filter((u) => u.country === c.code).length })),
    }));
  });

  app.get<{ Params: { code: string } }>('/catalog/countries/:code', async (req, reply) => {
    const code = req.params.code.toUpperCase();
    if (!(COUNTRY_CODES as readonly string[]).includes(code)) throw notFound('Country');
    const s = await repo.snapshot();
    const country = s.countries.find((c) => c.code === code);
    if (!country) throw notFound('Country');
    return send(req, reply, s.version, () => ({
      version: s.version,
      country,
      universities: s.universities.filter((u) => u.country === code),
      grants: s.grants.filter((g) => g.country === code),
    }));
  });

  app.get('/catalog/universities', async (req, reply) => {
    const parsed = searchQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest('Invalid query', parsed.error.flatten().fieldErrors);
    const s = await repo.snapshot();
    return send(req, reply, s.version, () => {
      const countriesWithGrant = new Set(s.grants.filter((g) => g.kind === 'national').map((g) => g.country));
      const hits = searchUniversities(s.universities, parsed.data, countriesWithGrant);
      return { version: s.version, count: hits.length, items: hits.map((h) => (h.ieltsStatus ? { ...h.university, ieltsStatus: h.ieltsStatus } : h.university)) };
    });
  });

  app.get<{ Params: { id: string } }>('/catalog/universities/:id', async (req, reply) => {
    const s = await repo.snapshot();
    const u = s.universities.find((x) => x.id === req.params.id);
    if (!u) throw notFound('University');
    return send(req, reply, s.version, () => ({ version: s.version, university: u }));
  });

  app.get('/catalog/compare', async (req, reply) => {
    const q = z.object({ ids: z.string().min(1), level: z.enum(LEVELS) }).safeParse(req.query);
    if (!q.success) throw badRequest('ids and level are required', q.error.flatten().fieldErrors);
    const ids = [...new Set(q.data.ids.split(',').map((x) => x.trim()).filter(Boolean))];
    if (ids.length < 2 || ids.length > 3) throw badRequest('Compare needs 2 or 3 distinct universities');
    const s = await repo.snapshot();
    const items = ids.map((id) => s.universities.find((u) => u.id === id));
    if (items.some((x) => !x)) throw notFound('University');
    return send(req, reply, s.version, () => ({ version: s.version, level: q.data.level, items: items.map((u) => ({ ...u!, level: u!.levels[q.data.level] ?? null })) }));
  });

  app.get('/catalog/grants', async (req, reply) => {
    const q = z.object({ kind: z.enum(['national', 'other']).optional(), country: z.string().max(3).optional() }).safeParse(req.query);
    if (!q.success) throw badRequest('Invalid query', q.error.flatten().fieldErrors);
    const s = await repo.snapshot();
    return send(req, reply, s.version, () => {
      const items = s.grants.filter((g) => (!q.data.kind || g.kind === q.data.kind) && (!q.data.country || g.country === q.data.country.toUpperCase()));
      return { version: s.version, count: items.length, items };
    });
  });

  app.get<{ Params: { id: string } }>('/catalog/grants/:id', async (req, reply) => {
    const s = await repo.snapshot();
    const g = s.grants.find((x) => x.id === req.params.id);
    if (!g) throw notFound('Grant');
    return send(req, reply, s.version, () => ({ version: s.version, grant: g }));
  });
}
