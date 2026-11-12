import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMockLlm } from '../src/ai/mock';
import { Client, cleanupUsers, harness, type Harness } from './helpers';

let h: Harness;
const ids: string[] = [];
beforeAll(async () => {
  h = await harness({ AI_DAILY_REQUESTS_PER_USER: '3' }, undefined, createMockLlm());
});
afterAll(async () => {
  await cleanupUsers(h.prisma, ids);
  await h.close();
});

describe('AI proxy', () => {
  it('needs sign-in, answers, and enforces the daily quota', async () => {
    expect((await new Client(h.app).post('/ai/text', { messages: [{ role: 'user', content: 'hi' }] })).statusCode).toBe(401);
    const c = new Client(h.app);
    ids.push(await c.login());
    for (let i = 0; i < 3; i++) {
      const r = await c.post('/ai/text', { messages: [{ role: 'user', content: `question ${i}` }], task: `t${i}` });
      expect(r.statusCode).toBe(200);
      expect(r.json().text).toContain('mock');
    }
    const over = await c.post('/ai/text', { messages: [{ role: 'user', content: 'again' }], task: 'more' });
    expect(over.statusCode).toBe(429);
    expect(over.json().error.code).toBe('quota_exceeded');
  });

  it('streams server-sent events', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const r = await c.post('/ai/text', { messages: [{ role: 'user', content: 'stream please' }], stream: true });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toContain('text/event-stream');
    expect(r.body).toContain('"done":true');
  });

  it('stores sizes and cost only, never the prompt', async () => {
    const rows = await h.prisma.aiUsage.findMany({ where: { userId: { in: ids } } });
    expect(rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(rows)).not.toContain('question 0');
  });

  it('reports status', async () => {
    const c = new Client(h.app);
    ids.push(await c.login());
    const s = (await c.get('/ai/status')).json();
    expect(s.enabled).toBe(true);
    expect(s.quota.dailyLimit).toBe(3);
  });
});
