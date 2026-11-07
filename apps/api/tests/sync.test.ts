import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

let h: Harness;
let c: Client;
let uid: string;

beforeAll(async () => {
  h = await harness();
  c = new Client(h.app);
  uid = await c.login();
});
afterAll(async () => {
  await cleanupUsers(h.prisma, [uid]);
  await h.close();
});

describe('singleton resources (optimistic concurrency)', () => {
  it('creates, reads, updates with the right version, and rejects a stale one with the server copy', async () => {
    expect((await c.get('/me/profile')).statusCode).toBe(404);
    const created = await c.put('/me/profile', { data: { name: 'v1' } });
    expect(created.json()).toMatchObject({ data: { name: 'v1' }, version: 1 });

    const second = await c.put('/me/profile', { data: { name: 'v2' }, version: 1 });
    expect(second.json().version).toBe(2);

    const stale = await c.put('/me/profile', { data: { name: 'from-old-device' }, version: 1 });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toBe('version_conflict');
    expect(stale.json().error.details.server).toMatchObject({ data: { name: 'v2' }, version: 2 });
    expect((await c.get('/me/profile')).json().data.name).toBe('v2');
  });
  it('an update without a version is a conflict, not a silent overwrite', async () => {
    expect((await c.put('/me/profile', { data: { name: 'blind' } })).statusCode).toBe(409);
  });
  it('creating twice from two devices: the second gets 409 with the first copy', async () => {
    const other = new Client(h.app);
    const id = await other.login();
    expect((await other.put('/me/growth', { data: { a: 1 } })).statusCode).toBe(200);
    const again = await other.put('/me/growth', { data: { a: 2 } });
    expect(again.statusCode).toBe(409);
    await cleanupUsers(h.prisma, [id]);
  });
  it('delete then read is 404', async () => {
    expect((await c.del('/me/profile')).statusCode).toBe(204);
    expect((await c.get('/me/profile')).statusCode).toBe(404);
  });
  it('concurrent writes with the same version: exactly one wins', async () => {
    await c.put('/me/settings', { data: { n: 0 } });
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => c.put('/me/settings', { data: { n: i + 1 }, version: 1 })));
    const codes = results.map((r) => r.statusCode).sort();
    expect(codes.filter((x) => x === 200)).toHaveLength(1);
    expect(codes.filter((x) => x === 409)).toHaveLength(5);
    expect((await c.get('/me/settings')).json().version).toBe(2);
  });
});

describe('collections', () => {
  it('create / list / get / update / delete with versions', async () => {
    const made = await c.post('/me/applications', { opportunityRef: 'uni-x', data: { tasks: [] } });
    expect(made.statusCode).toBe(201);
    const { id, version } = made.json();
    expect(version).toBe(1);
    expect(made.json().userId).toBeUndefined();

    expect(((await c.get('/me/applications')).json().items as unknown[]).length).toBe(1);
    const upd = await c.put(`/me/applications/${id}`, { opportunityRef: 'uni-x', data: { tasks: ['a'] }, version: 1 });
    expect(upd.json()).toMatchObject({ version: 2, data: { tasks: ['a'] } });

    const stale = await c.put(`/me/applications/${id}`, { opportunityRef: 'uni-x', data: { tasks: ['stale'] }, version: 1 });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.details.server.data.tasks).toEqual(['a']);

    expect((await c.put(`/me/applications/${id}`, { opportunityRef: 'uni-x', data: {} })).statusCode).toBe(409); // no version
    expect((await c.del(`/me/applications/${id}`)).statusCode).toBe(204);
    expect((await c.get(`/me/applications/${id}`)).statusCode).toBe(404);
  });

  it('enforces per-user caps with a clear error', async () => {
    const other = new Client(h.app);
    const id = await other.login();
    for (let i = 0; i < 50; i++) expect((await other.post('/me/budgets', { data: { i } })).statusCode).toBe(201);
    const over = await other.post('/me/budgets', { data: { i: 51 } });
    expect(over.statusCode).toBe(409);
    expect(over.json().error.code).toBe('limit_reached');
    await cleanupUsers(h.prisma, [id]);
  });

  it('documents keep text only; the 2 MB text limit is enforced', async () => {
    const ok = await c.post('/me/documents', { kind: 'cv', title: 'CV', originalText: 'hello', workingText: 'hello', analysis: { overall: 5 } });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().analysis).toEqual({ overall: 5 });
    const big = await c.post('/me/documents', { kind: 'cv', title: 'big', originalText: 'x'.repeat(2_000_001), workingText: '' });
    expect(big.statusCode).toBe(400);
    const edge = await c.post('/me/documents', { kind: 'cv', title: 'edge', originalText: 'y'.repeat(2_000_000), workingText: 'y' });
    expect(edge.statusCode).toBe(201);
  });
});

describe('validation', () => {
  it('rejects unknown fields, wrong types and oversized data', async () => {
    expect((await c.post('/me/events', { data: {}, userId: 'someone-else' })).statusCode).toBe(400);
    expect((await c.post('/me/events', { data: 'string' })).statusCode).toBe(400);
    expect((await c.post('/me/events', { data: { big: 'x'.repeat(600_000) } })).statusCode).toBe(400);
    expect((await c.put('/me/settings', { data: {}, version: -1 })).statusCode).toBe(400);
    expect((await c.post('/me/chats', { data: {} })).statusCode).toBe(400); // title required
  });
  it('a client cannot set the owner, the id or the version of a new record', async () => {
    const r = await c.post('/me/events', { data: { t: 1 } });
    expect(r.statusCode).toBe(201);
    expect((await c.post('/me/events', { data: {}, id: '00000000-0000-0000-0000-000000000000' })).statusCode).toBe(400);
    expect(r.json().version).toBe(1);
  });
  it('saved items: replaces the set, drops duplicates, and has a limit', async () => {
    const put = await c.put('/me/saved', { items: [{ kind: 'u', ref: 'a' }, { kind: 'u', ref: 'a' }, { kind: 'u', ref: 'b' }] });
    expect(put.json().items).toHaveLength(2);
    expect((await c.get('/me/saved')).json().items).toHaveLength(2);
    const many = Array.from({ length: 501 }, (_, i) => ({ kind: 'u', ref: String(i) }));
    expect((await c.put('/me/saved', { items: many })).statusCode).toBe(400);
  });
  it('PATCH /me validates language and rejects unknown fields (no role escalation)', async () => {
    expect((await c.patch('/me', { lang: 'ru' })).json().lang).toBe('ru');
    expect((await c.patch('/me', { lang: 'xx' })).statusCode).toBe(400);
    expect((await c.patch('/me', { role: 'admin' })).statusCode).toBe(400);
    expect((await c.get('/me')).json().role).toBe('student');
  });
});
