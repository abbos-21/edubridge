import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { Client, cleanupUsers, harness, testConfig, TEST_BOT_TOKEN, type Harness } from './helpers';
import { signTelegramPayload, verifyTelegramLogin } from '../src/auth/telegram';
import { loadConfig } from '../src/config';
import type { GoogleClient } from '../src/auth/google';
import { s256Challenge } from '../src/auth/crypto';

let h: Harness;
const users: string[] = [];
const now = () => Math.floor(Date.now() / 1000);
const tgId = () => 900_000_000 + Math.floor(Math.random() * 90_000_000);

beforeAll(async () => {
  h = await harness();
});
afterAll(async () => {
  await cleanupUsers(h.prisma, users);
  await h.close();
});

const signed = (over: Record<string, string | number> = {}) =>
  signTelegramPayload({ id: tgId(), first_name: 'Test', username: 'tester', auth_date: now(), ...over }, TEST_BOT_TOKEN);

describe('Telegram login verification (pure)', () => {
  it('accepts a correctly signed, fresh payload', () => {
    const p = signed({ id: 42 });
    expect(verifyTelegramLogin(p, TEST_BOT_TOKEN)).toEqual({ ok: true, id: '42' });
  });
  it('rejects a forged hash, a changed field and the wrong bot token', () => {
    const p = signed({ id: 42 });
    expect(verifyTelegramLogin({ ...p, hash: '0'.repeat(64) }, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'bad_hash' });
    expect(verifyTelegramLogin({ ...p, id: 43 }, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'bad_hash' });
    expect(verifyTelegramLogin(p, 'other:token')).toMatchObject({ ok: false, reason: 'bad_hash' });
  });
  it('rejects an expired payload (older than 10 minutes) and one from the future', () => {
    const old = signed({ auth_date: now() - 601 });
    expect(verifyTelegramLogin(old, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'expired' });
    const fresh = signed({ auth_date: now() - 590 });
    expect(verifyTelegramLogin(fresh, TEST_BOT_TOKEN).ok).toBe(true);
    const future = signed({ auth_date: now() + 3600 });
    expect(verifyTelegramLogin(future, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'expired' });
  });
  it('rejects malformed input and an unconfigured bot', () => {
    expect(verifyTelegramLogin({ id: 1, auth_date: now() }, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'malformed' });
    expect(verifyTelegramLogin({ id: '', auth_date: now(), hash: 'a'.repeat(64) }, TEST_BOT_TOKEN)).toMatchObject({ ok: false, reason: 'malformed' });
    expect(verifyTelegramLogin(signed(), '')).toMatchObject({ ok: false, reason: 'not_configured' });
  });
});

describe('POST /auth/telegram', () => {
  it('signs in with a valid payload, creates a user, and sets safe cookies', async () => {
    const c = new Client(h.app);
    const r = await c.post('/auth/telegram', signed());
    expect(r.statusCode).toBe(200);
    const session = r.cookies.find((x) => x.name === 'eb_session')!;
    expect(session.httpOnly).toBe(true);
    expect(String(session.sameSite).toLowerCase()).toBe('lax');
    expect(session.path).toBe('/');
    const csrf = r.cookies.find((x) => x.name === 'eb_csrf')!;
    expect(csrf.httpOnly).toBeFalsy();
    const me = await c.get('/me');
    expect(me.statusCode).toBe(200);
    users.push(me.json().id);
    expect(me.json().identities.map((i: any) => i.provider)).toEqual(['telegram']);
    // nothing but the provider's id is stored: no name, username or email
    const ident = await h.prisma.authIdentity.findFirstOrThrow({ where: { userId: me.json().id } });
    expect(ident.telegramUsername).toBeNull();
    const user = await h.prisma.user.findUniqueOrThrow({ where: { id: me.json().id } });
    expect(user.displayName).toBeNull();
  });
  it('the same Telegram account always maps to the same user', async () => {
    const id = tgId();
    const a = new Client(h.app);
    const b = new Client(h.app);
    await a.post('/auth/telegram', signed({ id }));
    await b.post('/auth/telegram', signed({ id, auth_date: now() + 1 }));
    const [ua, ub] = [(await a.get('/me')).json().id, (await b.get('/me')).json().id];
    expect(ua).toBe(ub);
    users.push(ua);
  });
  it('rejects forged, expired and replayed payloads without creating a session', async () => {
    const c = new Client(h.app);
    const p = signed();
    expect((await c.post('/auth/telegram', { ...p, hash: 'f'.repeat(64) })).statusCode).toBe(401);
    expect((await c.post('/auth/telegram', signed({ auth_date: now() - 700 }))).statusCode).toBe(401);
    expect((await c.post('/auth/telegram', { id: 1 })).statusCode).toBe(401);
    expect(c.cookies.size).toBe(0);
    expect((await c.post('/auth/telegram', p)).statusCode).toBe(200);
    users.push((await c.get('/me')).json().id);
    const replay = await new Client(h.app).post('/auth/telegram', p);
    expect(replay.statusCode).toBe(401);
    expect(replay.json().error.code).toBe('telegram_replayed');
  });
  it('answers 503 when the bot is not configured', async () => {
    const h2 = await harness({ TELEGRAM_BOT_TOKEN: '' });
    const r = await new Client(h2.app).post('/auth/telegram', signed());
    expect(r.statusCode).toBe(503);
    await h2.close();
  });
  it('/auth/providers tells the web app what is available', async () => {
    const r = await new Client(h.app).get('/auth/providers');
    expect(r.json()).toMatchObject({ telegram: { botUsername: 'edubridge_test_bot' }, google: false, dev: true });
  });
});

