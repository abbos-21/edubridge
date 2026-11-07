import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { Client, cleanupUsers, harness, type Harness } from './helpers';
import { createMockLlm, mockReply } from '../src/ai/mock';
import type { Llm, LlmRequest, LlmResult } from '../src/ai/llm';
import { ApiError } from '../src/errors';

/** A model we control: records every request and answers with whatever the test says. */
function scripted(handler: (req: LlmRequest, n: number) => Promise<string | LlmResult> | string | LlmResult) {
  const calls: LlmRequest[] = [];
  const toResult = (r: string | LlmResult): LlmResult =>
    typeof r === 'string' ? { text: r, usage: { model: 'claude-sonnet-5-5', inputTokens: 1000, outputTokens: 500 }, refused: false, truncated: false } : r;
  const llm: Llm = {
    enabled: true,
    mock: false,
    modelFor: () => 'claude-sonnet-5-5',
    async complete(req) {
      calls.push(req);
      return toResult(await handler(req, calls.length));
    },
    async stream(req, onText) {
      calls.push(req);
      const r = toResult(await handler(req, calls.length));
      for (const w of r.text.split(/(?<=\s)/)) onText(w);
      return r;
    },
  };
  return { llm, calls };
}

const CV = 'Education: BSc Computer Science, TUIT, 2021-2025.\nExperience: intern at a bank for three months in 2024.\nSkills: Python, SQL.';
const promptText = (r: LlmRequest) => (typeof r.messages[0]!.content === 'string' ? r.messages[0]!.content : '');
const ids: string[] = [];
const cvBody = (over: object = {}) => ({ task: 'cv', lang: 'en', cv: CV, ...over });

let h: Harness;
let c: Client;
let uid: string;
let s: ReturnType<typeof scripted>;

beforeAll(async () => {
  s = scripted((req) => mockReply(req));
  h = await harness({}, undefined, s.llm);
  c = new Client(h.app);
  uid = await c.login();
  ids.push(uid);
});
afterAll(async () => {
  await h.prisma.aiUsage.deleteMany({ where: { userId: { in: ids } } });
  await cleanupUsers(h.prisma, ids);
  await h.close();
});

