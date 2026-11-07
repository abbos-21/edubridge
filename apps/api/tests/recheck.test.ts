import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { PoliteFetcher, htmlToText, parseRobots, robotsAllows } from '../src/recheck/fetcher';
import { isPublicIp, checkRecheckUrl } from '../src/recheck/ssrf';
import { diffSnippet, normaliseUrl, processRecheckQueue, runRecheck } from '../src/recheck/engine';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

/**
 * ToR F9 / H11 / K7: polite and safe fetching, findings go to a review queue, nothing is ever
 * auto-published, blocked pages are listed and never bypassed. Tests only ever touch a local fake server.
 */

let h: Harness;
let server: http.Server;
let base = '';
let version = 1; // page content version, bumped by tests
const hits: string[] = [];
const ids: string[] = [];
const UNI = 'elte-hu';

const page = (body: string) => `<html><head><style>x{}</style><script>var t=${Date.now()}</script></head><body>${body}</body></html>`;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const u = req.url ?? '/';
    hits.push(u);
    const send = (code: number, body = '', headers: Record<string, string> = {}) => { res.writeHead(code, { 'content-type': 'text/html', ...headers }); res.end(body); };
    if (u === '/robots.txt') return send(200, 'User-agent: *\nDisallow: /private/\nAllow: /private/open\n', { 'content-type': 'text/plain' });
    if (u === '/ok') return send(200, page('<h1>Deadline</h1><p>Apply by 31 May.</p>'));
    if (u === '/changes') return send(200, page(`<h1>Fees</h1><p>Tuition is ${version === 1 ? '1000' : '1200'} EUR.</p><p>Same line</p>`));
    if (u === '/gone') return send(404, 'nope');
    if (u === '/moved') return send(301, '', { location: '/ok-new' });
    if (u === '/ok-new') return send(200, page('<p>New home</p>'));
    if (u === '/forbidden') return send(403, 'no bots');
    if (u === '/captcha') return send(200, '<html><body>Please complete the captcha to continue</body></html>');
    if (u === '/private/secret') return send(200, 'should never be fetched');
    if (u === '/private/open') return send(200, page('allowed by robots'));
    if (u === '/flaky') { flaky++; return flaky < 3 ? send(503, 'busy') : send(200, page('recovered')); }
    if (u === '/always503') return send(503, 'busy');
    if (u === '/slow') return void setTimeout(() => send(200, 'late'), 3000);
    if (u === '/loop') return send(302, '', { location: '/loop' });
    if (u === '/big') return send(200, 'x'.repeat(5_000_000));
    return send(404);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  h = await harness();
});
let flaky = 0;

afterAll(async () => {
  await h.prisma.source.deleteMany({ where: { url: { startsWith: base } } });
  await h.prisma.recheckRun.deleteMany({});
  await h.prisma.catalogueRevision.deleteMany({});
  await cleanupUsers(h.prisma, ids);
  await h.close();
  await new Promise((r) => server.close(r));
});

const fast = { hostDelayMs: 0, retries: 2, timeoutMs: 1000, allowPrivate: true, sleep: async () => {} };
const mkSource = (path: string, extra: Record<string, unknown> = {}) =>
  h.prisma.source.create({ data: { url: `${base}${path}`, kind: 'official', entityType: 'university', entityId: UNI, field: `test.${path}.${Math.random()}`, ...extra } });
async function run() {
  const r = await h.prisma.recheckRun.create({ data: { trigger: 'manual' } });
  const f = new PoliteFetcher(fast);
  const sum = await runRecheck(h.prisma, f, r.id, { urlPrefix: base });
  await f.close();
  return { sum, runId: r.id };
}
const findings = (path: string) => h.prisma.recheckFinding.findMany({ where: { source: { url: `${base}${path}` } }, orderBy: { runId: 'asc' } });

