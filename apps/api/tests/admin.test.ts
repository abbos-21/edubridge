import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { importCatalog } from '../src/lib/importCatalog';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

/**
 * ToR F8 / K2 / H12: server-enforced roles on every admin route, an unsourced official fact can never be
 * saved or published, publishing needs an admin, and every change is in the audit log.
 */

let h: Harness;
let admin: Client;
let editor: Client;
let editor2: Client;
let student: Client;
let guest: Client;
const ids: string[] = [];
const today = new Date().toISOString().slice(0, 10);
const L = (s: string) => ({ en: s, uz: `${s} (uz)`, ru: `${s} (ru)` });

beforeAll(async () => {
  h = await harness();
  const mk = async (name: string, role: 'student' | 'editor' | 'admin') => {
    const c = new Client(h.app);
    const r = await c.post('/auth/dev-login', { name: `adm-${name}`, role });
    expect(r.statusCode).toBe(200);
    ids.push(r.json().id);
    return c;
  };
  admin = await mk('admin', 'admin');
  editor = await mk('editor', 'editor');
  editor2 = await mk('editor2', 'editor');
  student = await mk('student', 'student');
  guest = new Client(h.app);
});

afterAll(async () => {
  // put the catalogue back exactly as imported and remove what the tests created
  await h.prisma.catalogueRevision.deleteMany({});
  await h.prisma.catalogueMark.deleteMany({});
  await h.prisma.demoSnapshot.deleteMany({});
  await importCatalog(h.prisma, fileURLToPath(new URL('../../../data/recovered/', import.meta.url)));
  await cleanupUsers(h.prisma, ids);
  await h.close();
});

const firstUni = async () => {
  const r = await guest.get('/catalog/universities');
  const u = r.json().items.find((x: any) => x.levels.bachelor);
  return u as { id: string; name: string };
};