describe('access', () => {
  it('every AI route needs a signed-in user', async () => {
    const anon = new Client(h.app);
    expect((await anon.post('/ai/json', cvBody(), { csrf: false })).statusCode).toBe(401);
    expect((await anon.post('/ai/chat', { lang: 'en', messages: [{ role: 'user', content: 'hi' }] }, { csrf: false })).statusCode).toBe(401);
    expect((await anon.post('/ai/ocr', { images: [] }, { csrf: false })).statusCode).toBe(401);
    expect(s.calls.length).toBe(0);
  });
  it('writes need the CSRF token like every other write', async () => {
    expect((await c.post('/ai/json', cvBody(), { csrf: false })).statusCode).toBe(403);
  });
  it('/ai/health: guests see availability only; users also see their quota', async () => {
    const guest = (await new Client(h.app).get('/ai/health')).json();
    expect(guest).toEqual({ enabled: true, configured: true, mock: false });
    const me = (await c.get('/ai/health')).json();
    expect(me.quota).toMatchObject({ dailyLimit: 1000, usedToday: expect.any(Number) });
    expect(new Date(me.quota.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /ai/json: a valid analysis', () => {
  it('returns a validated result, records only sizes and cost, and stores no text', async () => {
    const r = await c.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.task).toBe('cv');
    expect(body.result.kind).toBe('cv');
    expect(body.result.scores).toHaveLength(7);
    expect(body.raw.overall).toBeTruthy(); // for the second-reader audit
    expect(body.usage).toMatchObject({ model: 'claude-sonnet-5-5', inputTokens: 1000, outputTokens: 500 });

    const row = await h.prisma.aiUsage.findFirstOrThrow({ where: { userId: uid, task: 'cv' }, orderBy: { createdAt: 'desc' } });
    expect(row).toMatchObject({ status: 'ok', tier: 'complex', inputTokens: 1000, outputTokens: 500 });
    expect(Number(row.costUsdEst)).toBeCloseTo((1000 * 2 + 500 * 10) / 1e6, 6);
    // nothing the student wrote is stored in the usage log
    expect(JSON.stringify(row)).not.toMatch(/Computer Science|TUIT|bank/);
  });
  it('sends the document numbered for reference, and the honesty rules, to the model', async () => {
    await c.post('/ai/json', cvBody());
    const p = promptText(s.calls[s.calls.length - 1]!);
    expect(p).toContain('[L1] Education: BSc Computer Science');
    expect(p).toContain('Never give admission or scholarship probabilities');
    expect(p).toContain('Target: none given');
  });
  it('uses no sampling parameters (current models reject them) and sets an effort level', async () => {
    await c.post('/ai/json', cvBody());
    const req = s.calls[s.calls.length - 1]! as Record<string, unknown>;
    expect(req.temperature).toBeUndefined();
    expect(req.effort).toBe('high');
    expect(req.tier).toBe('complex');
  });
  it('only the minimal profile reaches the model: no name, birth year or institution', async () => {
    await c.post('/ai/json', cvBody({ profile: { name: 'Aziz Karimov', birthYear: 2003, school: 'Lyceum 7', institution: 'TUIT', field: 'cs', ielts: 6.5 } }));
    const p = promptText(s.calls[s.calls.length - 1]!);
    for (const secret of ['Aziz', 'Karimov', '2003', 'Lyceum 7']) expect(p).not.toContain(secret);
    expect(p).toContain('"field":"cs"');
    expect(p).toContain('"ielts":6.5');
  });
  it('a quote the model invents is flagged as not found in the student\'s text', async () => {
    const { llm } = scripted((req) => {
      const base = JSON.parse(mockReply(req));
      base.weaknesses = [{ point: 'Claims an award', evidence: 'I won the national olympiad', consequence: 'x' }];
      return JSON.stringify(base);
    });
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const r = await c2.post('/ai/json', cvBody());
    expect(r.json().result.weaknesses[0].evidence).toMatchObject({ found: false });
    expect(r.json().result.strengths[0].evidence).toMatchObject({ found: true });
    await h2.close();
  });
  it('named targets add official facts from the catalogue to the prompt', async () => {
    await c.post('/ai/json', { task: 'letter', lang: 'en', type: 'motivation', text: 'I want to study at this university because I like data science and have built models. '.repeat(3), target: { kind: 'uni', id: 'universiti-malaya-my', level: 'master' } });
    const p = promptText(s.calls[s.calls.length - 1]!);
    expect(p).toContain('Universiti Malaya');
    expect(p).toContain('Official facts held by EduBridge');
    expect(p).toContain('HIGHLY SELECTIVE');
  });
});

describe('POST /ai/json: bad input and bad replies', () => {
  it('rejects unknown tasks, unknown fields, too-short text and a wrong language', async () => {
    expect((await c.post('/ai/json', { task: 'hack', lang: 'en' })).statusCode).toBe(400);
    expect((await c.post('/ai/json', cvBody({ extra: 1 }))).statusCode).toBe(400);
    expect((await c.post('/ai/json', cvBody({ cv: 'short' }))).statusCode).toBe(400);
    expect((await c.post('/ai/json', cvBody({ lang: 'de' }))).statusCode).toBe(400);
    expect((await c.post('/ai/json', cvBody({ target: { kind: 'uni', id: 'x', level: 'phd' } }))).statusCode).toBe(400);
  });
  it('a reply that is not JSON is an error (502), and no analysis is invented', async () => {
    const { llm } = scripted(() => 'Sorry, I cannot produce JSON today.');
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    const id = await c2.login();
    ids.push(id);
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(502);
    expect(r.json().error.code).toBe('ai_bad_reply');
    expect(r.json().result).toBeUndefined();
    expect((await h2.prisma.aiUsage.findFirstOrThrow({ where: { userId: id } })).status).toBe('bad_reply');
    await h2.close();
  });
  it('JSON that lacks the core fields is also an error', async () => {
    const { llm } = scripted(() => '{"overall":"fine"}');
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(502);
    expect(r.json().error.code).toBe('ai_bad_reply');
    await h2.close();
  });
  it('a refusal by the model is reported plainly (422) and counted', async () => {
    const { llm } = scripted(() => ({ text: '', usage: { model: 'claude-sonnet-5-5', inputTokens: 10, outputTokens: 0 }, refused: true, truncated: false }));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    const id = await c2.login();
    ids.push(id);
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe('ai_refused');
    expect((await h2.prisma.aiUsage.findFirstOrThrow({ where: { userId: id } })).status).toBe('refused');
    await h2.close();
  });
  it('a provider failure becomes a plain error with no provider details', async () => {
    const { llm } = scripted(() => {
      throw new ApiError(429, 'rate_limited', 'The AI service is busy. Try again in a minute.');
    });
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    const id = await c2.login();
    ids.push(id);
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(429);
    expect(r.json().error.code).toBe('rate_limited');
    expect((await h2.prisma.aiUsage.findFirstOrThrow({ where: { userId: id } })).status).toBe('error');
    await h2.close();
  });
});

describe('every structured task validates and returns its result', () => {
  const doc = 'I am applying because I built a small tool that helped my university and I want to learn more about data.\n\nIn 2024 I led a team of five students in a project.';
  const cases: Array<[string, object, (r: any) => void]> = [
    ['letter', { task: 'letter', lang: 'en', type: 'motivation', text: doc }, (r) => expect(r.kind).toBe('letter')],
    ['improve', { task: 'improve', lang: 'en', docType: 'motivation', action: 'specific', fullText: doc, passage: 'I led a team of five students in a project.' }, (r) => expect(r.revised).toContain('[')],
    ['interview_questions', { task: 'interview_questions', lang: 'en', kind: 'scholarship', count: 5 }, (r) => expect(r.questions.length).toBeGreaterThanOrEqual(3)],
    ['interview_feedback', { task: 'interview_feedback', lang: 'en', question: 'Why this scholarship?', answer: 'Because I want to learn.' }, (r) => expect(r.scores).toHaveLength(6)],
    ['consistency', { task: 'consistency', lang: 'en', letterType: 'motivation', cv: CV + ' '.repeat(5), letter: doc }, (r) => expect(r.summary).toBeTruthy()],
    ['growth_ideas', { task: 'growth_ideas', lang: 'en', level: 'master', field: 'cs', group: 'middle', months: 6, hours: 4, budget: 'low' }, (r) => expect(r.ideas.length).toBeGreaterThan(0)],
    ['activity_review', { task: 'activity_review', lang: 'en', level: 'master', field: 'cs', group: 'middle', activity: 'I built a website for my class project.' }, (r) => expect(['weak', 'moderate', 'strong']).toContain(r.strength)],
    ['audit', { task: 'audit', lang: 'en', kind: 'cv', doc: CV, draft: { overall: 'x' } }, (r) => expect(r.reviewed).toBe(true)],
  ];
  it.each(cases)('%s', async (_name, body, check) => {
    const r = await c.post('/ai/json', body);
    expect(r.statusCode, r.body).toBe(200);
    check(r.json().result);
  });
  it('uses the right model tier: heavy analyses complex, short tasks default', async () => {
    const tiers: Record<string, string> = {};
    for (const [name, body] of cases) {
      await c.post('/ai/json', body);
      tiers[name] = s.calls[s.calls.length - 1]!.tier;
    }
    expect(tiers).toMatchObject({ letter: 'complex', audit: 'complex', consistency: 'complex', growth_ideas: 'complex', improve: 'default', interview_questions: 'default', interview_feedback: 'default', activity_review: 'default' });
  });
});

describe('limits and the budget cap', () => {
  async function limited(over: Record<string, string>, llm: Llm = createMockLlm()) {
    const h2 = await harness(over, undefined, llm);
    const c2 = new Client(h2.app);
    const id = await c2.login();
    ids.push(id);
    return { h2, c2, id };
  }
  it('the daily quota per user is enforced with Retry-After, and counts failures too', async () => {
    const { h2, c2 } = await limited({ AI_DAILY_REQUESTS_PER_USER: '2' });
    expect((await c2.post('/ai/json', cvBody())).statusCode).toBe(200);
    expect((await c2.post('/ai/json', cvBody())).statusCode).toBe(200);
    const third = await c2.post('/ai/json', cvBody());
    expect(third.statusCode).toBe(429);
    expect(third.json().error.code).toBe('quota_exceeded');
    expect(Number(third.headers['retry-after'])).toBeGreaterThan(0);
    expect(third.json().error.message).toMatch(/midnight/);
    // another user is not affected
    const other = new Client(h2.app);
    ids.push(await other.login());
    expect((await other.post('/ai/json', cvBody())).statusCode).toBe(200);
    // health shows the quota used
    expect((await c2.get('/ai/health')).json().quota).toMatchObject({ dailyLimit: 2, usedToday: 2, remainingToday: 0 });
    await h2.close();
  });
  it('the per-minute burst limit stops floods', async () => {
    const { h2, c2 } = await limited({ AI_BURST_PER_MIN: '3' });
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await c2.post('/ai/json', { task: 'interview_questions', lang: 'en', kind: 'scholarship', count: 5 })).statusCode);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
    await h2.close();
  });
  it('the monthly budget cap pauses the AI for everyone, with a plain message', async () => {
    const { h2, c2, id } = await limited({ AI_MONTHLY_BUDGET_USD: '1' });
    await h2.prisma.aiUsage.create({ data: { userId: id, task: 'cv', tier: 'complex', model: 'x', status: 'ok', costUsdEst: 1.5 } });
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(503);
    expect(r.json().error.code).toBe('ai_disabled');
    expect(r.json().error.message).toMatch(/monthly limit/);
    await h2.close();
  });
  it('a suspended user, the kill switch and a missing key are refused before any model call', async () => {
    const { llm, calls } = scripted((req) => mockReply(req));
    const { h2, c2, id } = await limited({}, llm);
    await h2.prisma.user.update({ where: { id }, data: { suspendedAi: true } });
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(403);
    expect(r.json().error.code).toBe('ai_suspended');
    await h2.close();

    const off = await limited({ AI_ENABLED: 'false' }, llm);
    expect((await off.c2.post('/ai/json', cvBody())).json().error.code).toBe('ai_disabled');
    await off.h2.close();

    const noKey = await limited({}, { ...createMockLlm(), enabled: false });
    const nk = await noKey.c2.post('/ai/json', cvBody());
    expect(nk.statusCode).toBe(503);
    expect(nk.json().error.code).toBe('ai_not_configured');
    await noKey.h2.close();
    expect(calls).toHaveLength(0);
  });
  it('one request at a time per action: a parallel duplicate gets 409', async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const { llm } = scripted(async (req) => {
      await gate;
      return mockReply(req);
    });
    const { h2, c2 } = await limited({}, llm);
    const first = c2.post('/ai/json', cvBody());
    await new Promise((r) => setTimeout(r, 150));
    const second = await c2.post('/ai/json', cvBody());
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe('ai_busy');
    // a different action is allowed
    const other = c2.post('/ai/json', { task: 'interview_questions', lang: 'en', kind: 'scholarship', count: 5 });
    release();
    expect((await first).statusCode).toBe(200);
    expect((await other).statusCode).toBe(200);
    // and once finished, the same action can run again
    expect((await c2.post('/ai/json', cvBody())).statusCode).toBe(200);
    await h2.close();
  });
});

