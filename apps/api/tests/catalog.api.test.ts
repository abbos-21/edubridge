import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { checkCatalogue, zUniversity } from '@edubridge/shared';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';
import { createPrisma } from '../src/db';

const url = process.env.DATABASE_URL_TEST!;
let app: FastifyInstance;

beforeAll(async () => {
  const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, APP_ORIGIN: 'http://localhost:5173' });
  app = await buildApp({ config, prisma: createPrisma(url) });
});
afterAll(async () => {
  await app.close();
});

const get = (path: string, headers: Record<string, string> = {}) => app.inject({ method: 'GET', url: `/api/v1${path}`, headers });

describe('health and errors', () => {
  it('/health is ok and carries a request id', async () => {
    const r = await get('/health');
    expect(r.statusCode).toBe(200);
    expect(r.headers['x-request-id']).toBeTruthy();
  });
  it('/ready reports the catalogue version', async () => {
    const r = await get('/ready');
    expect(r.statusCode).toBe(200);
    expect(r.json().catalogueVersion).toBeGreaterThanOrEqual(1);
  });
  it('unknown route uses the standard error shape', async () => {
    const r = await get('/nope');
    expect(r.statusCode).toBe(404);
    expect(r.json().error.code).toBe('not_found');
  });
  it('invalid query is a 400 validation error, not a 500', async () => {
    const r = await get('/catalog/universities?country=XX');
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe('bad_request');
  });
  it('sets security headers and restricts CORS to the app origin', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://evil.example' } });
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
    const ok = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'http://localhost:5173' } });
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('catalogue API', () => {
  it('lists 5 countries with 10 universities each', async () => {
    const r = await get('/catalog/countries');
    const items = r.json().items;
    expect(items.map((c: any) => c.code)).toEqual(['MY', 'HU', 'DE', 'TR', 'KR']);
    for (const c of items) expect(c.universityCount).toBe(10);
  });
  it('country records carry the guidance, document checklist and 5-7 steps per level', async () => {
    const items = (await get('/catalog/countries')).json().items;
    for (const c of items) {
      expect(c.name.en && c.name.uz && c.name.ru).toBeTruthy();
      expect(c.selection.en).toBeTruthy();
      expect(c.guidance.bachelor.en).toBeTruthy();
      expect(c.guidance.sources.length).toBeGreaterThan(0);
      for (const lvl of ['bachelor', 'master']) {
        expect(c.steps[lvl].length).toBeGreaterThanOrEqual(5);
        expect(c.steps[lvl].length).toBeLessThanOrEqual(7);
        expect(c.documents[lvl].every((d: any) => ['required', 'depends', 'optional'].includes(d.kind))).toBe(true);
      }
    }
  });
  it('returns a country page with its universities and grants', async () => {
    const r = await get('/catalog/countries/my');
    expect(r.statusCode).toBe(200);
    expect(r.json().universities).toHaveLength(10);
    expect((await get('/catalog/countries/ZZ')).statusCode).toBe(404);
  });
  it('API data obeys the Part C structural rules (same checks as the import)', async () => {
    const r = await get('/catalog/universities');
    const unis = r.json().items.map((x: unknown) => zUniversity.parse(x));
    expect(unis).toHaveLength(50);
    const report = checkCatalogue(unis);
    expect(report.problems).toEqual([]);
    expect(report.violations).toEqual([]);
  });
  it('missing QS stays null (never invented) for exactly the 5 known universities', async () => {
    const items = (await get('/catalog/universities')).json().items;
    const missing = items.filter((u: any) => u.ranking?.value == null).map((u: any) => u.id).sort();
    expect(missing).toHaveLength(5);
  });
  it('filters by tier and level', async () => {
    const r = await get('/catalog/universities?country=DE&tier=selective&level=master');
    const items = r.json().items;
    expect(items.length).toBeGreaterThan(0);
    for (const u of items) {
      expect(u.country).toBe('DE');
      expect(u.tier).toBe('selective');
    }
  });
  it('finds a university by abbreviation, ignoring Turkish diacritics', async () => {
    const r = await get('/catalog/universities?q=' + encodeURIComponent('istanbul'));
    expect(r.json().count).toBeGreaterThan(0);
    const odtu = await get('/catalog/universities?q=' + encodeURIComponent('ODTÜ'));
    const odtu2 = await get('/catalog/universities?q=odtu');
    expect(odtu.json().count).toBe(odtu2.json().count);
  });
  it('IELTS filter only annotates; unconfirmed minimums are never "meets"', async () => {
    const items = (await get('/catalog/universities?ielts=9')).json().items;
    expect(items).toHaveLength(50);
    for (const u of items) {
      const general = (['bachelor', 'master'] as const).some((l) => u.levels[l]?.ieltsScope === 'general' && u.levels[l]?.ielts != null);
      expect(u.ieltsStatus).toBe(general ? 'meets' : 'unconfirmed');
    }
  });
  it('university detail and 404', async () => {
    const r = await get('/catalog/universities/universiti-malaya-my');
    expect(r.statusCode).toBe(200);
    expect(r.json().university.levels.bachelor.ieltsScope).toBe('general');
    expect((await get('/catalog/universities/nope')).statusCode).toBe(404);
  });
  it('compare needs 2-3 distinct universities and returns the requested level', async () => {
    expect((await get('/catalog/compare?ids=universiti-malaya-my&level=bachelor')).statusCode).toBe(400);
    const r = await get('/catalog/compare?ids=universiti-malaya-my,usm-my&level=bachelor');
    expect(r.statusCode).toBe(200);
    expect(r.json().items).toHaveLength(2);
  });
  it('grants: 7 national, 6 other, no demo records', async () => {
    const nat = (await get('/catalog/grants?kind=national')).json();
    expect(nat.items.map((g: any) => g.id)).toEqual(['mtcp', 'mis', 'turkiye-burslari', 'stipendium-hungaricum', 'daad-epos', 'gks-u', 'gks-g']);
    const oth = (await get('/catalog/grants?kind=other')).json();
    expect(oth.count).toBe(6);
    const all = (await get('/catalog/grants')).json().items.map((g: any) => g.id);
    expect(all.some((id: string) => id.startsWith('demo-'))).toBe(false);
    expect((await get('/catalog/grants/mtcp')).statusCode).toBe(200);
  });
  it('supports conditional requests with ETag', async () => {
    const first = await get('/catalog/countries');
    const etag = first.headers.etag as string;
    expect(etag).toBeTruthy();
    const second = await get('/catalog/countries', { 'if-none-match': etag });
    expect(second.statusCode).toBe(304);
  });
  it('/catalog/version returns the integer version', async () => {
    expect((await get('/catalog/version')).json().version).toBeGreaterThanOrEqual(1);
  });
});
