import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import ICAL from 'ical.js';
import { buildIcs, fold } from '../src/calendar/ics';
import { collectCalendarItems } from '../src/calendar/items';
import { CatalogRepo } from '../src/lib/catalogRepo';
import { createMockTelegram } from '../src/bot/telegram';
import { backoffMs, deliver, dueAtFor, inQuietHours, materialise, runCycle } from '../src/reminders/engine';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

const SECRET = 'w'.repeat(24);
const HDR = { 'x-telegram-bot-api-secret-token': SECRET };
const tg = createMockTelegram();
let h: Harness;
let repo: CatalogRepo;
const users: string[] = [];

// A university with a confirmed deadline in the data: 2027-05-31, 7 days before = 2027-05-24, 1 day = 2027-05-30.
const UNI = 'elte-hu';
const D_DATE = '2027-05-31';
const at = (iso: string) => new Date(iso);

beforeAll(async () => {
  h = await harness({ TELEGRAM_WEBHOOK_SECRET: SECRET }, undefined, undefined, tg);
  repo = new CatalogRepo(h.prisma);
});
afterAll(async () => {
  await cleanupUsers(h.prisma, users);
  await h.close();
});

async function newUser(name: string) {
  const c = new Client(h.app);
  const id = await c.login(`rem-${name}-${Math.random().toString(36).slice(2, 7)}`);
  users.push(id);
  return { c, id };
}
const save = (c: Client, refs: string[]) => c.put('/me/saved', { items: refs.map((ref) => ({ kind: 'any', ref })) });
async function linkChat(c: Client, chat: number) {
  const code = (await c.post('/me/telegram/link-code')).json().code as string;
  await h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: HDR, payload: { message: { text: `/start ${code}`, chat: { id: chat, type: 'private' } } } });
  return code;
}
const say = (chat: number, text: string, type = 'private') => h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: HDR, payload: { message: { text, chat: { id: chat, type }, from: { language_code: 'en' } } } });
const last = () => tg.sent[tg.sent.length - 1]!;

