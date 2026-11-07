import { randomBytes, randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import type { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import type { Config } from './config';
import { ApiError } from './errors';
import { CatalogRepo } from './lib/catalogRepo';
import { registerCatalogRoutes } from './routes/catalog';
import { registerAuthRoutes } from './routes/auth';
import { registerMeRoutes } from './routes/me';
import { registerUserDataRoutes } from './routes/userdata';
import { registerTransferRoutes } from './routes/transfer';
import { checkCsrf, resolveSession } from './auth/session';
import { createGoogleClient, type GoogleClient } from './auth/google';
import { createAnthropicLlm, type Llm } from './ai/llm';
import { createMockLlm } from './ai/mock';
import { AiGuard } from './ai/guard';
import { registerAiRoutes } from './routes/ai';
import { registerAdminRoutes, type AdminRouteInfo } from './routes/admin';
import { registerDemoRoutes } from './routes/demo';
import { Metrics, registerMetricsRoute } from './routes/metrics';
import { registerReminderRoutes } from './routes/reminders';
import { createTelegramApi, type TelegramApi } from './bot/telegram';

export type AppDeps = { config: Config; prisma: PrismaClient; google?: GoogleClient; llm?: Llm; telegram?: TelegramApi };

declare module 'fastify' {
  interface FastifyInstance {
    /** every admin route with the roles allowed to call it (used by the access tests) */
    adminRoutes: AdminRouteInfo[];
  }
}

export async function buildApp({ config, prisma, google, llm, telegram }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.LOG_LEVEL,
            // Never log cookies, auth headers or request bodies (documents/prompts are private).
            redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
          },
    genReqId: (req) => (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id'].length <= 64 ? req.headers['x-request-id'] : randomUUID()),
    bodyLimit: 1_000_000,
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } } });
  await app.register(cors, {
    origin: [config.APP_ORIGIN],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  // Cookie signing secret. Production requires SESSION_SECRET (see config); dev/test fall back to a per-process secret.
  const secret = config.SESSION_SECRET || randomBytes(32).toString('hex');
  await app.register(cookie, { secret });
  app.decorateRequest('auth', null);
  app.addHook('onRequest', async (req) => {
    req.auth = null;
    if (req.cookies?.eb_session) req.auth = await resolveSession(prisma, config, req);
    checkCsrf(req, config);
  });
  await app.register(rateLimit, { max: config.RATE_LIMIT_PER_MIN, timeWindow: '1 minute' });

  const metrics = new Metrics();
  app.addHook('onResponse', async (req, reply) => {
    metrics.observe(req.method, req.routeOptions?.url ?? 'unmatched', reply.statusCode, reply.elapsedTime / 1000);
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  app.setErrorHandler((err: unknown, req, reply) => {
    const requestId = req.id;
    if (err instanceof ApiError) {
      if (err.headers) reply.headers(err.headers);
      return reply.status(err.statusCode).send({ error: { code: err.code, message: err.message, details: err.details, requestId } });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: { code: 'validation_error', message: 'Invalid input', details: err.flatten(), requestId } });
    }
    const e = err as { statusCode?: number; code?: string; message?: string };
    const status = e.statusCode;
    if (status && status >= 400 && status < 500) {
      const code = status === 429 ? 'rate_limited' : e.code?.toLowerCase() ?? 'bad_request';
      return reply.status(status).send({ error: { code, message: e.message ?? 'Bad request', requestId } });
    }
    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send({ error: { code: 'internal_error', message: 'Something went wrong', requestId } });
  });

  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ error: { code: 'not_found', message: 'Route not found', requestId: req.id } }),
  );

  const repo = new CatalogRepo(prisma);
  const adminRoutes: AdminRouteInfo[] = [];

  await app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok' }));
      api.get('/ready', async (_req, reply) => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          const version = await repo.version();
          if (version < 1) return reply.status(503).send({ status: 'not_ready', reason: 'catalogue not imported' });
          return { status: 'ready', catalogueVersion: version };
        } catch {
          return reply.status(503).send({ status: 'not_ready', reason: 'database unavailable' });
        }
      });
      registerCatalogRoutes(api, repo);
      registerAuthRoutes(api, { config, prisma, google: google ?? createGoogleClient(config), secret });
      registerMeRoutes(api, { config, prisma });
      registerUserDataRoutes(api, { prisma });
      registerTransferRoutes(api, { prisma });
      const model = llm ?? (config.AI_MOCK ? createMockLlm() : createAnthropicLlm(config));
      registerMetricsRoute(api, { config, prisma, metrics });
      registerDemoRoutes(api, prisma);
      registerReminderRoutes(api, { config, prisma, repo, telegram: telegram ?? createTelegramApi(config) });
      adminRoutes.push(...registerAdminRoutes(api, { config, prisma, repo, secret }));
      registerAiRoutes(api, { prisma, repo, guard: new AiGuard(config, prisma, model), timeoutMs: config.AI_TIMEOUT_MS });
    },
    { prefix: '/api/v1' },
  );

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.decorate('adminRoutes', adminRoutes);
  return app;
}
