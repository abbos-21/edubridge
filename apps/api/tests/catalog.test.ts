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

describe('catalogue', () => {
  it('is public, versioned and cacheable', async () => {
    const r = await new Client(h.app).get('/catalog');
    expect(r.statusCode).toBe(200);
    const c = r.json();
    expect(c.version).toBeGreaterThanOrEqual(1);
    expect(c.universities).toHaveLength(50);
    expect(c.grants).toHaveLength(7);
    expect(r.headers.etag).toBeTruthy();
    expect((await new Client(h.app).get('/catalog', { headers: { 'if-none-match': r.headers.etag as string } })).statusCode).toBe(304);
  });

  it('staff routes: anonymous 401, student 403, editor can edit, only admin can delete', async () => {
    expect((await new Client(h.app).get('/admin/catalog')).statusCode).toBe(401);
    const student = new Client(h.app);
    ids.push(await student.login());
    expect((await student.get('/admin/catalog')).statusCode).toBe(403);

    const editor = new Client(h.app);
    ids.push((await editor.post('/auth/dev-login', { name: `ed-${Date.now()}`, role: 'editor' })).json().id);
    const list = (await editor.get('/admin/catalog/universities')).json();
    const key = list.items[0].key as string;
    const rec = (await editor.get(`/admin/catalog/universities/${encodeURIComponent(key)}`)).json().record;
    const before = (await h.prisma.catalogMeta.findUnique({ where: { id: 1 } }))!.version;
    const put = await editor.put(`/admin/catalog/universities/${encodeURIComponent(key)}`, { record: { ...rec, hidden: true } });
    expect(put.statusCode).toBe(200);
    expect(put.json().version).toBe(before + 1);
    // hidden records disappear for students, and the edit is audited
    expect((await new Client(h.app).get('/catalog')).json().universities).toHaveLength(49);
    expect(await h.prisma.auditLog.count({ where: { entityType: 'catalog:universities', entityId: key } })).toBeGreaterThan(0);
    expect((await editor.del(`/admin/catalog/universities/${encodeURIComponent(key)}`)).statusCode).toBe(403);
    // put it back
    await editor.put(`/admin/catalog/universities/${encodeURIComponent(key)}`, { record: rec });
    expect((await new Client(h.app).get('/catalog')).json().universities).toHaveLength(50);
  });
});
