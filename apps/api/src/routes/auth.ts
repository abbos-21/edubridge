import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Config } from '../config';
import { ApiError, badRequest } from '../errors';
import { randomToken, s256Challenge, safeEqual } from '../auth/crypto';
import { ReplayGuard, verifyTelegramLogin } from '../auth/telegram';
import type { GoogleClient } from '../auth/google';
import { clearSessionCookies, requireAuth, startSession } from '../auth/session';

type Provider = 'telegram' | 'google';
const OAUTH_COOKIE = 'eb_oauth';

export type AuthDeps = { config: Config; prisma: PrismaClient; google: GoogleClient; secret: string };

/** Finds the user behind an identity, or creates one. Nothing but the provider's stable id is stored. */
async function userForIdentity(prisma: PrismaClient, provider: Provider, providerUserId: string, lang = 'uz') {
  const existing = await prisma.authIdentity.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
    include: { user: true },
  });
  if (existing) return { user: existing.user, created: false };
  const user = await prisma.user.create({
    data: { lang, identities: { create: { provider, providerUserId } } },
  });
  return { user, created: true };
}

export function registerAuthRoutes(app: FastifyInstance, d: AuthDeps) {
  const { config, prisma, google, secret } = d;
  const replay = new ReplayGuard();
  const strict = { config: { rateLimit: { max: config.AUTH_RATE_LIMIT_PER_MIN, timeWindow: '1 minute' } } };

  app.get('/auth/providers', async () => ({
    telegram: config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_BOT_USERNAME ? { botUsername: config.TELEGRAM_BOT_USERNAME } : null,
    google: google.enabled,
    dev: config.ALLOW_DEV_LOGIN,
  }));

  // ---- Telegram Login Widget ------------------------------------------------------------
  const tgBody = z.record(z.string(), z.union([z.string(), z.number()]));

  async function telegramIdentity(body: unknown) {
    const parsed = tgBody.safeParse(body);
    if (!parsed.success) throw badRequest('Invalid Telegram payload');
    const r = verifyTelegramLogin(parsed.data, config.TELEGRAM_BOT_TOKEN);
    if (!r.ok) {
      const status = r.reason === 'not_configured' ? 503 : 401;
      throw new ApiError(status, `telegram_${r.reason}`, 'Telegram sign-in could not be verified');
    }
    if (!replay.use(`${r.id}:${parsed.data.auth_date}`)) throw new ApiError(401, 'telegram_replayed', 'This Telegram sign-in was already used');
    return r.id;
  }

  app.post('/auth/telegram', strict, async (req, reply) => {
    const id = await telegramIdentity(req.body);
    const { user } = await userForIdentity(prisma, 'telegram', id);
    await startSession(prisma, config, secret, req, reply, user.id);
    return { ok: true };
  });

  app.post('/auth/link/telegram', strict, async (req) => {
    const { user } = requireAuth(req);
    const id = await telegramIdentity(req.body);
    const other = await prisma.authIdentity.findUnique({ where: { provider_providerUserId: { provider: 'telegram', providerUserId: id } } });
    if (other && other.userId !== user.id) throw new ApiError(409, 'identity_taken', 'This Telegram account belongs to another EduBridge account');
    if (!other) await prisma.authIdentity.create({ data: { userId: user.id, provider: 'telegram', providerUserId: id } });
    return { ok: true };
  });

  // ---- Google (OIDC authorization code + PKCE) -----------------------------------------
  app.get('/auth/google/start', strict, async (req, reply) => {
    if (!google.enabled) throw new ApiError(503, 'google_not_configured', 'Google sign-in is not configured');
    const q = z.object({ link: z.enum(['1']).optional() }).parse(req.query);
    if (q.link && !req.auth) throw new ApiError(401, 'unauthenticated', 'Sign in to link an account');
    const state = randomToken(24);
    const verifier = randomToken(48);
    const nonce = randomToken(16);
    reply.setCookie(OAUTH_COOKIE, JSON.stringify({ state, verifier, nonce, link: q.link ? req.auth!.user.id : null }), {
      path: '/api/v1/auth/google',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      signed: true,
      maxAge: 600,
    });
    return reply.redirect(google.authUrl({ state, challenge: s256Challenge(verifier), nonce }));
  });

  app.get('/auth/google/callback', strict, async (req, reply) => {
    const raw = req.cookies[OAUTH_COOKIE];
    const unsigned = raw ? req.unsignCookie(raw) : null;
    reply.clearCookie(OAUTH_COOKIE, { path: '/api/v1/auth/google' });
    if (!unsigned?.valid || !unsigned.value) throw new ApiError(400, 'oauth_state_missing', 'Sign-in session expired. Try again.');
    const saved = JSON.parse(unsigned.value) as { state: string; verifier: string; nonce: string; link: string | null };
    const q = z.object({ code: z.string().min(1).max(2000), state: z.string().min(1).max(200) }).safeParse(req.query);
    if (!q.success || !safeEqual(q.data.state, saved.state)) throw new ApiError(400, 'oauth_state_mismatch', 'Sign-in could not be verified');

    let sub: string;
    try {
      const id = await google.exchange(q.data.code, saved.verifier);
      if (id.nonce !== saved.nonce) throw new Error('nonce mismatch');
      sub = id.sub;
    } catch {
      throw new ApiError(401, 'google_failed', 'Google sign-in could not be verified');
    }

    if (saved.link) {
      const other = await prisma.authIdentity.findUnique({ where: { provider_providerUserId: { provider: 'google', providerUserId: sub } } });
      if (other && other.userId !== saved.link) throw new ApiError(409, 'identity_taken', 'This Google account belongs to another EduBridge account');
      if (!other) await prisma.authIdentity.create({ data: { userId: saved.link, provider: 'google', providerUserId: sub } });
      return reply.redirect(`${config.APP_ORIGIN}/#settings`);
    }
    const { user } = await userForIdentity(prisma, 'google', sub);
    await startSession(prisma, config, secret, req, reply, user.id);
    return reply.redirect(`${config.APP_ORIGIN}/#settings`);
  });

  // ---- development only ------------------------------------------------------------------
  if (config.ALLOW_DEV_LOGIN) {
    app.post('/auth/dev-login', strict, async (req, reply) => {
      const b = z.object({ name: z.string().min(1).max(40).default('dev'), role: z.enum(['student', 'editor', 'admin']).optional() }).parse(req.body ?? {});
      const { user: found } = await userForIdentity(prisma, 'telegram', `dev:${b.name}`);
      // Test/dev convenience only (this route does not exist in production): sign in with a given role.
      const user = b.role && b.role !== found.role ? await prisma.user.update({ where: { id: found.id }, data: { role: b.role } }) : found;
      await startSession(prisma, config, secret, req, reply, user.id);
      return { ok: true, id: user.id };
    });
  }

  app.post('/auth/logout', async (req, reply) => {
    if (req.auth) await prisma.session.update({ where: { id: req.auth.sessionId }, data: { revokedAt: new Date() } });
    clearSessionCookies(reply, config);
    return reply.status(204).send();
  });

}