describe('calendar items and the .ics file', () => {
  it('includes confirmed, open, future deadlines of saved universities, and leaves out the rest', async () => {
    const { id, c } = await newUser('items');
    await save(c, [UNI]);
    const items = await collectCalendarItems(h.prisma, repo, id, at('2027-05-01T00:00:00Z'));
    const d = items.find((i) => i.uid === `deadline-${UNI}-bachelor-${D_DATE}`);
    expect(d).toBeTruthy();
    expect(d!.sourceUrl).toMatch(/^https?:\/\//);
    // after the date it has passed: gone
    expect((await collectCalendarItems(h.prisma, repo, id, at('2027-06-02T00:00:00Z'))).some((i) => i.uid.includes(UNI))).toBe(false);
    // nothing saved: nothing included
    const other = await newUser('empty');
    expect(await collectCalendarItems(h.prisma, repo, other.id, at('2027-05-01T00:00:00Z'))).toEqual([]);
  });

  it('an unsourced or closed deadline never reaches a calendar', async () => {
    const { id, c } = await newUser('unconfirmed');
    await save(c, [UNI]);
    const u = await h.prisma.universityLevel.findUnique({ where: { universityId_level: { universityId: UNI, level: 'bachelor' } } });
    const data = u!.data as any;
    try {
      await h.prisma.universityLevel.update({ where: { id: u!.id }, data: { data: { ...data, deadline: { ...data.deadline, source: null }, sources: [] } } });
      repo.invalidate();
      await h.prisma.catalogueMeta.update({ where: { id: 1 }, data: { version: { increment: 1 } } });
      expect((await collectCalendarItems(h.prisma, repo, id, at('2027-05-01T00:00:00Z'))).some((i) => i.uid.includes(UNI))).toBe(false);
      await h.prisma.universityLevel.update({ where: { id: u!.id }, data: { data: { ...data, open: 'no' } } });
      await h.prisma.catalogueMeta.update({ where: { id: 1 }, data: { version: { increment: 1 } } });
      expect((await collectCalendarItems(h.prisma, repo, id, at('2027-05-01T00:00:00Z'))).some((i) => i.uid.includes(UNI))).toBe(false);
    } finally {
      await h.prisma.universityLevel.update({ where: { id: u!.id }, data: { data } });
      await h.prisma.catalogueMeta.update({ where: { id: 1 }, data: { version: { increment: 1 } } });
    }
  });

  it('plan tasks and own dates are included unless done, undated or past', async () => {
    const { id, c } = await newUser('tasks');
    const future = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
    await c.post('/me/applications', { opportunityRef: 'x', data: { tasks: [{ id: 'a', title: 'Ask for a reference letter', due: future(20) }, { id: 'b', title: 'Done already', due: future(21), done: true }, { id: 'c', title: 'No date' }, { id: 'd', title: 'Past', due: '2020-01-01' }] } });
    await c.post('/me/events', { data: { title: 'IELTS test', date: future(40) } });
    await c.post('/me/events', { data: { title: 'Broken date', date: '31/12/2030' } });
    const titles = (await collectCalendarItems(h.prisma, repo, id)).map((i) => i.name);
    expect(titles).toEqual(['Ask for a reference letter', 'IELTS test']);
  });

  it('builds RFC 5545 that a strict parser reads: all-day events, stable UIDs, CRLF, escaped text, folded lines', async () => {
    const { id } = await newUser('ics');
    const items = [
      { uid: 'deadline-x-bachelor-2027-05-31', kind: 'deadline' as const, date: '2027-05-31', name: 'Universität, München; "Test"', level: 'bachelor' as const, intake: 'September 2027', sourceUrl: 'https://example.org/' + 'a'.repeat(120) },
      { uid: 'task-1', kind: 'task' as const, date: '2027-06-01', name: 'Oʻzbekcha vazifa: tarjima' },
    ];
    void id;
    for (const lang of ['uz', 'ru', 'en'] as const) {
      const text = buildIcs(items, lang, at('2026-11-07T10:00:00Z'));
      expect(text.endsWith('\r\n')).toBe(true);
      expect(text.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
      expect(text).not.toMatch(/[^\r]\n/); // no bare LF
      const cal = new ICAL.Component(ICAL.parse(text));
      expect(cal.getFirstPropertyValue('version')).toBe('2.0');
      const ev = cal.getAllSubcomponents('vevent');
      expect(ev).toHaveLength(2);
      const first = new ICAL.Event(ev[0]!);
      expect(first.startDate.isDate).toBe(true); // all-day, no invented time zone
      expect(first.startDate.toString()).toBe('2027-05-31');
      expect(first.endDate.toString()).toBe('2027-06-01');
      expect(first.uid).toBe('deadline-x-bachelor-2027-05-31@edubridge');
      expect(first.summary).toContain('Universität, München; "Test"');
      expect(first.description).toContain('https://example.org/' + 'a'.repeat(120)); // survived folding
    }
    expect(buildIcs(items, 'ru')).toContain('Срок');
    expect(fold('x'.repeat(200)).split('\r\n')).toHaveLength(3);
    // multi-byte characters are never split
    expect(fold('ö'.repeat(80)).split('\r\n ').join('')).toBe('ö'.repeat(80));
  });
});

describe('calendar download and secret feed', () => {
  it('needs a session for /me/calendar.ics; the feed URL is secret, rotatable and revocable', async () => {
    const { c } = await newUser('feed');
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    await c.post('/me/events', { data: { title: 'Visa appointment', date: future } });

    expect((await new Client(h.app).get('/me/calendar.ics')).statusCode).toBe(401);
    const dl = await c.get('/me/calendar.ics');
    expect(dl.statusCode).toBe(200);
    expect(dl.headers['content-type']).toContain('text/calendar');
    expect(dl.headers['content-disposition']).toContain('attachment');
    expect(dl.body).toContain('Visa appointment');

    const t1 = (await c.post('/me/calendar/token')).json() as { token: string; url: string };
    expect(t1.url).toContain(`/api/v1/calendar/${t1.token}.ics`);
    const anon = new Client(h.app);
    const feed = await anon.get(`/calendar/${t1.token}.ics`);
    expect(feed.statusCode).toBe(200);
    expect(feed.body).toContain('Visa appointment');
    // only a hash is stored
    expect(JSON.stringify(await h.prisma.calendarFeed.findMany())).not.toContain(t1.token);

    const t2 = (await c.post('/me/calendar/token')).json() as { token: string };
    expect((await anon.get(`/calendar/${t1.token}.ics`)).statusCode).toBe(404);
    expect((await anon.get(`/calendar/${t2.token}.ics`)).statusCode).toBe(200);
    expect((await anon.get('/calendar/not-a-token.ics')).statusCode).toBe(404);
    expect((await c.del('/me/calendar/token')).statusCode).toBe(204);
    expect((await anon.get(`/calendar/${t2.token}.ics`)).statusCode).toBe(404);
  });

  it('one student never sees another student\'s dates', async () => {
    const a = await newUser('iso-a');
    const b = await newUser('iso-b');
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    await a.c.post('/me/events', { data: { title: 'A-private-appointment', date: future } });
    const tok = (await b.c.post('/me/calendar/token')).json().token;
    expect((await b.c.get('/me/calendar.ics')).body).not.toContain('A-private');
    expect((await new Client(h.app).get(`/calendar/${tok}.ics`)).body).not.toContain('A-private');
  });

  it('guests get 401 on every new /me route', async () => {
    const g = new Client(h.app);
    for (const [m, u] of [['GET', '/me/calendar'], ['POST', '/me/calendar/token'], ['DELETE', '/me/calendar/token'], ['GET', '/me/telegram'], ['POST', '/me/telegram/link-code'], ['PUT', '/me/telegram'], ['DELETE', '/me/telegram'], ['GET', '/me/reminders']] as const) {
      expect((await g.req(m, u, m === 'GET' ? undefined : {}, { csrf: false })).statusCode, `${m} ${u}`).toBe(401);
    }
  });
});

describe('Telegram link and bot commands (mocked Telegram)', () => {
  it('the webhook refuses calls without the secret, and is off when no secret is configured', async () => {
    const bad = await h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', payload: { message: { text: '/start', chat: { id: 1, type: 'private' } } } });
    expect(bad.statusCode).toBe(401);
    const wrong = await h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: { 'x-telegram-bot-api-secret-token': 'nope' }, payload: {} });
    expect(wrong.statusCode).toBe(401);
    const off = await harness({ TELEGRAM_WEBHOOK_SECRET: '' });
    expect((await off.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: HDR, payload: {} })).statusCode).toBe(503);
    await off.close();
  });

  it('links with a one-time code; the code works once and expires after 10 minutes', async () => {
    const { c, id } = await newUser('link');
    const n0 = tg.sent.length;
    const lc = (await c.post('/me/telegram/link-code')).json();
    expect(lc.code).toMatch(/^[A-Z2-9]{8}$/);
    expect(lc.deepLink).toContain(`?start=${lc.code}`);
    expect(JSON.stringify(await h.prisma.telegramLinkCode.findMany({ where: { userId: id } }))).not.toContain(lc.code);

    await say(5001, `/start ${lc.code}`);
    expect(tg.sent.length).toBe(n0 + 1);
    expect(last()).toMatchObject({ chatId: '5001' });
    expect((await c.get('/me/telegram')).json()).toMatchObject({ linked: true, optIn: true });

    await say(5002, `/start ${lc.code}`); // reuse
    expect(last().text).toMatch(/wrong or has expired/);
    expect((await h.prisma.telegramLink.findUnique({ where: { chatId: '5002' } }))).toBeNull();

    const old = (await c.post('/me/telegram/link-code')).json().code as string;
    await h.prisma.telegramLinkCode.updateMany({ where: { userId: id, usedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await say(5003, `/start ${old}`);
    expect(last().text).toMatch(/wrong or has expired/);
    await say(5003, '/start ZZZZZZZZ');
    expect(last().text).toMatch(/wrong or has expired/);
  });

  it('/start without a code explains how to connect and never asks for passwords or documents', async () => {
    await say(5100, '/start');
    expect(last().text).toMatch(/get a code in EduBridge/);
    expect(last().text).toMatch(/never ask for passwords, documents or payment details/);
    await say(5100, 'hello');
    expect(last().text).toMatch(/get a code/);
  });

  it('ignores group chats and malformed updates', async () => {
    const n = tg.sent.length;
    await say(5200, '/start', 'group');
    expect((await h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: HDR, payload: 'garbage' })).statusCode).toBeLessThan(500);
    expect((await h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: HDR, payload: { message: 5 } })).statusCode).toBe(200);
    expect(tg.sent.length).toBe(n);
  });

  it('/stop stops at once and cancels what was scheduled; /start brings it back (re-opt-in); /status and /language work', async () => {
    const { c, id } = await newUser('stop');
    await save(c, [UNI]);
    await linkChat(c, 5300);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(await h.prisma.reminder.count({ where: { userId: id, status: 'pending' } })).toBeGreaterThan(0);

    await say(5300, '/status');
    expect(last().text).toMatch(/Rejalashtirilgan eslatmalar/);

    await say(5300, '/language ru');
    expect((await h.prisma.user.findUnique({ where: { id } }))!.lang).toBe('ru');
    expect(last().text).toMatch(/русский/);
    await say(5300, '/language xx');
    expect(last().text).toMatch(/\/language uz \| ru \| en/);

    await say(5300, '/stop');
    expect(last().text).toMatch(/остановлены/); // answered in the account's language
    expect((await h.prisma.telegramLink.findUnique({ where: { userId: id } }))!.optIn).toBe(false);
    expect(await h.prisma.reminder.count({ where: { userId: id, status: 'pending' } })).toBe(0);
    await say(5300, '/status');
    expect(last().text).toMatch(/выключены/);

    // nothing is sent or scheduled while opted out
    const n = tg.sent.length;
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T05:00:00Z'));
    expect(tg.sent.length).toBe(n);
    expect(await h.prisma.reminder.count({ where: { userId: id, status: 'pending' } })).toBe(0);

    await say(5300, '/start');
    expect(last().text).toMatch(/снова включены/);
    expect((await h.prisma.telegramLink.findUnique({ where: { userId: id } }))!.optIn).toBe(true);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(await h.prisma.reminder.count({ where: { userId: id, status: 'pending' } })).toBeGreaterThan(0);
  });

  it('web opt-out and unlink also stop reminders; a chat belongs to one account', async () => {
    const a = await newUser('web-a');
    const b = await newUser('web-b');
    await save(a.c, [UNI]);
    await linkChat(a.c, 5400);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect((await a.c.put('/me/telegram', { optIn: false })).json().optIn).toBe(false);
    expect(await h.prisma.reminder.count({ where: { userId: a.id, status: 'pending' } })).toBe(0);
    expect((await new Client(h.app).req('PUT', '/me/telegram', { optIn: true }, { csrf: false })).statusCode).toBe(401);

    await linkChat(b.c, 5400); // same chat, other account
    expect(await h.prisma.telegramLink.findUnique({ where: { userId: a.id } })).toBeNull();
    expect((await b.c.get('/me/telegram')).json().linked).toBe(true);
    expect((await a.c.put('/me/telegram', { optIn: true })).statusCode).toBe(409);
    expect((await b.c.del('/me/telegram')).statusCode).toBe(204);
    expect((await b.c.get('/me/telegram')).json().linked).toBe(false);
  });

  it('link codes are refused when the bot is not configured', async () => {
    const x = await harness({ TELEGRAM_BOT_TOKEN: '', TELEGRAM_BOT_USERNAME: '' });
    const c = new Client(x.app);
    const id = await c.login(`rem-nobot-${Math.random().toString(36).slice(2, 6)}`);
    expect((await c.post('/me/telegram/link-code')).statusCode).toBe(503);
    expect((await c.get('/me/telegram')).json().botAvailable).toBe(false);
    await cleanupUsers(x.prisma, [id]);
    await x.close();
  });
});

