import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

/**
 * ToR K2: user A can never read, change or delete user B's records, for EVERY private resource.
 * A creates one record in each resource; B and an anonymous client then try everything on it.
 */

type Single = { kind: 'single'; path: string; body: object; changed: object };
type Coll = { kind: 'coll'; path: string; body: object; changed: object };

const RESOURCES: Array<Single | Coll> = [
  { kind: 'single', path: 'profile', body: { data: { name: 'A-secret', gpa: 4.5 } }, changed: { data: { name: 'HACKED' } } },
  { kind: 'single', path: 'growth', body: { data: { plan: 'A-plan' } }, changed: { data: { plan: 'HACKED' } } },
  { kind: 'single', path: 'plans', body: { data: { plans: [{ id: 'A-plan-1' }], budgets: [] } }, changed: { data: { plans: [] } } },
  { kind: 'single', path: 'writing', body: { data: { drafts: { x: { text: 'A-secret-draft' } }, cv: 'A-cv' } }, changed: { data: { drafts: {} } } },
  { kind: 'single', path: 'settings', body: { data: { lang: 'ru' } }, changed: { data: { lang: 'en' } } },
  { kind: 'coll', path: 'applications', body: { opportunityRef: 'uni-a', data: { tasks: ['A-task'] } }, changed: { opportunityRef: 'x', data: { tasks: ['HACKED'] } } },
  { kind: 'coll', path: 'events', body: { data: { title: 'A-event' } }, changed: { data: { title: 'HACKED' } } },
  { kind: 'coll', path: 'budgets', body: { data: { total: 1000 } }, changed: { data: { total: 1 } } },
  { kind: 'coll', path: 'chats', body: { title: 'A-chat', data: { messages: ['A-secret'] } }, changed: { title: 'HACKED', data: {} } },
  { kind: 'coll', path: 'interviews', body: { data: { answers: ['A-answer'] } }, changed: { data: { answers: ['HACKED'] } } },
  {
    kind: 'coll',
    path: 'documents',
    body: { kind: 'cv', title: 'A-CV', originalText: 'A-private-cv-text', workingText: 'A-private-cv-text' },
    changed: { kind: 'cv', title: 'HACKED', originalText: 'HACKED', workingText: 'HACKED' },
  },
];

let h: Harness;
let A: Client;
let B: Client;
let anon: Client;
let idA: string;
let idB: string;
const created: Record<string, { id?: string; version: number }> = {};

beforeAll(async () => {
  h = await harness();
  A = new Client(h.app);
  B = new Client(h.app);
  anon = new Client(h.app);
  idA = await A.login();
  idB = await B.login();
  for (const r of RESOURCES) {
    if (r.kind === 'single') {
      const res = await A.put(`/me/${r.path}`, r.body);
      expect(res.statusCode, `${r.path} create`).toBe(200);
      created[r.path] = { version: res.json().version };
    } else {
      const res = await A.post(`/me/${r.path}`, r.body);
      expect(res.statusCode, `${r.path} create`).toBe(201);
      created[r.path] = { id: res.json().id, version: res.json().version };
    }
  }
  await A.put('/me/saved', { items: [{ kind: 'university', ref: 'A-saved' }] });
});
afterAll(async () => {
  await cleanupUsers(h.prisma, [idA, idB]);
  await h.close();
});

describe.each(RESOURCES)('isolation: $path', (r) => {
  it('anonymous requests get 401', async () => {
    const base = `/me/${r.path}`;
    expect((await anon.get(base)).statusCode).toBe(401);
    expect((await (r.kind === 'single' ? anon.put(base, r.body, { csrf: false }) : anon.post(base, r.body, { csrf: false }))).statusCode).toBe(401);
    if (r.kind === 'coll') {
      const id = created[r.path]!.id;
      expect((await anon.get(`${base}/${id}`)).statusCode).toBe(401);
      expect((await anon.del(`${base}/${id}`)).statusCode).toBe(401);
    }
  });

  if (r.kind === 'single') {
    it('B does not see A\'s record, and cannot change or delete it', async () => {
      const base = `/me/${r.path}`;
      expect((await B.get(base)).statusCode).toBe(404);
      // B writes its own record; A's must be untouched
      const mine = await B.put(base, r.changed);
      expect(mine.statusCode).toBe(200);
      expect((await B.del(base)).statusCode).toBe(204);
      const a = await A.get(base);
      expect(a.statusCode).toBe(200);
      expect(JSON.stringify(a.json().data)).not.toContain('HACKED');
      expect(a.json().version).toBe(created[r.path]!.version);
    });
  } else {
    it('B\'s list never contains A\'s record', async () => {
      const list = (await B.get(`/me/${r.path}`)).json().items as Array<{ id: string }>;
      expect(list.map((x) => x.id)).not.toContain(created[r.path]!.id);
      expect(JSON.stringify(list)).not.toMatch(/A-secret|A-private|A-task|A-event|A-answer|A-chat|A-CV/);
    });
    it('B gets 404 (not 403, not data) for A\'s record on GET, PUT and DELETE; A\'s record is unchanged', async () => {
      const id = created[r.path]!.id!;
      const base = `/me/${r.path}/${id}`;
      expect((await B.get(base)).statusCode).toBe(404);
      expect((await B.put(base, { ...r.changed, version: created[r.path]!.version })).statusCode).toBe(404);
      expect((await B.del(base)).statusCode).toBe(404);
      const mine = (await A.get(base)).json();
      expect(JSON.stringify(mine)).not.toContain('HACKED');
      expect(mine.version).toBe(created[r.path]!.version);
    });
    it('a malformed or foreign id never produces a 500', async () => {
      for (const id of ['not-a-uuid', '00000000-0000-0000-0000-000000000000', "1' OR '1'='1"]) {
        expect([404]).toContain((await B.get(`/me/${r.path}/${encodeURIComponent(id)}`)).statusCode);
        expect([404]).toContain((await B.del(`/me/${r.path}/${encodeURIComponent(id)}`)).statusCode);
      }
    });
  }
});