describe('GET /auth/session (start-up check)', () => {
  it('answers 200 with user:null for guests and with the user when signed in', async () => {
    const c = new Client(h.app);
    const guest = await c.get('/auth/session');
    expect(guest.statusCode).toBe(200);
    expect(guest.json()).toEqual({ user: null });
    expect(guest.headers['cache-control']).toBe('no-store');
    users.push(await c.login());
    expect((await c.get('/auth/session')).json().user.id).toBe(users[users.length - 1]);
  });
});

describe('sessions', () => {
  it('logout invalidates the session on the server (the old cookie stops working)', async () => {
    const c = new Client(h.app);
    users.push(await c.login());
    const stolen = new Map(c.cookies);
    expect((await c.post('/auth/logout')).statusCode).toBe(204);
    expect((await c.get('/me')).statusCode).toBe(401);
    const replay = new Client(h.app);
    replay.cookies = stolen;
    expect((await replay.get('/me')).statusCode).toBe(401);
  });
  it('an expired session is refused', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    users.push(id);
    await h.prisma.session.updateMany({ where: { userId: id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await c.get('/me')).statusCode).toBe(401);
  });
  it('lists sessions, and one can revoke another (but not someone else\'s)', async () => {
    const a1 = new Client(h.app);
    const id = await a1.login('multi-' + Math.random());
    users.push(id);
    const a2 = new Client(h.app);
    await a2.post('/auth/dev-login', { name: (await h.prisma.authIdentity.findFirstOrThrow({ where: { userId: id } })).providerUserId.replace('dev:', '') });
    const list = (await a1.get('/me/sessions')).json().items as Array<{ id: string; current: boolean }>;
    expect(list).toHaveLength(2);
    const other = list.find((s) => !s.current)!;
    expect((await a1.del(`/me/sessions/${other.id}`)).statusCode).toBe(204);
    expect((await a2.get('/me')).statusCode).toBe(401);
    const stranger = new Client(h.app);
    users.push(await stranger.login());
    expect((await stranger.del(`/me/sessions/${list.find((s) => s.current)!.id}`)).statusCode).toBe(404);
    expect((await a1.get('/me')).statusCode).toBe(200);
  });
  it('slides the expiry forward on use', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    users.push(id);
    await h.prisma.session.updateMany({ where: { userId: id }, data: { expiresAt: new Date(Date.now() + 3 * 86_400_000) } });
    await c.get('/me');
    const s = await h.prisma.session.findFirstOrThrow({ where: { userId: id } });
    expect(s.expiresAt.getTime() - Date.now()).toBeGreaterThan(20 * 86_400_000);
  });
  it('the session token is stored only as a hash', async () => {
    const c = new Client(h.app);
    const id = await c.login();
    users.push(id);
    const token = c.cookies.get('eb_session')!;
    const s = await h.prisma.session.findFirstOrThrow({ where: { userId: id } });
    expect(s.tokenHash).not.toBe(token);
    expect(s.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
  });
});

