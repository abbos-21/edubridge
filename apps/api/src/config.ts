import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(8787),
  HOST: z.string().default('0.0.0.0'),
  APP_ORIGIN: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().default(300),
  AUTH_RATE_LIMIT_PER_MIN: z.coerce.number().int().default(20),
  ENABLE_DOCS: bool.default(false),

  // --- sessions / auth (secrets stay on the server) ---
  SESSION_SECRET: z.string().default(''),
  SESSION_DAYS: z.coerce.number().int().default(30),
  COOKIE_SECURE: bool.optional(),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_BOT_USERNAME: z.string().default(''),
  /** Secret the Telegram webhook must present (X-Telegram-Bot-Api-Secret-Token). Without it the webhook is switched off. */
  TELEGRAM_WEBHOOK_SECRET: z.string().default(''),
  /** Reminders are never sent between these hours, Asia/Tashkent (default 22:00-08:00). */
  REMINDER_QUIET_START: z.coerce.number().int().min(0).max(23).default(22),
  REMINDER_QUIET_END: z.coerce.number().int().min(0).max(23).default(8),
  /** Monthly recheck of every source link (worker). */
  RECHECK_ENABLED: bool.default(true),
  RECHECK_INTERVAL_DAYS: z.coerce.number().int().min(1).default(30),
  /** Minimum pause between two requests to the same website. */
  RECHECK_HOST_DELAY_MS: z.coerce.number().int().min(0).default(2000),
  /** Bearer token for GET /api/v1/metrics. Unset = the endpoint does not exist. */
  METRICS_TOKEN: z.string().default(''),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default(''),
  // --- AI proxy (the key lives only here, never in the web app) ---
  ANTHROPIC_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  ANTHROPIC_MODEL_QUICK: z.string().default('claude-haiku-5-5'),
  /** Optional: a stronger model for the heavy analyses. Defaults to ANTHROPIC_MODEL. */
  ANTHROPIC_MODEL_COMPLEX: z.string().default(''),
  AI_ENABLED: bool.default(true),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().min(0).default(50),
  AI_DAILY_REQUESTS_PER_USER: z.coerce.number().int().min(0).default(20),
  AI_BURST_PER_MIN: z.coerce.number().int().min(1).default(6),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).default(90_000),
  /** JSON like {"claude-sonnet-5-5":[2,10]} = USD per million input/output tokens; overrides the built-in estimates. */
  AI_PRICES_JSON: z.string().default(''),
  /** Development/test only: answer with canned, valid replies instead of calling Anthropic. Refused in production. */
  AI_MOCK: bool.default(false),

  /** Admin changes need a sign-in at most this many minutes old (ToR H12). */
  ADMIN_REAUTH_MINUTES: z.coerce.number().int().min(1).default(120),

  /** Development only: lets you sign in without Telegram/Google. Refused in production. */
  ALLOW_DEV_LOGIN: bool.default(false),
});

export type Config = z.infer<typeof schema> & { cookieSecure: boolean };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    // Fail fast with names only; never print values (they may be secrets).
    const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid or missing environment variables: ${names}`);
  }
  const c = parsed.data;
  if (c.NODE_ENV === 'production') {
    if (c.ALLOW_DEV_LOGIN) throw new Error('ALLOW_DEV_LOGIN must not be enabled in production');
    if (c.AI_MOCK) throw new Error('AI_MOCK must not be enabled in production');
    if (c.TELEGRAM_BOT_TOKEN && c.TELEGRAM_WEBHOOK_SECRET.length < 16) throw new Error('TELEGRAM_WEBHOOK_SECRET (at least 16 characters) is required in production when the Telegram bot is configured');
    if (c.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET (at least 32 characters) is required in production');
  }
  return { ...c, cookieSecure: c.COOKIE_SECURE ?? c.NODE_ENV === 'production' };
}