describe('abort when the browser goes away', () => {
  it('cancels the model call and records the request as aborted', async () => {
    let seen: AbortSignal | undefined;
    const { llm } = scripted(
      (req) =>
        new Promise((_res, rej) => {
          seen = req.signal;
          req.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        }),
    );
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    const id = await c2.login();
    ids.push(id);
    await h2.app.listen({ port: 0, host: '127.0.0.1' });
    const port = (h2.app.server.address() as AddressInfo).port;
    const ctrl = new AbortController();
    const headers = { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: [...c2.cookies].map(([k, v]) => `${k}=${v}`).join('; '), 'x-csrf-token': c2.cookies.get('eb_csrf')! };
    const p = fetch(`http://127.0.0.1:${port}/api/v1/ai/json`, { method: 'POST', headers, body: JSON.stringify(cvBody()), signal: ctrl.signal }).catch(() => 'aborted');
    await new Promise((r) => setTimeout(r, 400));
    ctrl.abort();
    expect(await p).toBe('aborted');
    await new Promise((r) => setTimeout(r, 400));
    expect(seen?.aborted).toBe(true);
    expect((await h2.prisma.aiUsage.findFirstOrThrow({ where: { userId: id } })).status).toBe('aborted');
    await h2.close();
  });
});

describe('POST /ai/chat (server-sent events)', () => {
  async function chat(h2: Harness, c2: Client, body: object) {
    if (!h2.app.server.listening) await h2.app.listen({ port: 0, host: '127.0.0.1' });
    const port = (h2.app.server.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: [...c2.cookies].map(([k, v]) => `${k}=${v}`).join('; '), 'x-csrf-token': c2.cookies.get('eb_csrf')! },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const events = text.split('\n\n').filter(Boolean).map((blk) => {
      const ev = /^event: (.+)$/m.exec(blk)![1]!;
      return { ev, data: JSON.parse(/^data: (.+)$/m.exec(blk)![1]!) };
    });
    return { res, events };
  }
  const msg = (content: string) => ({ lang: 'en', messages: [{ role: 'user', content }] });

  it('streams text, then sends follow-ups and flags links that are not in the official records', async () => {
    const { llm } = scripted((req) => mockReply(req));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const { res, events } = await chat(h2, c2, msg('What are the application steps for Universiti Malaya?'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(events.filter((e) => e.ev === 'delta').length).toBeGreaterThan(3);
    const done = events.find((e) => e.ev === 'done')!.data;
    expect(done.followups).toHaveLength(3);
    expect(done.text).not.toContain('FOLLOWUPS');
    const byUrl = Object.fromEntries(done.linkFlags.map((f: any) => [f.url, f.verified]));
    expect(byUrl['https://study.um.edu.my/how-to-apply']).toBe(true);
    expect(byUrl['https://not-in-records.example/page']).toBe(false);
    expect(done.records.map((r: any) => r.id)).toContain('universiti-malaya-my');
    await h2.close();
  });
  it('documents reach the model only when the student turns sharing on', async () => {
    const { llm, calls } = scripted((req) => mockReply(req));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const docs = [{ type: 'cv', title: 'My CV', text: 'PRIVATE-CV-CONTENT-XYZ' }];
    await chat(h2, c2, { ...msg('hello'), docs });
    expect(calls[0]!.system).not.toContain('PRIVATE-CV-CONTENT-XYZ');
    await chat(h2, c2, { ...msg('hello again'), docs, shareDocs: true });
    expect(calls[1]!.system).toContain('PRIVATE-CV-CONTENT-XYZ');
    await h2.close();
  });
  it('earlier turns are passed on, the profile is minimal, and today\'s date is given', async () => {
    const { llm, calls } = scripted((req) => mockReply(req));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    await chat(h2, c2, { lang: 'uz', messages: [{ role: 'user', content: 'Salom' }, { role: 'assistant', content: 'Assalomu alaykum' }, { role: 'user', content: 'IELTS kerakmi?' }], profile: { name: 'Secret Name', birthYear: 2001, field: 'cs' } });
    const req = calls[0]!;
    expect(req.messages).toHaveLength(3);
    expect(req.system).not.toContain('Secret Name');
    expect(req.system).toContain('"field":"cs"');
    expect(req.system).toContain(`TODAY: ${new Date().toISOString().slice(0, 10)}`);
    expect(req.system).toContain('Uzbek (Latin script');
    await h2.close();
  });
  it('the last message must be the student\'s; empty or oversized messages are rejected before streaming', async () => {
    const h2 = await harness({}, undefined, createMockLlm());
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    expect((await c2.post('/ai/chat', { lang: 'en', messages: [{ role: 'assistant', content: 'hi' }] })).statusCode).toBe(400);
    expect((await c2.post('/ai/chat', { lang: 'en', messages: [] })).statusCode).toBe(400);
    expect((await c2.post('/ai/chat', { lang: 'en', messages: [{ role: 'user', content: 'x'.repeat(8001) }] })).statusCode).toBe(400);
    expect((await c2.post('/ai/chat', { lang: 'en', messages: [{ role: 'user', content: 'hi' }], extra: true })).statusCode).toBe(400);
    await h2.close();
  });
  it('quota errors arrive as normal JSON before any streaming starts', async () => {
    const h2 = await harness({ AI_DAILY_REQUESTS_PER_USER: '0' }, undefined, createMockLlm());
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const r = await c2.post('/ai/chat', { lang: 'en', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.statusCode).toBe(429);
    expect(r.json().error.code).toBe('quota_exceeded');
    await h2.close();
  });
  it('a model refusal during chat is sent as an error event', async () => {
    const { llm } = scripted(() => ({ text: '', usage: { model: 'claude-sonnet-5-5', inputTokens: 5, outputTokens: 0 }, refused: true, truncated: false }));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const { events } = await chat(h2, c2, msg('hello'));
    expect(events.find((e) => e.ev === 'error')!.data.code).toBe('ai_refused');
    await h2.close();
  });
  it('deep mode uses the stronger tier and a longer budget', async () => {
    const { llm, calls } = scripted((req) => mockReply(req));
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    await chat(h2, c2, { ...msg('explain'), depth: 'deep' });
    expect(calls[0]).toMatchObject({ tier: 'complex', effort: 'high' });
    await h2.close();
  });
});

describe('POST /ai/ocr', () => {
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' + 'A'.repeat(100)).toString('base64');
  it('reads scanned pages and returns validated text', async () => {
    const { llm, calls } = scripted(() => '{"pages":[{"n":1,"text":"Hello world","legible":"yes"}]}');
    const h2 = await harness({}, undefined, llm);
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    const r = await c2.post('/ai/ocr', { images: [{ mediaType: 'image/png', data: PNG }] });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().result.pages[0]).toMatchObject({ text: 'Hello world', legible: 'yes' });
    const content = calls[0]!.messages[0]!.content as Array<{ type: string }>;
    expect(content.map((b) => b.type)).toEqual(['image', 'text']);
    await h2.close();
  });
  it('rejects non-images, bad base64, empty and too many pages', async () => {
    const h2 = await harness({}, undefined, createMockLlm());
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    expect((await c2.post('/ai/ocr', { images: [{ mediaType: 'application/pdf', data: PNG }] })).statusCode).toBe(400);
    expect((await c2.post('/ai/ocr', { images: [{ mediaType: 'image/png', data: 'not base64!!' + 'x'.repeat(200) }] })).statusCode).toBe(400);
    expect((await c2.post('/ai/ocr', { images: [] })).statusCode).toBe(400);
    expect((await c2.post('/ai/ocr', { images: Array.from({ length: 7 }, () => ({ mediaType: 'image/png', data: PNG })) })).statusCode).toBe(400);
    await h2.close();
  });
});

describe('the mock model (development)', () => {
  it('AI_MOCK serves valid replies without a key and is reported by /ai/health', async () => {
    const h2 = await harness({ AI_MOCK: 'true' });
    const c2 = new Client(h2.app);
    ids.push(await c2.login());
    expect((await c2.get('/ai/health')).json()).toMatchObject({ enabled: true, mock: true });
    const r = await c2.post('/ai/json', cvBody());
    expect(r.statusCode).toBe(200);
    expect(r.json().result.strengths[0].evidence.found).toBe(true);
    await h2.close();
  });
  it('without a key or the mock the AI reports "not configured" and never calls out', async () => {
    const h2 = await harness({});
    expect((await new Client(h2.app).get('/ai/health')).json()).toEqual({ enabled: false, configured: false, mock: false });
    await h2.close();
  });
});
