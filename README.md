# EduBridge v2

Study-abroad navigator for students from Uzbekistan (UZ/RU/EN). Monorepo: `apps/api` (Fastify + Prisma + PostgreSQL), `packages/shared` (types, Zod schemas, data rules, search), `apps/web` and `apps/worker` (later phases). Spec: `docs/TZ_v2.txt`. Progress: `docs/PROGRESS.md`.

## Run (development)
```
cp .env.example .env
npm install
npm run db:up                 # Postgres 16 in Docker on :5433 (also creates edubridge_test)
npm run db:migrate            # apply migrations
npm run db:import             # load the recovered catalogue (50 universities, 7 + 6 grants)
npm run dev:api               # http://localhost:8787/api/v1/ready
npm run dev -w @edubridge/web # web app on http://localhost:5173 (proxies /api to :8787)
npm test                      # shared rules, API integration tests (need the DB), web unit tests
npm run e2e -w @edubridge/web # Playwright: every route at 390 px and 1280 px + user flows (starts the servers itself)
npm run build:single -w @edubridge/web   # one self-contained HTML file with the dated snapshot (claude.ai build)
npm run snapshot -w @edubridge/api       # regenerate apps/web/src/data/snapshot.json from the database
npm run typecheck
```

## Rules the code enforces (ToR Part C)
Every official fact needs a source; a missing value is never zero; IELTS is used for matching only when `ieltsScope` is `general`; no admission probabilities. See `packages/shared/src/rules.ts` and the tests.

## Data
`data/recovered/` holds the catalogue extracted from the old build (`extract_from_bundle.mjs`). Facts are exactly as recovered; fix them through the CMS (Phase 3), not by editing JSON.

## Web app notes
- Hash routes (`#country--MY`, `#uni--<id>`, `#unicompare--a,b,c`, `#scholarship--<id>`), Uzbek default, Russian/English switch.
- Add UI text as `tx('English', 'O‘zbekcha')`, then run `node apps/web/scripts/ru-gaps.mjs` and add the Russian to `apps/web/src/i18n/ru.extra.json`. The i18n test fails if any string has no Russian.
- The catalogue is fetched from the API; if it cannot be reached the bundled snapshot is used and a banner says so.

## Accounts (Phase 2a)
- Sign-in: Telegram Login Widget and Google (OIDC + PKCE). Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` in `.env`; without them only dev login is offered (`ALLOW_DEV_LOGIN=true`, development only).
- Production needs `SESSION_SECRET` (32+ chars) and refuses `ALLOW_DEV_LOGIN`.
- Writes from the browser need the CSRF header (`x-csrf-token` = the `eb_csrf` cookie); `apps/web/src/lib/api.ts` does this.

## AI advisor (Phase 2b)
- Set `ANTHROPIC_API_KEY` in `.env` (server only). Models: `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`), `ANTHROPIC_MODEL_QUICK` (`claude-haiku-5-5`), optional `ANTHROPIC_MODEL_COMPLEX`.
- Limits: `AI_MONTHLY_BUDGET_USD` (50), `AI_DAILY_REQUESTS_PER_USER` (20), `AI_BURST_PER_MIN` (6), `AI_TIMEOUT_MS`. Prices used for the cap are estimates (`AI_PRICES_JSON` overrides).
- No key? Use `AI_MOCK=true` in development for deterministic test replies (never allowed in production).
- Prompts live in `apps/api/src/ai/prompts.ts` (ported verbatim from the previous build); the honesty rules are tested.

## Profile and document readers (Phase 2c)
- `#onboarding` (wizard), `#adviser` (profile builder: check, 36 ideas, plan, AI coach), `#demo` (three fictional students). `?present=1` hides the demo banner.
- Files (.txt, .docx, text PDF) are read in the browser; scans and photos go to the AI only on request. The readers are bundled (`pdfjs-dist`, `mammoth`), not loaded from a CDN.
- `node data/recovered/extract_growth.mjs` regenerates the ideas/personas data and the test fixture of the original check/ranking code.
- Run the test suites one at a time (`npm test`, then `npm run e2e -w @edubridge/web`); running them together on one machine makes both fail.

## Admin (Phase 3a)
Roles are `student`, `editor`, `admin`. Make the first admin after signing in once:

```
npm run role -w @edubridge/api -- telegram:<your telegram id> admin
```

Admin API lives under `/api/v1/admin/*` (see `docs/openapi.yaml`). Changes need a sign-in younger than `ADMIN_REAUTH_MINUTES`. Editors draft and submit; only admins publish. In development `POST /auth/dev-login` accepts a `role` (it does not exist in production).

## Reminders, calendar, summary (Phase 4)
- Run the reminder worker next to the API: `npm run worker -w @edubridge/api`. Without `TELEGRAM_BOT_TOKEN` it plans reminders but sends none.
- Telegram bot: create it with BotFather, set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (16+ characters), then register `https://<your-domain>/api/v1/telegram/webhook` with Telegram's `setWebhook` and the same value as `secret_token`.
- Students: Settings → Reminders and calendar; `#summary` for the one-page A4 summary.

## Production (Phase 5)
See `docs/PRODUCTION.md` (deploy, backups, restore drill, updates, monitoring), `docs/SECURITY_REVIEW.md`, and `scripts/loadtest.mjs`.