describe('CSRF protection', () => {
  it('rejects unsafe requests without the CSRF header, with a wrong one, or from another origin', async () => {
    const c = new Client(h.app);
    users.push(await c.login());
    expect((await c.patch('/me', { lang: 'en' }, { csrf: false })).statusCode).toBe(403);
    expect((await c.patch('/me', { lang: 'en' }, { csrf: 'wrong-token' })).statusCode).toBe(403);
    const evil = await c.patch('/me', { lang: 'en' }, { origin: 'https://evil.example' });
    expect(evil.statusCode).toBe(403);
    expect(evil.json().error.code).toBe('csrf_origin');
    expect((await c.patch('/me', { lang: 'en' })).statusCode).toBe(200);
  });
  it('GET requests need no CSRF header', async () => {
    const c = new Client(h.app);
    users.push(await c.login());
    expect((await c.get('/me')).statusCode).toBe(200);
  });
});

describe('Google sign-in (mocked provider)', () => {
  const fake = (sub: string): GoogleClient & { last?: { challenge: string; nonce: string } } => {
    const f: GoogleClient & { last?: { challenge: string; nonce: string } } = {
      enabled: true,
      authUrl: ({ state, challenge, nonce }) => {
        f.last = { challenge, nonce };
        return `https://accounts.example/auth?state=${state}&nonce=${nonce}`;
      },
      exchange: async (code, verifier) => {
        if (code !== 'good-code') throw new Error('bad code');
        // PKCE: the verifier must match the challenge sent at the start
        if (s256Challenge(verifier) !== f.last?.challenge) throw new Error('pkce mismatch');
        return { sub, nonce: f.last?.nonce };
      },
    };
    return f;
  };
  let hg: Harness;
  let g: ReturnType<typeof fake>;
  beforeAll(async () => {
    g = fake('g-' + Math.random());
    hg = await harness({}, g);
  });
  afterAll(async () => hg.close());

  const start = async (c: Client, link = false) => {
    const r = await c.get(`/auth/google/start${link ? '?link=1' : ''}`);
    const state = new URL(r.headers.location as string).searchParams.get('state')!;
    return { r, state };
  };

  it('start redirects to Google with state, nonce and an S256 PKCE challenge; callback signs in', async () => {
    const c = new Client(hg.app);
    const { r, state } = await start(c);
    expect(r.statusCode).toBe(302);
    expect(String(r.headers.location)).toContain('accounts.example');
    const cb = await c.get(`/auth/google/callback?code=good-code&state=${state}`);
    expect(cb.statusCode).toBe(302);
    expect(cb.headers.location).toBe('http://localhost:5173/#settings');
    const me = await c.get('/me');
    expect(me.statusCode).toBe(200);
    users.push(me.json().id);
    expect(me.json().identities[0].provider).toBe('google');
  });
  it('rejects a wrong state, a missing state cookie, a bad code and a reused callback', async () => {
    const c = new Client(hg.app);
    const { state } = await start(c);
    expect((await c.get(`/auth/google/callback?code=good-code&state=${state}x`)).statusCode).toBe(400);
    const c2 = new Client(hg.app);
    expect((await c2.get(`/auth/google/callback?code=good-code&state=${state}`)).statusCode).toBe(400);
    const c3 = new Client(hg.app);
    const s3 = await start(c3);
    expect((await c3.get(`/auth/google/callback?code=bad&state=${s3.state}`)).statusCode).toBe(401);
    const c4 = new Client(hg.app);
    const s4 = await start(c4);
    expect((await c4.get(`/auth/google/callback?code=good-code&state=${s4.state}`)).statusCode).toBe(302);
    users.push((await c4.get('/me')).json().id);
    expect((await c4.get(`/auth/google/callback?code=good-code&state=${s4.state}`)).statusCode).toBe(400);
  });
  it('rejects a tampered state cookie', async () => {
    const c = new Client(hg.app);
    const { state } = await start(c);
    c.cookies.set('eb_oauth', c.cookies.get('eb_oauth')!.replace(/.$/, 'X'));
    expect((await c.get(`/auth/google/callback?code=good-code&state=${state}`)).statusCode).toBe(400);
  });
  it('the Google email is never requested or stored (scope is openid only)', async () => {
    const real = (await import('../src/auth/google')).createGoogleClient({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's', GOOGLE_REDIRECT_URI: 'https://x/cb' });
    const u = new URL(real.authUrl({ state: 's', challenge: 'c', nonce: 'n' }));
    expect(u.searchParams.get('scope')).toBe('openid');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
  });
  it('start answers 503 when Google is not configured', async () => {
    expect((await new Client(h.app).get('/auth/google/start')).statusCode).toBe(503);
  });
});