describe('reminder engine', () => {
  it('quiet hours, due times and backoff', () => {
    expect(dueAtFor('2027-05-31', 7).toISOString()).toBe('2027-05-24T04:00:00.000Z'); // 09:00 Tashkent
    expect(inQuietHours(at('2027-05-24T17:00:00Z'), 22, 8)).toBe(true); // 22:00 local
    expect(inQuietHours(at('2027-05-24T21:00:00Z'), 22, 8)).toBe(true); // 02:00 local
    expect(inQuietHours(at('2027-05-24T03:00:00Z'), 22, 8)).toBe(false); // 08:00 local
    expect(inQuietHours(at('2027-05-24T05:00:00Z'), 22, 8)).toBe(false); // 10:00 local
    expect(inQuietHours(at('2027-05-24T05:00:00Z'), 9, 9)).toBe(false);
    expect([1, 2, 3, 10].map(backoffMs)).toEqual([300_000, 600_000, 1_200_000, 6 * 3_600_000]);
  });

  async function linked(name: string, chat: number) {
    const u = await newUser(name);
    await save(u.c, [UNI]);
    await linkChat(u.c, chat);
    return u;
  }

  it('plans 7-day and 1-day reminders once (idempotent), sends the 7-day one on time, in the user\'s language, once', async () => {
    const u = await linked('engine', 6001);
    const r1 = await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(r1.created).toBeGreaterThanOrEqual(2);
    const r2 = await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(r2.created).toBe(0);
    const mine = await h.prisma.reminder.findMany({ where: { userId: u.id }, orderBy: { dueAt: 'asc' } });
    expect(mine.map((r) => r.dueAt.toISOString().slice(0, 10))).toEqual(['2027-05-24', '2027-05-30']);

    const n = tg.sent.length;
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-23T05:00:00Z')); // too early
    expect(tg.sent.length).toBe(n);
    await h.prisma.user.update({ where: { id: u.id }, data: { lang: 'uz' } });
    const res = await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T05:00:00Z'));
    expect(res.sent).toBeGreaterThanOrEqual(1);
    const msg = tg.sent.slice(n).find((m) => m.chatId === '6001')!;
    expect(msg.text).toContain('Muddat');
    expect(msg.text).toContain(D_DATE);
    expect(msg.text).toContain('7 kundan keyin');
    expect(msg.text).toContain('/stop');
    // running again sends nothing more
    const again = tg.sent.length;
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T06:00:00Z'));
    expect(tg.sent.length).toBe(again);
    expect((await h.prisma.reminder.findMany({ where: { userId: u.id }, orderBy: { dueAt: 'asc' } })).map((r) => r.status)).toEqual(['sent', 'pending']);
  });

  it('holds reminders during quiet hours and sends them after', async () => {
    const u = await linked('quiet', 6002);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    const n = tg.sent.length;
    const night = await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T18:00:00Z')); // 23:00 Tashkent
    expect(night.sent).toBe(0);
    expect(night.deferredQuiet).toBeGreaterThan(0);
    expect(tg.sent.length).toBe(n);
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-25T04:00:00Z')); // 09:00 next day
    expect(tg.sent.slice(n).some((m) => m.chatId === '6002')).toBe(true);
    expect(u.id).toBeTruthy();
  });

  it('retries a failed send with backoff and gives up after 5 attempts', async () => {
    const u = await linked('retry', 6003);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    const t0 = at('2027-05-24T05:00:00Z');
    tg.failNext({ blocked: false, error: 'network' }, 1);
    // other due reminders from other users may also use the failure; target ours through ordering by sending until ours failed
    for (const x of await h.prisma.user.findMany({ where: { id: { in: users.filter((i) => i !== u.id) } }, select: { id: true } })) {
      await h.prisma.reminder.updateMany({ where: { userId: x.id, status: 'pending' }, data: { status: 'cancelled' } });
    }
    const first = await deliver(h.prisma, repo, tg, h.config, t0);
    expect(first.retried).toBe(1);
    const r = (await h.prisma.reminder.findFirst({ where: { userId: u.id, status: 'pending' }, orderBy: { dueAt: 'asc' } }))!;
    expect(r.attempts).toBe(1);
    expect(r.nextAttemptAt!.getTime()).toBe(t0.getTime() + 300_000);
    const early = tg.sent.length;
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T05:02:00Z')); // before the backoff ends
    expect(tg.sent.length).toBe(early);
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T05:06:00Z'));
    expect((await h.prisma.reminder.findUnique({ where: { id: r.id } }))!.status).toBe('sent');

    // permanent failure
    const v = await linked('giveup', 6004);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    await h.prisma.reminder.updateMany({ where: { userId: { not: v.id }, status: 'pending' }, data: { status: 'cancelled' } });
    tg.failNext({ blocked: false, error: 'network' }, 99);
    let now = at('2027-05-24T05:00:00Z').getTime();
    for (let i = 0; i < 5; i++) { await deliver(h.prisma, repo, tg, h.config, new Date(now)); now += 24 * 3_600_000; }
    tg.failNext({ blocked: false, error: 'x' }, 0);
    const failed = await h.prisma.reminder.findFirst({ where: { userId: v.id, status: 'failed' } });
    expect(failed?.attempts).toBe(5);
    expect(failed?.lastError).toBe('network');
  });

  it('a blocked bot turns reminders off for that student', async () => {
    const u = await linked('blocked', 6005);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    await h.prisma.reminder.updateMany({ where: { userId: { not: u.id }, status: 'pending' }, data: { status: 'cancelled' } });
    tg.failNext({ blocked: true, error: 'telegram_403' }, 1);
    await deliver(h.prisma, repo, tg, h.config, at('2027-05-24T05:00:00Z'));
    expect((await h.prisma.telegramLink.findUnique({ where: { userId: u.id } }))!.optIn).toBe(false);
    expect(await h.prisma.reminder.count({ where: { userId: u.id, status: 'pending' } })).toBe(0);
  });

  it('cancels reminders when the item goes away (unsaved) and never plans an already-stale "in 7 days"', async () => {
    const u = await linked('unsave', 6006);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(await h.prisma.reminder.count({ where: { userId: u.id, status: 'pending' } })).toBe(2);
    await save(u.c, []);
    const r = await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    expect(r.cancelled).toBeGreaterThanOrEqual(2);
    expect(await h.prisma.reminder.count({ where: { userId: u.id, status: 'pending' } })).toBe(0);

    await save(u.c, [UNI]);
    await materialise(h.prisma, repo, at('2027-05-29T05:00:00Z')); // 2 days left: only the 1-day reminder is still useful
    const pend = await h.prisma.reminder.findMany({ where: { userId: u.id, status: 'pending' } });
    expect(pend.map((p) => p.ref.split('|').pop())).toEqual(['1']);
  });

  it('a reminder whose date has passed is cancelled, not sent', async () => {
    const u = await linked('past', 6007);
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    await h.prisma.reminder.updateMany({ where: { userId: { not: u.id }, status: 'pending' }, data: { status: 'cancelled' } });
    const n = tg.sent.length;
    await deliver(h.prisma, repo, tg, h.config, at('2027-06-03T05:00:00Z'));
    expect(tg.sent.length).toBe(n);
    expect(await h.prisma.reminder.count({ where: { userId: u.id, status: 'pending' } })).toBe(0);
  });

  it('without a bot token the worker plans reminders but sends nothing and says so', async () => {
    const u = await linked('notoken', 6008);
    const unconfigured = { configured: false, send: async () => ({ ok: false as const, blocked: false, error: 'not_configured' }) };
    const rep = await runCycle({ prisma: h.prisma, repo, telegram: unconfigured, config: h.config }, at('2027-05-24T05:00:00Z'));
    expect(rep.sent).toBe(0);
    expect(rep.skipped).toMatch(/not configured/);
    expect(await h.prisma.reminder.count({ where: { userId: u.id, status: 'pending' } })).toBeGreaterThan(0);
  });

  it('/me/reminders lists what is scheduled for the signed-in student only', async () => {
    const u = await linked('mine', 6009);
    const other = await newUser('notmine');
    await materialise(h.prisma, repo, at('2027-05-01T00:00:00Z'));
    const mine = (await u.c.get('/me/reminders')).json().items;
    expect(mine.length).toBeGreaterThan(0);
    expect((await other.c.get('/me/reminders')).json().items).toEqual([]);
  });
});