describe('isolation: saved items, export, sessions', () => {
  it('B does not see A\'s saved items; B replacing its own does not touch A\'s', async () => {
    expect((await B.get('/me/saved')).json().items).toEqual([]);
    await B.put('/me/saved', { items: [{ kind: 'university', ref: 'B-saved' }] });
    expect((await A.get('/me/saved')).json().items).toEqual([{ kind: 'university', ref: 'A-saved' }]);
  });
  it('anonymous cannot reach saved, export, import, sessions or account routes', async () => {
    for (const [m, u] of [['GET', '/me/saved'], ['GET', '/me/export'], ['GET', '/me'], ['GET', '/me/sessions'], ['POST', '/me/import-local'], ['DELETE', '/me']] as const) {
      expect((await anon.req(m, u, m === 'GET' ? undefined : {}, { csrf: false })).statusCode, `${m} ${u}`).toBe(401);
    }
  });
  it('B\'s export contains none of A\'s data', async () => {
    const out = (await B.get('/me/export')).body;
    expect(out).not.toMatch(/A-secret|A-private|A-task|A-event|A-answer|A-chat|A-CV|A-saved|A-plan/);
    const mine = (await A.get('/me/export')).json();
    expect(mine.documents[0].originalText).toBe('A-private-cv-text');
    expect(mine.profile.data.name).toBe('A-secret');
  });
  it('B cannot see or revoke A\'s sessions', async () => {
    const aSessions = (await A.get('/me/sessions')).json().items as Array<{ id: string }>;
    const bSessions = (await B.get('/me/sessions')).json().items as Array<{ id: string }>;
    for (const s of aSessions) expect(bSessions.map((x) => x.id)).not.toContain(s.id);
    for (const s of aSessions) expect((await B.del(`/me/sessions/${s.id}`)).statusCode).toBe(404);
    expect((await A.get('/me')).statusCode).toBe(200);
  });
});

describe('deleting an account removes everything and touches nobody else', () => {
  it('hard-deletes every row of the user, keeps the other user\'s rows', async () => {
    const C = new Client(h.app);
    const idC = await C.login();
    for (const r of RESOURCES) {
      if (r.kind === 'single') await C.put(`/me/${r.path}`, r.body);
      else await C.post(`/me/${r.path}`, r.body);
    }
    await C.put('/me/saved', { items: [{ kind: 'university', ref: 'C-saved' }] });
    await h.prisma.reminder.create({ data: { userId: idC, kind: 'deadline', ref: 'x', dueAt: new Date(Date.now() + 1e9) } });
    await h.prisma.auditLog.create({ data: { actorId: idC, action: 'test.touch', entityType: 'x', entityId: 'x', ipHash: 'abc' } });

    const countFor = async (userId: string) => {
      const w = { where: { userId } };
      return {
        user: await h.prisma.user.count({ where: { id: userId } }),
        identities: await h.prisma.authIdentity.count(w),
        sessions: await h.prisma.session.count(w),
        profile: await h.prisma.profile.count(w),
        growth: await h.prisma.growthPlan.count(w),
        plans: await h.prisma.planSet.count(w),
        writing: await h.prisma.writingSet.count(w),
        settings: await h.prisma.userSettings.count(w),
        applications: await h.prisma.application.count(w),
        events: await h.prisma.customEvent.count(w),
        budgets: await h.prisma.budget.count(w),
        chats: await h.prisma.chatThread.count(w),
        interviews: await h.prisma.interview.count(w),
        documents: await h.prisma.advisorDoc.count(w),
        saved: await h.prisma.savedItem.count(w),
        reminders: await h.prisma.reminder.count(w),
      };
    };
    const before = await countFor(idC);
    expect(Object.values(before).every((n) => n >= 1)).toBe(true);
    const aBefore = await countFor(idA);

    // confirmation is required
    expect((await C.del('/me', {})).statusCode).toBe(400);
    expect((await C.del('/me', { confirm: 'yes' })).statusCode).toBe(400);
    expect((await C.get('/me')).statusCode).toBe(200);

    expect((await C.del('/me', { confirm: 'DELETE' })).statusCode).toBe(204);
    const after = await countFor(idC);
    expect(Object.values(after).every((n) => n === 0)).toBe(true);
    expect((await C.get('/me')).statusCode).toBe(401);
    // the audit entry survives without the person's id or ip hash
    const audit = await h.prisma.auditLog.findFirst({ where: { action: 'test.touch' } });
    expect(audit?.actorId).toBeNull();
    expect(audit?.ipHash).toBeNull();
    // another user is untouched
    expect(await countFor(idA)).toEqual(aBefore);
    await h.prisma.auditLog.deleteMany({ where: { action: 'test.touch' } });
  });
});
