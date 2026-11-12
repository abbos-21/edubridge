# EduBridge

A guidance website for students from Uzbekistan who want to study abroad (UZ / RU / EN): universities and
scholarships, eligibility checks, application plans, calendar, documents, writing tutor, budget planner, AI advisor.

This project was rebuilt from the original single-file HTML artifact (`tools/decompile/source/EduBridge.original.html`).
The web app looks and behaves exactly like it; a backend adds accounts, shared data, AI, reminders and background jobs.
How the original works and how it maps to this project: [docs/ANALYSIS.md](docs/ANALYSIS.md).

```
apps/web          React 18 + Vite. The original app as readable source (JSX), wired to the API
apps/api          Fastify 5 + Prisma + PostgreSQL: accounts, state sync, catalogue, AI proxy, reminders, recheck
apps/api/scripts  import_catalog, worker (reminders + recheck), set_role
tools/decompile   rebuilds the readable source from the original HTML (kept for reference)
tools/fidelity    pixel comparison of the original HTML and the rebuilt app
infra, docker-*   nginx, backups, compose files for a server
```

## Run it locally
Needs Node 22 and Docker (for PostgreSQL).
```
npm install
cp .env.example .env            # edit SESSION_SECRET; AI_MOCK=true gives canned AI answers
npm run db:up                   # PostgreSQL on :5433
npm run db:migrate
npm run db:import               # loads the catalogue (once)
npm run dev:api                 # http://localhost:8787
npm run dev:web                 # http://localhost:5173 (proxies /api)
```
With `ALLOW_DEV_LOGIN=true` the sign-in page has a development login. To become staff:
`npm run role -w @edubridge/api -- telegram:dev:<name> admin` (see `scripts/set_role.ts`).

## Tests
```
npm test                        # API tests (needs the test database from docker compose)
npm run e2e                     # browser tests against the real API
npm run fidelity                # original HTML vs rebuilt app, screenshot by screenshot
```

## What the backend does
* **Accounts**: Telegram login widget, Google, sessions in HttpOnly cookies with CSRF protection.
* **State sync**: the student's state as versioned documents; the server copy wins on a conflict; the demo student is never stored.
* **Catalogue**: stored in the database, served publicly, edited only by staff (audit log, version bump, records can be hidden).
* **AI proxy**: Anthropic key on the server only; monthly budget, daily quota, burst limit; prompts are never stored.
* **Reminders**: Telegram bot (`/start`, `/stop`, `/status`, `/language`), quiet hours 22:00–08:00 Tashkent, `.ics` file and secret feed link.
* **Link recheck**: monthly, polite (robots.txt, per-host delay, refuses private addresses); it only reports, never edits.

Deployment on a server that already runs Nginx: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