describe('access control: every admin route', () => {
  const fill = (url: string) => url.replace(':type', 'university').replace(':id', '00000000-0000-4000-8000-000000000000');

  it('knows the admin routes (a route that skips the guarded helper would not be tested)', () => {
    expect(h.app.adminRoutes.length).toBeGreaterThanOrEqual(20);
    const all = h.app.printRoutes({ commonPrefix: false });
    const n = (all.match(/admin\//g) ?? []).length;
    expect(n).toBeGreaterThan(0);
  });

  it('guests get 401 and students 403 on all of them', async () => {
    for (const r of h.app.adminRoutes) {
      const url = fill(r.url);
      const g = await guest.req(r.method, url.replace('/api/v1', ''), r.method === 'GET' ? undefined : {}, { csrf: false });
      expect(g.statusCode, `guest ${r.method} ${r.url}`).toBe(401);
      const s = await student.req(r.method, url.replace('/api/v1', ''), r.method === 'GET' ? undefined : {});
      expect(s.statusCode, `student ${r.method} ${r.url}`).toBe(403);
    }
  });

  it('editors get 403 on admin-only routes and are let in on the rest', async () => {
    for (const r of h.app.adminRoutes) {
      const e = await editor.req(r.method, fill(r.url), r.method === 'GET' ? undefined : {});
      if (r.roles.includes('editor')) expect([401, 403], `editor ${r.method} ${r.url}`).not.toContain(e.statusCode);
      else expect(e.statusCode, `editor ${r.method} ${r.url}`).toBe(403);
    }
  });

  it('admins are never refused by the role check', async () => {
    for (const r of h.app.adminRoutes) {
      const a = await admin.req(r.method, fill(r.url), r.method === 'GET' ? undefined : {});
      expect([401, 403], `admin ${r.method} ${r.url}`).not.toContain(a.statusCode);
    }
  });

  it('a role change takes effect on the next request, without signing in again', async () => {
    const c = new Client(h.app);
    const id = await c.login('adm-promoted');
    ids.push(id);
    expect((await c.get('/admin/me')).statusCode).toBe(403);
    await h.prisma.user.update({ where: { id }, data: { role: 'editor' } });
    expect((await c.get('/admin/me')).statusCode).toBe(200);
    await h.prisma.user.update({ where: { id }, data: { role: 'student' } });
    expect((await c.get('/admin/me')).statusCode).toBe(403);
  });

  it('changes need a recent sign-in (reads do not)', async () => {
    const c = new Client(h.app);
    const id = (await c.post('/auth/dev-login', { name: 'adm-old-session', role: 'admin' })).json().id as string;
    ids.push(id);
    await h.prisma.session.updateMany({ where: { userId: id }, data: { createdAt: new Date(Date.now() - 3 * 3_600_000) } });
    expect((await c.get('/admin/me')).statusCode).toBe(200);
    const w = await c.post('/admin/entities/university/x/reviewed', { reviewed: true });
    expect(w.statusCode).toBe(403);
    expect(w.json().error.code).toBe('reauth_required');
  });

  it('admin writes also need the CSRF header', async () => {
    const r = await admin.post('/admin/entities/university/x/reviewed', { reviewed: true }, { csrf: false });
    expect(r.statusCode).toBe(403);
    expect(r.json().error.code).toBe('csrf_token');
  });
});

describe('revision workflow', () => {
  let uni: { id: string; name: string };
  let revId: string;
  let version0: number;

  it('an editor starts a draft from the published record; only one draft per record', async () => {
    uni = await firstUni();
    version0 = (await guest.get('/catalog/version')).json().version;
    const r = await editor.post('/admin/revisions', { entityType: 'university', entityId: uni.id });
    expect(r.statusCode).toBe(201);
    revId = r.json().id;
    const again = await editor2.post('/admin/revisions', { entityType: 'university', entityId: uni.id });
    expect(again.statusCode).toBe(409);
    expect(again.json().error.details.revisionId).toBe(revId);
  });

  const draft = async () => (await editor.get(`/admin/revisions/${revId}`)).json().data as any;

  it('refuses an official value without a source', async () => {
    const d = await draft();
    d.levels.bachelor.sources = [];
    d.levels.bachelor.tuition = { amount: 4321, currency: 'USD', per: 'year' };
    const r = await editor.put(`/admin/revisions/${revId}`, { data: d });
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe('invalid_draft');
    expect(JSON.stringify(r.json().error.details.issues)).toContain('C1-tuition-source');
  });

  it('refuses a missing or future check date, bad links, structural changes and untranslated new text', async () => {
    const base = await draft();
    const bad = async (mut: (d: any) => void, needle: string) => {
      const d = structuredClone(base);
      mut(d);
      const r = await editor.put(`/admin/revisions/${revId}`, { data: d });
      expect(r.statusCode, needle).toBe(422);
      expect(JSON.stringify(r.json().error.details.issues), needle).toContain(needle);
    };
    await bad((d) => { d.lastChecked = null; }, 'C1-checked');
    await bad((d) => { d.lastChecked = '2999-01-01'; }, 'future');
    await bad((d) => { d.website = 'javascript:alert(1)'; }, 'C-url');
    await bad((d) => { d.tier = d.tier === 'selective' ? 'accessible' : 'selective'; }, 'structure');
    await bad((d) => { d.levels.bachelor.note = { en: 'New note', uz: 'Yangi', ru: '' }; }, 'J-language');
    await bad((d) => { d.levels.bachelor.note = { en: 'New note', uz: '' , ru: 'Новая'}; }, 'J-language');
  });

  it('saves a sourced, dated, fully translated change and shows it as a diff against the published record', async () => {
    const d = await draft();
    d.lastChecked = today;
    d.levels.bachelor.note = L('Admissions note edited by the test');
    const r = await editor.put(`/admin/revisions/${revId}`, { data: d });
    expect(r.statusCode).toBe(200);
    const v = (await editor.get(`/admin/revisions/${revId}`)).json();
    const paths = v.changes.map((c: any) => c.path);
    expect(paths).toContain('levels.bachelor.note.en');
    expect(paths).toContain('lastChecked');
    expect(v.issues).toEqual([]);
    expect(v.stale).toBe(false);
  });

  it('nothing is public until an admin approves: draft and in-review changes stay invisible', async () => {
    const pub = async () => (await guest.get(`/catalog/universities/${uni.id}`)).json().university.levels.bachelor.note;
    const before = JSON.stringify(await pub());
    expect((await editor.post(`/admin/revisions/${revId}/submit`)).statusCode).toBe(200);
    expect(JSON.stringify(await pub())).toBe(before);
    expect((await guest.get('/catalog/version')).json().version).toBe(version0);
  });

  it('an editor cannot approve; another editor cannot touch the draft; the author cannot edit while in review', async () => {
    expect((await editor.post(`/admin/revisions/${revId}/approve`, {})).statusCode).toBe(403);
    expect((await editor2.put(`/admin/revisions/${revId}`, { data: await draft() })).statusCode).toBe(403);
    expect((await editor2.del(`/admin/revisions/${revId}`)).statusCode).toBe(403);
    expect((await editor.put(`/admin/revisions/${revId}`, { data: await draft() })).statusCode).toBe(409);
  });

  it('a rejection needs a comment, returns the draft to the editor, who can fix and resubmit', async () => {
    expect((await admin.post(`/admin/revisions/${revId}/reject`, {})).statusCode).toBe(400);
    const r = await admin.post(`/admin/revisions/${revId}/reject`, { comment: 'Please cite the page' });
    expect(r.statusCode).toBe(200);
    const v = (await editor.get(`/admin/revisions/${revId}`)).json();
    expect(v.revision.status).toBe('rejected');
    expect(v.revision.comment).toBe('Please cite the page');
    expect((await editor.put(`/admin/revisions/${revId}`, { data: v.data })).statusCode).toBe(200);
    expect((await editor.post(`/admin/revisions/${revId}/submit`)).statusCode).toBe(200);
  });

  it('an admin approves: the change goes live, the version bumps, the revision and audit log record it', async () => {
    const r = await admin.post(`/admin/revisions/${revId}/approve`, { comment: 'Looks right' });
    expect(r.statusCode).toBe(200);
    expect(r.json().catalogueVersion).toBeGreaterThan(version0);
    const pubU = (await guest.get(`/catalog/universities/${uni.id}`)).json().university;
    expect(pubU.levels.bachelor.note.en).toBe('Admissions note edited by the test');
    expect(pubU.lastChecked).toBe(today);
    expect((await guest.get('/catalog/version')).json().version).toBe(r.json().catalogueVersion);

    const rev = (await admin.get(`/admin/revisions/${revId}`)).json().revision;
    expect(rev.status).toBe('published');
    expect(rev.reviewedBy).toBeTruthy();

    const log = (await admin.get(`/admin/audit?entityType=university&entityId=${uni.id}`)).json().items.map((i: any) => i.action);
    for (const a of ['revision.create', 'revision.save', 'revision.submit', 'revision.reject', 'revision.publish']) expect(log).toContain(a);
    const publish = (await admin.get(`/admin/audit?entityType=university&entityId=${uni.id}&action=revision.publish`)).json().items[0];
    expect(publish.actor.role).toBe('admin');
    expect(JSON.stringify(publish.diff)).toContain('levels.bachelor.note.en');
    // the entity version moved, so the same revision cannot be approved twice
    expect((await admin.post(`/admin/revisions/${revId}/approve`, {})).statusCode).toBe(409);
  });

  it('a draft started before another change was published is stale and cannot be approved', async () => {
    const a = (await editor.post('/admin/revisions', { entityType: 'university', entityId: uni.id })).json().id as string;
    // someone else's change lands first
    await h.prisma.university.update({ where: { id: uni.id }, data: { version: { increment: 1 } } });
    const d = (await editor.get(`/admin/revisions/${a}`)).json().data;
    d.lastChecked = today;
    d.levels.bachelor.note = L('Second edit');
    expect((await editor.put(`/admin/revisions/${a}`, { data: d })).statusCode).toBe(200);
    expect((await editor.post(`/admin/revisions/${a}/submit`)).statusCode).toBe(200);
    expect((await editor.get(`/admin/revisions/${a}`)).json().stale).toBe(true);
    const r = await admin.post(`/admin/revisions/${a}/approve`, {});
    expect(r.statusCode).toBe(409);
    expect(r.json().error.code).toBe('stale_revision');
    expect((await admin.post(`/admin/revisions/${a}/reject`, { comment: 'stale' })).statusCode).toBe(200);
    expect((await editor.del(`/admin/revisions/${a}`)).statusCode).toBe(204);
  });

  it('submitting a draft with no changes is refused; a published revision cannot be discarded', async () => {
    const x = (await editor.post('/admin/revisions', { entityType: 'university', entityId: uni.id })).json().id as string;
    const r = await editor.post(`/admin/revisions/${x}/submit`);
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe('no_changes');
    await editor.del(`/admin/revisions/${x}`);
    expect((await editor.del(`/admin/revisions/${revId}`)).statusCode).toBe(409);
  });

  it('grants follow the same rules (a source link and a check date are required)', async () => {
    const g = (await guest.get('/catalog/grants?kind=national')).json().items[0];
    const id = (await editor.post('/admin/revisions', { entityType: 'grant', entityId: g.id })).json().id as string;
    const d = (await editor.get(`/admin/revisions/${id}`)).json().data;
    const noSource = { ...d, sources: [], url: null, infoUrl: null, applyUrl: null, source: null };
    const r1 = await editor.put(`/admin/revisions/${id}`, { data: noSource });
    expect(r1.statusCode).toBe(422);
    expect(JSON.stringify(r1.json().error.details.issues)).toContain('C1-grant-source');
    const r2 = await editor.put(`/admin/revisions/${id}`, { data: { ...d, checked: null } });
    expect(JSON.stringify(r2.json().error.details.issues)).toContain('C1-checked');
    const ok = { ...d, checked: today, who: L('Edited eligibility') };
    expect((await editor.put(`/admin/revisions/${id}`, { data: ok })).statusCode).toBe(200);
    expect((await editor.post(`/admin/revisions/${id}/submit`)).statusCode).toBe(200);
    expect((await admin.post(`/admin/revisions/${id}/approve`, {})).statusCode).toBe(200);
    const pub = (await guest.get(`/catalog/grants/${g.id}`)).json().grant;
    expect(pub.who.en).toBe('Edited eligibility');
  });
});

describe('hide and reviewed marks (server-side, shown on every device)', () => {
  it('only an admin can hide; hiding removes it from the public catalogue and bumps the version; unhide restores', async () => {
    const uni = await firstUni();
    const v0 = (await guest.get('/catalog/version')).json().version;
    expect((await editor.post(`/admin/entities/university/${uni.id}/hide`, { hidden: true, reason: 'test' })).statusCode).toBe(403);
    expect((await admin.post(`/admin/entities/university/${uni.id}/hide`, { hidden: true })).statusCode).toBe(400); // reason required
    const r = await admin.post(`/admin/entities/university/${uni.id}/hide`, { hidden: true, reason: 'Wrong data, checking' });
    expect(r.statusCode).toBe(200);
    expect((await guest.get(`/catalog/universities/${uni.id}`)).statusCode).toBe(404);
    expect((await guest.get('/catalog/version')).json().version).toBeGreaterThan(v0);
    // still editable and visible in the admin list
    const list = (await editor.get('/admin/entities?type=university&status=hidden')).json();
    expect(list.items.map((i: any) => i.id)).toContain(uni.id);
    expect((await admin.post(`/admin/entities/university/${uni.id}/hide`, { hidden: false, reason: 'Fixed' })).json().changed).toBe(true);
    expect((await guest.get(`/catalog/universities/${uni.id}`)).statusCode).toBe(200);
    const log = (await admin.get(`/admin/audit?entityId=${uni.id}&action=entity.`)).json().items.map((i: any) => i.action);
    expect(log).toEqual(expect.arrayContaining(['entity.hide', 'entity.unhide']));
  });

  it('a reviewed mark is stored once for everyone and does not change the public catalogue', async () => {
    const uni = await firstUni();
    const v0 = (await guest.get('/catalog/version')).json().version;
    expect((await editor.post(`/admin/entities/university/${uni.id}/reviewed`, { reviewed: true, note: 'checked by editor' })).statusCode).toBe(200);
    const other = (await admin.get(`/admin/entities/university/${uni.id}`)).json();
    expect(other.mark.reviewedAt).toBeTruthy();
    const list = (await admin.get('/admin/entities?type=university&q=' + encodeURIComponent(uni.name.slice(0, 10)))).json();
    expect(list.items.find((i: any) => i.id === uni.id).reviewedAt).toBeTruthy();
    expect((await guest.get('/catalog/version')).json().version).toBe(v0);
    await editor.post(`/admin/entities/university/${uni.id}/reviewed`, { reviewed: false });
    expect((await admin.get(`/admin/entities/university/${uni.id}`)).json().mark.reviewedAt).toBeNull();
  });
});

describe('users, roles and AI', () => {
  it('lists users without any contact details, with this month\'s AI use', async () => {
    const r = await admin.get('/admin/users?limit=200');
    expect(r.statusCode).toBe(200);
    const s = JSON.stringify(r.json());
    expect(s).not.toMatch(/telegramUsername|email|providerUserId/);
    const me = r.json().items.find((u: any) => u.id === ids[0]);
    expect(me.role).toBe('admin');
    expect(me.providers).toContain('telegram');
  });

  it('changes a role (audited); you cannot change your own; roles are validated', async () => {
    const target = ids[3]!; // student
    expect((await admin.patch(`/admin/users/${ids[0]}/role`, { role: 'student' })).statusCode).toBe(400);
    expect((await admin.patch(`/admin/users/${target}/role`, { role: 'superuser' })).statusCode).toBe(400);
    expect((await admin.patch(`/admin/users/${target}/role`, { role: 'editor' })).json().changed).toBe(true);
    expect((await student.get('/admin/me')).statusCode).toBe(200);
    await admin.patch(`/admin/users/${target}/role`, { role: 'student' });
    expect((await student.get('/admin/me')).statusCode).toBe(403);
    const log = (await admin.get(`/admin/audit?entityId=${target}&action=user.role`)).json().items;
    expect(log.length).toBe(2);
    expect(log[0].diff).toEqual({ from: 'editor', to: 'student' });
  });

  it('suspends and restores AI for one user', async () => {
    const m = await harness({ AI_MOCK: 'true' });
    const adm = new Client(m.app);
    const stu = new Client(m.app);
    const aid = (await adm.post('/auth/dev-login', { name: 'adm-susp-admin', role: 'admin' })).json().id as string;
    const sid = await stu.login('adm-susp-student');
    const ask = async () => (await stu.post('/ai/chat', { lang: 'en', messages: [{ role: 'user', content: 'hi' }] })).statusCode;
    expect(await ask()).toBe(200);
    expect((await adm.patch(`/admin/users/${sid}/ai`, { suspended: true })).json().suspended).toBe(true);
    expect(await ask()).toBe(403);
    await adm.patch(`/admin/users/${sid}/ai`, { suspended: false });
    expect(await ask()).toBe(200);
    expect((await adm.get(`/admin/audit?entityId=${sid}&action=user.ai`)).json().items.length).toBe(2);
    await cleanupUsers(m.prisma, [aid, sid]);
    await m.close();
  });

  it('shows cost and usage per day, task and user, against the monthly budget', async () => {
    await h.prisma.aiUsage.create({ data: { userId: ids[3]!, task: 'chat', tier: 'standard', model: 'test', inputTokens: 100, outputTokens: 50, costUsdEst: '1.25', status: 'ok' } });
    const r = await admin.get('/admin/ai/usage?days=7');
    expect(r.statusCode).toBe(200);
    const j = r.json();
    expect(j.month.budgetUsd).toBe(50);
    expect(j.month.spentUsd).toBeGreaterThanOrEqual(1.25);
    expect(j.perDay.length).toBeGreaterThan(0);
    expect(j.perTask.find((t: any) => t.task === 'chat').costUsd).toBeGreaterThanOrEqual(1.25);
    expect(j.perUser.find((u: any) => u.userId === ids[3])).toBeTruthy();
    expect(j.note).toMatch(/estimates/);
    await h.prisma.aiUsage.deleteMany({ where: { model: 'test' } });
  });
});

describe('data gaps, batch check and export', () => {
  it('lists links-only levels, the missing QS positions and stale records without inventing anything', async () => {
    const g = (await editor.get('/admin/gaps?staleDays=3650')).json();
    expect(g.totals.universities).toBe(50);
    expect(g.missingQs.length).toBe(5);
    expect(g.totals.linksOnlyLevels).toBe(g.linksOnly.length);
    expect(g.linksOnly.length).toBeGreaterThan(0);
    expect(g.russianInRecords.texts).toBeGreaterThan(0);
    const fresh = (await editor.get('/admin/gaps?staleDays=1')).json();
    expect(fresh.stale.length).toBeGreaterThan(0);
    expect(fresh.stale[0]).toHaveProperty('ageDays');
  });

  it('the batch checker reports the structure and the rule violations of the stored catalogue', async () => {
    const r = (await editor.get('/admin/check')).json();
    expect(r.universities).toBe(50);
    expect(r.problems).toEqual([]);
    expect(r.invalid).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('exports JSON and CSV; CSV cells that look like formulas are neutralised', async () => {
    const j = (await editor.get('/admin/export?type=university&format=json')).json();
    expect(j.count).toBe(50);
    const csv = await editor.get('/admin/export?type=university&format=csv');
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.body.split('\n')[0]).toContain('bachelor_ielts');
    const { toCsv } = await import('../src/admin/exporter');
    const out = toCsv([{ a: '=HYPERLINK("x")', b: '+1', c: 'plain, "quoted"' }]).split('\n')[1]!;
    expect(out).toBe(`"'=HYPERLINK(""x"")",'+1,"plain, ""quoted"""`);
    const g = await editor.get('/admin/export?type=grant&format=csv');
    expect(g.body).toContain('mtcp');
  });
});

describe('saved demo analyses', () => {
  it('an admin saves a result; anyone can read it, labelled as saved with its date; an admin can delete it', async () => {
    const r = await admin.post('/admin/demo-snapshots', { kind: 'document_analysis', title: 'Sample CV analysis', lang: 'en', payload: { summary: 'x', findings: [] } });
    expect(r.statusCode).toBe(201);
    const id = r.json().id as string;
    expect((await editor.post('/admin/demo-snapshots', { kind: 'coach_plan', title: 'Nope', payload: {} })).statusCode).toBe(403);

    const list = (await guest.get('/demo-snapshots')).json();
    expect(list.items.map((i: any) => i.id)).toContain(id);
    const one = (await guest.get(`/demo-snapshots/${id}`)).json();
    expect(one.saved).toBe(true);
    expect(one.savedAt).toBeTruthy();
    expect(one.payload.summary).toBe('x');
    expect((await guest.get('/demo-snapshots/not-an-id')).statusCode).toBe(404);

    expect((await admin.del(`/admin/demo-snapshots/${id}`)).statusCode).toBe(204);
    expect((await guest.get(`/demo-snapshots/${id}`)).statusCode).toBe(404);
  });

  it('remembers on the server when a snapshot was saved while the AI was in mock mode', async () => {
    const m = await harness({ AI_MOCK: 'true' });
    const c = new Client(m.app);
    const uid = (await c.post('/auth/dev-login', { name: 'adm-mock', role: 'admin' })).json().id as string;
    const s = (await c.post('/admin/demo-snapshots', { kind: 'coach_plan', title: 'Mock plan', payload: { a: 1 } })).json();
    expect(s.mock).toBe(true);
    expect((await new Client(m.app).get(`/demo-snapshots/${s.id}`)).json().mock).toBe(true);
    await m.prisma.demoSnapshot.deleteMany({ where: { id: s.id } });
    await cleanupUsers(m.prisma, [uid]);
    await m.close();
  });

  it('rejects an oversized snapshot', async () => {
    const r = await admin.post('/admin/demo-snapshots', { kind: 'coach_plan', title: 'Huge one', payload: { text: 'x'.repeat(210_000) } });
    expect(r.statusCode).toBe(400);
  });
});
