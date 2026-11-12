import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMockTelegram } from '../src/bot/telegram';
import { dueInstant, inQuietHours, runDueReminders } from '../src/reminders/engine';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

const SECRET = 'webhook-secret-123456';
const telegram = createMockTelegram();
let h: Harness;
const ids: string[] = [];
beforeAll(async () => {
  h = await harness({ TELEGRAM_WEBHOOK_SECRET: SECRET }, undefined, undefined, telegram);
});
afterAll(async () => {
  await cleanupUsers(h.prisma, ids);
  await h.close();
});

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const hook = (text: string, chat = 555, secret: string | null = SECRET) =>
  h.app.inject({ method: 'POST', url: '/api/v1/telegram/webhook', headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {}, payload: { message: { text, chat: { id: chat } } } });

describe('reminders and the calendar feed', () => {
  it('links a chat with a one-time code, schedules reminders only for dates worth reminding, and sends them', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    ids.push(id);
    const verified = inDays(10);
    await c.put('/me/state/calendar', {
      data: {
        events: [
          { id: 'dl-a', date: verified, title: { en: 'Deadline A', uz: 'Muddat A' }, trust: 'verified' },
          { id: 'dl-b', date: verified, title: { en: 'Not verified', uz: 'Tasdiqlanmagan' }, trust: 'unverified' },
          { id: 'dl-c', date: verified, title: { en: 'Done task', uz: 'Bajarilgan' }, trust: 'suggested', done: true },
        ],
        reminderDays: [7, 1],
      },
    });
    expect(await h.prisma.reminder.count({ where: { userId: id } })).toBe(0); // not linked yet

    const code = (await c.post('/me/telegram/link-code')).json().code as string;
    expect((await hook('/start wrong-code')).statusCode).toBe(200);
    expect(await h.prisma.telegramLink.count({ where: { userId: id } })).toBe(0);
    await hook(`/start ${code}`);
    expect(await h.prisma.telegramLink.count({ where: { userId: id } })).toBe(1);

    const rows = await h.prisma.reminder.findMany({ where: { userId: id }, orderBy: { dueAt: 'asc' } });
    expect(rows.map((r) => r.ref)).toEqual(['dl-a', 'dl-a']); // two reminders, only for the verified, unfinished date
    expect(rows[0]!.dueAt.getTime()).toBe(dueInstant(verified, 7).getTime());

    // not due yet: nothing is sent
    const before = telegram.sent.length;
    expect((await runDueReminders(h.prisma, h.config, telegram, new Date(rows[0]!.dueAt.getTime() - 3_600_000))).sent).toBe(0);
    // due: sent once, in the student's language
    const stats = await runDueReminders(h.prisma, h.config, telegram, new Date(rows[0]!.dueAt.getTime() + 60_000));
    expect(stats.sent).toBe(1);
    expect(telegram.sent.length).toBe(before + 1);
    expect(telegram.sent.at(-1)!.text).toContain('Muddat A');
    expect(await h.prisma.reminder.count({ where: { userId: id, status: 'sent' } })).toBe(1);
  });

  it('never sends during quiet hours, and the webhook does not exist without its secret', async () => {
    expect(inQuietHours(new Date('2026-11-12T19:00:00Z'), h.config)).toBe(true); // 00:00 Tashkent
    expect(inQuietHours(new Date('2026-11-12T05:00:00Z'), h.config)).toBe(false); // 10:00 Tashkent
    expect((await hook('/status', 555, null)).statusCode).toBe(404);
    expect((await hook('/status', 555, 'wrong-secret-wrong-secret')).statusCode).toBe(404);
  });

  it('builds a calendar file without unverified or finished dates, and a revocable secret link', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const date = inDays(5);
    await c.put('/me/state/calendar', {
      data: { events: [{ id: 'x1', date, title: { en: 'Open date', uz: 'Ochiq sana' }, trust: 'verified' }, { id: 'x2', date, title: { en: 'Guess', uz: 'Taxmin' }, trust: 'unverified' }] },
    });
    const ics = await c.get('/me/calendar.ics');
    expect(ics.statusCode).toBe(200);
    expect(ics.body).toContain('BEGIN:VCALENDAR');
    expect(ics.body).toContain(`DTSTART;VALUE=DATE:${date.replace(/-/g, '')}`);
    expect(ics.body).toContain('Ochiq sana');
    expect(ics.body).not.toContain('Taxmin');

    const url = (await c.post('/me/calendar/token')).json().url as string;
    const path = new URL(url).pathname.replace('/api/v1', '');
    const anon = new Client(h.app);
    expect((await anon.get(path)).statusCode).toBe(200); // a calendar app has no session: the secret link alone works
    await c.del('/me/calendar/token');
    expect((await anon.get(path)).statusCode).toBe(404);
  });
});