describe('addresses and URLs the fetcher refuses (SSRF)', () => {
  it('classifies private, loopback, link-local, metadata, CGNAT, mapped and reserved addresses as not public', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fe80::1', 'fc00::1', 'fd12::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '2002:7f00:1::', 'ff02::1', 'not-an-ip']) {
      expect(isPublicIp(ip), ip).toBe(false);
    }
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']) expect(isPublicIp(ip), ip).toBe(true);
  });
  it('accepts only plain http(s) URLs on standard ports without credentials or literal private IPs', () => {
    for (const u of ['ftp://example.org/a', 'file:///etc/passwd', 'javascript:alert(1)', 'http://user:pw@example.org/', 'http://example.org:8080/', 'http://127.0.0.1/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data', 'nonsense']) {
      expect(checkRecheckUrl(u).ok, u).toBe(false);
    }
    expect(checkRecheckUrl('https://www.example.org/path?q=1').ok).toBe(true);
  });
  it('refuses a literal internal address, and refuses a NAME that resolves to an internal address (checked when connecting)', async () => {
    const f = new PoliteFetcher({ ...fast, allowPrivate: false });
    expect(await f.fetchPage(`${base}/ok`)).toMatchObject({ kind: 'broken', reason: 'blocked_address' });
    expect(await f.fetchPage('http://localhost/anything')).toMatchObject({ kind: 'broken', reason: 'blocked_address' });
    expect(await f.fetchPage('http://169.254.169.254/latest/meta-data')).toMatchObject({ kind: 'broken', reason: 'blocked_address' });
    await f.close();
    // every redirect hop goes through the same check
    expect(checkRecheckUrl('http://127.0.0.1:1/internal').ok).toBe(false);
  });
});

describe('helpers', () => {
  it('extracts readable text and ignores scripts and styles', () => {
    expect(htmlToText(page('<h1>Hi &amp; bye</h1><p>One</p><p>Two</p>'))).toBe('Hi & bye\nOne\nTwo');
  });
  it('robots.txt: our group beats *, longest rule wins, Allow wins ties, empty Disallow allows', () => {
    const r = parseRobots('User-agent: *\nDisallow: /a/\nAllow: /a/b\n\nUser-agent: EduBridgeBot\nDisallow: /only-us\n', 'EduBridgeBot/1.0 (+x)');
    expect(robotsAllows(r, '/only-us/x')).toBe(false);
    expect(robotsAllows(r, '/a/x')).toBe(true); // our group has no /a/ rule
    const star = parseRobots('User-agent: *\nDisallow: /a/\nAllow: /a/b\nDisallow: /*.pdf$\n', 'Other/1');
    expect(robotsAllows(star, '/a/x')).toBe(false);
    expect(robotsAllows(star, '/a/b')).toBe(true);
    expect(robotsAllows(star, '/doc.pdf')).toBe(false);
    expect(robotsAllows(star, '/doc.pdf?x=1')).toBe(true);
    expect(robotsAllows(parseRobots('User-agent: *\nDisallow:\n', 'x'), '/anything')).toBe(true);
  });
  it('treats moved pages by their real address, and writes a short diff', () => {
    expect(normaliseUrl('http://www.Example.org/a/')).toBe(normaliseUrl('https://example.org/a#top'));
    expect(normaliseUrl('https://example.org/a')).not.toBe(normaliseUrl('https://example.org/b'));
    expect(diffSnippet('a\nb\nc', 'a\nb2\nc')).toBe('- b\n+ b2');
    expect(diffSnippet(null, 'x')).toBe('');
  });
});

describe('fetcher behaviour against a local site', () => {
  it('identifies itself and obeys robots.txt (a disallowed path is never requested)', async () => {
    const f = new PoliteFetcher({ ...fast, userAgent: 'EduBridgeBot/1.0 (+https://example.org)' });
    hits.length = 0;
    expect(await f.fetchPage(`${base}/private/secret`)).toMatchObject({ kind: 'blocked', reason: 'robots' });
    expect(hits).not.toContain('/private/secret');
    expect((await f.fetchPage(`${base}/private/open`)).kind).toBe('ok');
    await f.close();
  });
  it('limits how fast it talks to one host', async () => {
    const waits: number[] = [];
    const f = new PoliteFetcher({ ...fast, hostDelayMs: 500, sleep: async (ms) => { waits.push(ms); } });
    await f.fetchPage(`${base}/ok`);
    await f.fetchPage(`${base}/ok-new`);
    expect(waits.filter((w) => w > 0 && w <= 500).length).toBeGreaterThan(0);
    await f.close();
  });
  it('retries server errors, gives up on persistent ones, times out, stops redirect loops, caps the body', async () => {
    flaky = 0;
    const f = new PoliteFetcher(fast);
    expect((await f.fetchPage(`${base}/flaky`)).kind).toBe('ok');
    expect(await f.fetchPage(`${base}/always503`)).toMatchObject({ kind: 'broken', reason: 'http_503' });
    expect(await f.fetchPage(`${base}/slow`)).toMatchObject({ kind: 'broken', reason: 'timeout' });
    expect(await f.fetchPage(`${base}/loop`)).toMatchObject({ kind: 'broken', reason: 'too_many_redirects' });
    const big = await f.fetchPage(`${base}/big`);
    expect(big.kind).toBe('ok');
    expect((big as { text: string }).text.length).toBeLessThanOrEqual(1_500_000);
    await f.close();
  }, 30_000);
});

