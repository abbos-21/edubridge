import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PrismaClient, User } from '@prisma/client';
import type { Config } from '../config';
import { randomToken, safeEqual, sha256hex } from './crypto';
import { ApiError } from '../errors';

export const SESSION_COOKIE = 'eb_session';
export const CSRF_COOKIE = 'eb_csrf';
export const CSRF_HEADER = 'x-csrf-token';
const DAY = 86_400_000;

export type AuthContext = { user: User; sessionId: string; /** when this session was created by a sign-in */ signedInAt: Date };

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

export function hashIp(ip: string | undefined, secret: string): string | null {
  return ip ? sha256hex(`${secret}|${ip}`).slice(0, 32) : null;
}

/** Creates a server-side session and sets the cookies. Only a hash of the token is stored. */
export async function startSession(
  prisma: PrismaClient,
  config: Config,
  secret: string,
  req: FastifyRequest,
  reply: FastifyReply,
  userId: string,
): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + config.SESSION_DAYS * DAY);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256hex(token),
      userAgent: (req.headers['user-agent'] ?? '').slice(0, 200) || null,
      ipHash: hashIp(req.ip, secret),
      expiresAt,
    },
  });
  setSessionCookies(reply, config, token, expiresAt);
}

export function setSessionCookies(reply: FastifyReply, config: Config, token: string, expiresAt: Date) {
  const base = { path: '/', sameSite: 'lax' as const, secure: config.cookieSecure, expires: expiresAt };
  reply.setCookie(SESSION_COOKIE, token, { ...base, httpOnly: true });
  // Readable by the page so it can echo the value in a header (double-submit CSRF token).
  reply.setCookie(CSRF_COOKIE, randomToken(24), { ...base, httpOnly: false });
}

export function clearSessionCookies(reply: FastifyReply, config: Config) {
  const base = { path: '/', sameSite: 'lax' as const, secure: config.cookieSecure };
  reply.clearCookie(SESSION_COOKIE, base);
  reply.clearCookie(CSRF_COOKIE, base);
}

/** Resolves the session cookie to a user (and slides the expiry at most once a day). */
export async function resolveSession(prisma: PrismaClient, config: Config, req: FastifyRequest): Promise<AuthContext | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token || token.length > 200) return null;
  const s = await prisma.session.findUnique({ where: { tokenHash: sha256hex(token) }, include: { user: true } });
  if (!s || s.revokedAt || s.expiresAt.getTime() < Date.now()) return null;
  const wanted = Date.now() + config.SESSION_DAYS * DAY;
  if (wanted - s.expiresAt.getTime() > DAY) {
    await prisma.session.update({ where: { id: s.id }, data: { expiresAt: new Date(wanted) } });
  }
  return { user: s.user, sessionId: s.id, signedInAt: s.createdAt };
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** CSRF: for cookie-authenticated unsafe requests require a matching header + an allowed Origin. */
export function checkCsrf(req: FastifyRequest, config: Config) {
  if (!req.auth || !UNSAFE.has(req.method)) return;
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin !== config.APP_ORIGIN) throw new ApiError(403, 'csrf_origin', 'Request origin is not allowed');
  const cookie = req.cookies[CSRF_COOKIE];
  const header = req.headers[CSRF_HEADER];
  if (!cookie || typeof header !== 'string' || !safeEqual(cookie, header)) {
    throw new ApiError(403, 'csrf_token', 'Missing or invalid CSRF token');
  }
}

export function requireAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
  return req.auth;
}
