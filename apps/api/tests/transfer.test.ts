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

const guestState = () => ({
  lang: 'ru',
  theme: 'dark',
  compare: ['usm-my'],
  displayCurrency: 'USD',
  profile: { name: 'Guest', gpa: 4.2 },
  growth: { plan: 'p' },
  plansDoc: { plans: [{ id: 'p-1', oppId: 'usm-my', tasks: [] }], budgets: [{ id: 'b-9' }] },
  writingDoc: { drafts: { 'usm-my': { text: 'my draft', answers: {}, revisions: [] } }, cv: 'my cv', roadmap: { 'bachelor-a': true } },
  saved: ['universiti-malaya-my', 'usm-my'],
  applications: [
    { id: 'app-1', opportunityId: 'usm-my', tasks: [] },
    { id: 'app-2', opportunityId: 'ukm-my', tasks: [] },
  ],
  customEvents: [{ id: 'ev-1', title: 'IELTS' }],
  budgets: [{ id: 'b-1', total: 1 }],
  chatThreads: [{ id: 't-1', title: 'Hello', messages: [] }],
  interviews: [{ id: 'i-1' }],
  advisorDocs: [{ id: 'd-1', kind: 'cv', title: 'My CV', originalText: 'orig', workingText: 'work', analysis: { overall: 5 } }],
});

describe('POST /me/import-local', () => {
  it('copies guest data to the account and reports what was imported', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const r = await c.post('/me/import-local', { state: guestState() });
    expect(r.statusCode).toBe(200);
    expect(r.json().imported).toMatchObject({ profile: true, growth: true, plans: true, writing: true, settings: true, saved: 2, applications: 2, customEvents: 1, budgets: 1, chatThreads: 1, interviews: 1, advisorDocs: 1 });
    expect((await c.get('/me/profile')).json().data.name).toBe('Guest');
    expect((await c.get('/me/plans')).json().data.plans[0].id).toBe('p-1');
    expect((await c.get('/me/writing')).json().data.cv).toBe('my cv');
    const exported = (await c.get('/me/export')).json();
    expect(exported.plans.data.plans).toHaveLength(1);
    expect(exported.writing.data.drafts['usm-my'].text).toBe('my draft');
    expect((await c.get('/me/settings')).json().data).toMatchObject({ lang: 'ru', theme: 'dark' });
    const apps = (await c.get('/me/applications')).json().items as Array<{ opportunityRef: string }>;
    expect(apps.map((a) => a.opportunityRef).sort()).toEqual(['ukm-my', 'usm-my']);
    const doc = (await c.get('/me/documents')).json().items[0];
    expect(doc).toMatchObject({ title: 'My CV', originalText: 'orig', workingText: 'work' });
  });

  it('is idempotent: importing twice adds nothing the second time', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    await c.post('/me/import-local', { state: guestState() });
    const again = await c.post('/me/import-local', { state: guestState() });
    expect(again.json().imported).toMatchObject({ profile: false, applications: 0, customEvents: 0, advisorDocs: 0, saved: 0 });
    expect(((await c.get('/me/applications')).json().items as unknown[]).length).toBe(2);
    expect(((await c.get('/me/documents')).json().items as unknown[]).length).toBe(1);
  });

  it('never overwrites data the account already has', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    await c.put('/me/profile', { data: { name: 'Server copy' } });
    const r = await c.post('/me/import-local', { state: guestState() });
    expect(r.json().imported.profile).toBe(false);
    expect((await c.get('/me/profile')).json().data.name).toBe('Server copy');
  });

  it('skips malformed items instead of failing, and respects the caps', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `b${i}`, total: i }));
    const r = await c.post('/me/import-local', { state: { budgets: [...many, 'junk', null, 42, [1]], advisorDocs: [{ id: 'x', title: 't' }, { id: 'y', originalText: 'z'.repeat(2_000_001) }] } });
    expect(r.statusCode).toBe(200);
    expect(r.json().imported.budgets).toBe(50);
    expect(r.json().skipped.budgets).toBe(14);
    expect(r.json().imported.advisorDocs).toBe(0);
  });

  it('rejects a body that is not an object', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    expect((await c.post('/me/import-local', { state: 'nope' })).statusCode).toBe(400);
    expect((await c.post('/me/import-local', { other: 1 })).statusCode).toBe(400);
  });
});

describe('GET /me/export', () => {
  it('returns everything the user has, as a download, with no user ids on the rows', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    ids.push(id);
    await c.post('/me/import-local', { state: guestState() });
    const r = await c.get('/me/export');
    expect(r.statusCode).toBe(200);
    expect(String(r.headers['content-disposition'])).toContain('attachment');
    expect(r.headers['cache-control']).toBe('no-store');
    const e = r.json();
    expect(e.user.id).toBe(id);
    expect(e.profile.data.name).toBe('Guest');
    expect(e.applications).toHaveLength(2);
    expect(e.documents[0].originalText).toBe('orig');
    expect(e.saved).toHaveLength(2);
    expect(JSON.stringify(e)).not.toContain('"userId"');
  });
});