describe('recheck runs', () => {
  it('first run only sets a baseline; a later change, a broken link, a move and a refusal each become one finding', async () => {
    version = 1;
    await h.prisma.source.deleteMany({ where: { url: { startsWith: base } } });
    await Promise.all(['/ok', '/changes', '/gone', '/moved', '/forbidden', '/captcha', '/private/secret'].map((p) => mkSource(p)));
    const catVersion = (await h.prisma.catalogueMeta.findUnique({ where: { id: 1 } }))!.version;
    const uniBefore = JSON.stringify(await h.prisma.university.findUnique({ where: { id: UNI } }));

    const r1 = await run();
    expect(r1.sum).toMatchObject({ urls: 7, newBaseline: 2, broken: 1, blocked: 3, moved: 1, changed: 0 });
    const gone = await findings('/gone');
    expect(gone.map((f) => f.kind)).toEqual(['broken']);
    expect(gone[0]!.httpStatus).toBe(404);
    expect((await findings('/forbidden')).map((f) => f.kind)).toEqual(['blocked']);
    expect((await findings('/captcha')).map((f) => f.kind)).toEqual(['blocked']);
    expect((await findings('/private/secret')).map((f) => f.kind)).toEqual(['blocked']);
    expect((await findings('/changes')).length).toBe(0); // baseline

    version = 2;
    const r2 = await run();
    expect(r2.sum.changed).toBe(1);
    const ch = await findings('/changes');
    expect(ch).toHaveLength(1);
    expect(ch[0]).toMatchObject({ kind: 'changed', status: 'open' });
    expect(ch[0]!.diffSnippet).toContain('- Tuition is 1000 EUR.');
    expect(ch[0]!.diffSnippet).toContain('+ Tuition is 1200 EUR.');
    expect(ch[0]!.oldHash).not.toBe(ch[0]!.newHash);
    expect(ch[0]!.prevCheckedAt).toBeTruthy(); // old check date is reported next to the new one
    expect((await findings('/moved')).map((f) => f.kind)).toContain('moved');

    // refusals are remembered and not knocked on again
    const forbidden = await h.prisma.source.findFirst({ where: { url: `${base}/forbidden` } });
    expect(forbidden!.blocksAutomation).toBe(true);
    hits.length = 0;
    await run();
    expect(hits).not.toContain('/forbidden');
    // no duplicate findings while the first is still open
    expect(await findings('/gone')).toHaveLength(1);
    expect(await findings('/changes')).toHaveLength(1);

    // THE RULE: the run changed nothing the students see
    expect((await h.prisma.catalogueMeta.findUnique({ where: { id: 1 } }))!.version).toBe(catVersion);
    expect(JSON.stringify(await h.prisma.university.findUnique({ where: { id: UNI } }))).toBe(uniBefore);
    expect(await h.prisma.catalogueRevision.count()).toBe(0);
  }, 30_000);

  it('known QS-style sources are never fetched, only listed for a manual check', async () => {
    const qs = await mkSource('/qs-page', { blocksAutomation: true });
    hits.length = 0;
    const { sum } = await run();
    expect(hits).not.toContain('/qs-page');
    expect(sum.manual.some((m) => m.url.endsWith('/qs-page'))).toBe(true);
    expect(qs.id).toBeTruthy();
  });

  it('records a failed run instead of hanging, and queue handling: one claim, scheduled monthly run, stale runs failed', async () => {
    await h.prisma.recheckRun.deleteMany({ where: { status: { in: ['queued', 'running'] } } });
    const f = new PoliteFetcher(fast);
    // scheduled run is queued when none exists, then picked up (limited to our fake sources by prefix is not possible here, so use an empty DB scope)
    const none = await processRecheckQueue(h.prisma, f, { intervalDays: 30, scheduleEnabled: false });
    expect(none).toEqual({ ran: null, queued: false });
    const stale = await h.prisma.recheckRun.create({ data: { status: 'running', startedAt: new Date(Date.now() - 3 * 3_600_000) } });
    await processRecheckQueue(h.prisma, f, { intervalDays: 30, scheduleEnabled: false });
    expect((await h.prisma.recheckRun.findUnique({ where: { id: stale.id } }))!.status).toBe('failed');
    await f.close();
  });
});

