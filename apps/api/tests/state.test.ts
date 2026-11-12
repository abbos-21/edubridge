import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

let h: Harness;
const ids: string[] = [];
beforeAll(async () => {
  h = await harness();
});
afterAll(async () => {
  await cleanupUsers(h.prisma, ids);
  await h.close();
});

describe('state documents', () => {
  it('needs a sign-in', async () => {
    expect((await new Client(h.app).get('/me/state')).statusCode).toBe(401);
  });

  it('stores only the fields of a document, and returns versions', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const r = await c.put('/me/state/profile', { data: { profile: { name: 'Abbos' }, demo: 'A', evil: 1 } });
    expect(r.statusCode).toBe(200);
    expect(r.json().data).toEqual({ profile: { name: 'Abbos' } }); // `demo` and `evil` are dropped
    expect(r.json().version).toBe(1);
    const all = (await c.get('/me/state')).json();
    expect(all.docs.profile.data.profile.name).toBe('Abbos');
  });

  it('refuses a stale version and hands back the server copy (409)', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    await c.put('/me/state/plans', { data: { applications: [{ id: 'a' }] } });
    const stale = await c.put('/me/state/plans', { data: { applications: [] }, version: 7 });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.details.server.data.applications).toHaveLength(1);
    const ok = await c.put('/me/state/plans', { data: { applications: [{ id: 'a' }, { id: 'b' }] }, version: 1 });
    expect(ok.json().version).toBe(2);
  });

  it('rejects an unknown document', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    expect((await c.put('/me/state/secrets', { data: {} })).statusCode).toBe(400);
  });

  it('never lets one student see or change the data of another', async () => {
    const a = new Client(h.app);
    const b = new Client(h.app);
    ids.push(await a.login(), await b.login());
    await a.put('/me/state/writing', { data: { cvText: 'A-secret-cv' } });
    const seen = (await b.get('/me/state')).json();
    expect(JSON.stringify(seen)).not.toContain('A-secret-cv');
    await b.put('/me/state/writing', { data: { cvText: 'B-cv' } });
    expect((await a.get('/me/state')).json().docs.writing.data.cvText).toBe('A-secret-cv');
  });

  it('requires the CSRF header for writes', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    expect((await c.put('/me/state/core', { data: { lang: 'en' } }, { csrf: false })).statusCode).toBe(403);
  });

  it('exports everything and deletes the account with all its data', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    await c.put('/me/state/core', { data: { lang: 'ru', saved: ['x'] } });
    const exp = (await c.get('/me/export')).json();
    expect(exp.state.core.saved).toEqual(['x']);
    expect((await c.del('/me', { confirm: 'nope' })).statusCode).toBe(400);
    expect((await c.del('/me', { confirm: 'DELETE' })).statusCode).toBe(204);
    expect(await h.prisma.stateDoc.count({ where: { userId: id } })).toBe(0);
    expect(await h.prisma.user.count({ where: { id } })).toBe(0);
  });
});