describe('linking sign-in methods', () => {
  it('links Telegram to a Google account, refuses one that belongs to someone else, and keeps the last method', async () => {
    const owner = new Client(h.app);
    const ownerId = await owner.login();
    users.push(ownerId);
    const tg = tgId();
    expect((await owner.post('/auth/link/telegram', signed({ id: tg }))).statusCode).toBe(200);
    expect((await owner.get('/me')).json().identities).toHaveLength(2);

    const other = new Client(h.app);
    users.push(await other.login());
    const taken = await other.post('/auth/link/telegram', signed({ id: tg, auth_date: now() + 2 }));
    expect(taken.statusCode).toBe(409);
    expect(taken.json().error.code).toBe('identity_taken');

    // removing the only remaining method is refused
    const lone = new Client(h.app);
    users.push(await lone.login());
    expect((await lone.del('/me/identities/telegram')).statusCode).toBe(409);
    // but one of two can be removed
    expect((await owner.del('/me/identities/telegram')).statusCode).toBe(204);
  });
  it('linking requires a session', async () => {
    expect((await new Client(h.app).post('/auth/link/telegram', signed())).statusCode).toBe(401);
  });
});

describe('rate limiting', () => {
  it('auth endpoints are limited per IP and answer 429 with the standard error shape', async () => {
    const h2 = await harness({ AUTH_RATE_LIMIT_PER_MIN: '3' });
    const c = new Client(h2.app);
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await c.post('/auth/telegram', { id: 1 })).statusCode);
    expect(codes.slice(0, 3).every((x) => x === 401)).toBe(true);
    expect(codes.slice(3)).toEqual([429, 429]);
    const r = await c.post('/auth/telegram', { id: 1 });
    expect(r.json().error.code).toBe('rate_limited');
    await h2.close();
  });
});

describe('configuration safety', () => {
  it('production refuses dev login and a missing/short session secret', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'postgresql://x', SESSION_SECRET: 'y'.repeat(40) };
    expect(() => loadConfig({ ...base, ALLOW_DEV_LOGIN: 'true' })).toThrow(/ALLOW_DEV_LOGIN/);
    expect(() => loadConfig({ ...base, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
    expect(loadConfig(base).cookieSecure).toBe(true);
  });
  it('error messages never contain secret values', () => {
    try {
      loadConfig({ NODE_ENV: 'production', DATABASE_URL: '', SESSION_SECRET: 'super-secret-value-123' });
    } catch (e) {
      expect(String(e)).not.toContain('super-secret-value-123');
    }
  });
  it('dev login does not exist when disabled', async () => {
    const h2 = await harness({ ALLOW_DEV_LOGIN: 'false' });
    expect((await new Client(h2.app).post('/auth/dev-login', { name: 'x' })).statusCode).toBe(404);
    await h2.close();
  });
  it('cookies are Secure when cookieSecure is on', async () => {
    const h2 = await harness({ COOKIE_SECURE: 'true' });
    const r = await new Client(h2.app).post('/auth/dev-login', { name: 'sec-' + Math.random() });
    expect(r.cookies.find((c) => c.name === 'eb_session')!.secure).toBe(true);
    users.push(r.json().id);
    await h2.close();
  });
  it('testConfig is valid', () => {
    expect(testConfig().APP_ORIGIN).toBe('http://localhost:5173');
  });
});
