import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, harness, type Harness } from './helpers';

let h: Harness;
beforeAll(async () => { h = await harness({ METRICS_TOKEN: 'm'.repeat(24) }); });
afterAll(async () => { await h.close(); });

describe('GET /metrics', () => {
  it('is hidden without the token and shows counts, latency and AI cost with it', async () => {
    const c = new Client(h.app);
    await c.get('/health');
    await c.get('/catalog/version');
    await c.get('/nope-' + Math.random());
    expect((await c.get('/metrics')).statusCode).toBe(404);
    expect((await c.get('/metrics', { headers: { authorization: 'Bearer wrong' } })).statusCode).toBe(404);
    const ok = await c.get('/metrics', { headers: { authorization: 'Bearer ' + 'm'.repeat(24) } });
    expect(ok.statusCode).toBe(200);
    expect(ok.headers['content-type']).toContain('text/plain');
    expect(ok.body).toMatch(/edubridge_http_requests_total\{method="GET",route="\/api\/v1\/health",status="200"\} \d+/);
    expect(ok.body).toContain('edubridge_http_request_duration_seconds_bucket');
    expect(ok.body).toContain('edubridge_ai_cost_usd_month_estimate');
    expect(ok.body).toContain('edubridge_reminders_pending');
    // raw URLs (which could carry ids or tokens) never become labels
    expect(ok.body).not.toMatch(/nope-/);
  });
  it('does not exist when no token is configured', async () => {
    const x = await harness({ METRICS_TOKEN: '' });
    expect((await new Client(x.app).get('/metrics', { headers: { authorization: 'Bearer ' } })).statusCode).toBe(404);
    await x.close();
  });
});
