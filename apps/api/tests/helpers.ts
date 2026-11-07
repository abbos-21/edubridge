import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app';
import { loadConfig, type Config } from '../src/config';
import { createPrisma } from '../src/db';
import type { GoogleClient } from '../src/auth/google';
import type { Llm } from '../src/ai/llm';
import type { TelegramApi } from '../src/bot/telegram';

export const TEST_BOT_TOKEN = '123456:TEST-BOT-TOKEN';
export const APP_ORIGIN = 'http://localhost:5173';

export function testConfig(over: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: process.env.DATABASE_URL_TEST!,
    APP_ORIGIN,
    SESSION_SECRET: 'x'.repeat(40),
    ALLOW_DEV_LOGIN: 'true',
    TELEGRAM_BOT_TOKEN: TEST_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: 'edubridge_test_bot',
    RATE_LIMIT_PER_MIN: '1000000',
    AUTH_RATE_LIMIT_PER_MIN: '1000000',
    AI_DAILY_REQUESTS_PER_USER: '1000',
    AI_BURST_PER_MIN: '1000',
    ...over,
  });
}

export type Harness = { app: FastifyInstance; prisma: PrismaClient; config: Config; close: () => Promise<void> };

export async function harness(over: Record<string, string> = {}, google?: GoogleClient, llm?: Llm, telegram?: TelegramApi): Promise<Harness> {
  const config = testConfig(over);
  const prisma = createPrisma(process.env.DATABASE_URL_TEST!);
  const app = await buildApp({ config, prisma, google, llm, telegram });
  return { app, prisma, config, close: () => app.close() };
}

/** A browser-like client: keeps cookies and echoes the CSRF cookie in the header, as the web app does. */
export class Client {
  cookies = new Map<string, string>();
  constructor(public app: FastifyInstance, public origin: string | null = APP_ORIGIN) {}

  private cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async req(method: string, url: string, body?: unknown, extra: { csrf?: boolean | string; headers?: Record<string, string>; origin?: string | null } = {}) {
    const headers: Record<string, string> = { ...(extra.headers ?? {}) };
    const c = this.cookieHeader();
    if (c) headers.cookie = c;
    const origin = extra.origin === undefined ? this.origin : extra.origin;
    if (origin) headers.origin = origin;
    if (extra.csrf !== false) {
      const t = typeof extra.csrf === 'string' ? extra.csrf : this.cookies.get('eb_csrf');
      if (t) headers['x-csrf-token'] = t;
    }
    const res = await this.app.inject({ method: method as 'GET', url: `/api/v1${url}`, headers, payload: body === undefined ? undefined : (body as object) });
    for (const ck of res.cookies) {
      if (ck.value === '' || (ck.expires && ck.expires.getTime() < Date.now())) this.cookies.delete(ck.name);
      else this.cookies.set(ck.name, ck.value);
    }
    return res;
  }
  get = (u: string, e = {}) => this.req('GET', u, undefined, e);
  post = (u: string, b?: unknown, e = {}) => this.req('POST', u, b ?? {}, e);
  put = (u: string, b?: unknown, e = {}) => this.req('PUT', u, b ?? {}, e);
  patch = (u: string, b?: unknown, e = {}) => this.req('PATCH', u, b ?? {}, e);
  del = (u: string, b?: unknown, e = {}) => this.req('DELETE', u, b, e);

  async login(name = `t-${randomBytes(6).toString('hex')}`) {
    const r = await this.post('/auth/dev-login', { name });
    if (r.statusCode !== 200) throw new Error(`login failed: ${r.statusCode} ${r.body}`);
    return r.json().id as string;
  }
}

/** Removes users created by a test (cascade deletes all their private rows). */
export async function cleanupUsers(prisma: PrismaClient, ids: string[]) {
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