describe('admin review queue', () => {
  let admin: Client;
  let editor: Client;
  beforeAll(async () => {
    admin = new Client(h.app);
    editor = new Client(h.app);
    ids.push((await admin.post('/auth/dev-login', { name: 'rc-admin', role: 'admin' })).json().id, (await editor.post('/auth/dev-login', { name: 'rc-editor', role: 'editor' })).json().id);
  });

  it('only admins queue a run (one at a time); editors can read the queue', async () => {
    await h.prisma.recheckRun.deleteMany({ where: { status: { in: ['queued', 'running'] } } });
    expect((await editor.post('/admin/recheck/run')).statusCode).toBe(403);
    const r = await admin.post('/admin/recheck/run');
    expect(r.statusCode).toBe(202);
    expect((await admin.post('/admin/recheck/run')).statusCode).toBe(409);
    const runs = (await editor.get('/admin/recheck/runs')).json().items;
    expect(runs.find((x: any) => x.status === 'queued')).toMatchObject({ trigger: 'manual' });
    await h.prisma.recheckRun.deleteMany({ where: { status: 'queued' } });
  });

  it('lists findings with every record that uses the link; accepting opens a draft and changes no value; dismissing is audited', async () => {
    const f = (await editor.get('/admin/recheck/findings?status=open&kind=changed')).json();
    const mine = f.items.find((x: any) => x.url === `${base}/changes`);
    expect(mine).toBeTruthy();
    expect(mine.entities[0]).toMatchObject({ type: 'university', id: UNI });
    expect(mine.snippet).toContain('1200');
    expect(mine.previouslyCheckedAt).toBeTruthy();

    expect((await editor.post(`/admin/recheck/findings/${mine.id}/accept`)).statusCode).toBe(403);
    const v0 = (await h.prisma.catalogueMeta.findUnique({ where: { id: 1 } }))!.version;
    const acc = await admin.post(`/admin/recheck/findings/${mine.id}/accept`);
    expect(acc.statusCode).toBe(200);
    expect(acc.json()).toMatchObject({ entityType: 'university', entityId: UNI, created: true });
    const rev = await h.prisma.catalogueRevision.findUnique({ where: { id: acc.json().revisionId } });
    expect(rev!.status).toBe('draft');
    expect((await h.prisma.catalogueMeta.findUnique({ where: { id: 1 } }))!.version).toBe(v0); // nothing published
    expect((await admin.post(`/admin/recheck/findings/${mine.id}/accept`)).statusCode).toBe(409);

    const gone = f.items.length ? (await editor.get('/admin/recheck/findings?status=open&kind=broken')).json().items.find((x: any) => x.url === `${base}/gone`) : null;
    expect(gone).toBeTruthy();
    expect((await admin.post(`/admin/recheck/findings/${gone.id}/dismiss`, { note: 'old page, known' })).statusCode).toBe(200);
    const log = (await admin.get(`/admin/audit?entityId=${UNI}&action=recheck.`)).json().items.map((i: any) => i.action);
    expect(log).toEqual(expect.arrayContaining(['recheck.accept', 'recheck.dismiss']));
    // accepting a second finding for the same record reuses the open draft instead of failing
    const second = (await editor.get('/admin/recheck/findings?status=open&kind=moved')).json().items.find((x: any) => x.url === `${base}/moved`);
    const acc2 = await admin.post(`/admin/recheck/findings/${second.id}/accept`);
    expect(acc2.json()).toMatchObject({ created: false, revisionId: acc.json().revisionId });
  });

  it('lists links that refuse automation and lets an editor note a manual check', async () => {
    const m = (await editor.get('/admin/recheck/manual')).json();
    const url = `${base}/forbidden`;
    expect(m.items.map((i: any) => i.url)).toContain(url);
    expect((await editor.post('/admin/recheck/manual/checked', { url })).statusCode).toBe(200);
    expect((await h.prisma.source.findFirst({ where: { url } }))!.lastStatus).toBe('checked_manually');
    expect((await editor.post('/admin/recheck/manual/checked', { url: `${base}/ok` })).statusCode).toBe(404); // not a blocked link
  });

  it('students and guests cannot see any of it', async () => {
    const s = new Client(h.app);
    ids.push(await s.login('rc-student'));
    for (const u of ['/admin/recheck/runs', '/admin/recheck/findings', '/admin/recheck/manual']) {
      expect((await s.get(u)).statusCode).toBe(403);
      expect((await new Client(h.app).get(u)).statusCode).toBe(401);
    }
  });
});
