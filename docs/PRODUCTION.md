# Running EduBridge in production

One server, one command. Everything below was run for real on a local copy of this exact stack (build, start, smoke test,
backup and restore drill, load test); what could not be tried without your domain, bot and storage is listed at the end.

## What runs
`docker-compose.prod.yml`: **postgres** (data volume, not reachable from outside), **migrate** (applies database migrations,
then exits), **api**, **worker** (reminders, Telegram sender, monthly link recheck), **caddy** (HTTPS, serves the web app, proxies `/api`),
**backup** (nightly encrypted dump). Only Caddy publishes ports (80, 443). The API is not reachable except through Caddy.

## First deployment
1. A server with Docker, a domain whose A/AAAA record points to it, ports 80 and 443 open.
2. `git clone` the project. `cp .env.production.example .env.production` and fill it in. Generate secrets with `openssl rand -hex 32`
   (SESSION_SECRET, POSTGRES_PASSWORD, BACKUP_PASSPHRASE, METRICS_TOKEN, TELEGRAM_WEBHOOK_SECRET). **Keep BACKUP_PASSPHRASE somewhere
   other than this server: without it the backups cannot be opened.**
3. `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`
4. Load the catalogue **once**:
   `docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api npx tsx scripts/import_catalog.ts`
   (The script refuses to run again on a database that already has universities, because it would wipe admin edits. `--force` overrides.)
5. Sign in once on the site, then make yourself admin:
   `docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api npx tsx scripts/set_role.ts telegram:<your telegram id> admin`
6. Check: `https://<domain>/api/v1/ready` answers `{"status":"ready"}`; the site loads; the response headers include `Strict-Transport-Security`
   and `Content-Security-Policy`.

The server refuses to start in production with `ALLOW_DEV_LOGIN` or `AI_MOCK` on, without a 32+ character `SESSION_SECRET`, or with a bot token
but no `TELEGRAM_WEBHOOK_SECRET`.

## Telegram bot
Create it with BotFather. Put `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` and `TELEGRAM_WEBHOOK_SECRET` in `.env.production`, restart
(`up -d`), then register the webhook once:
```
curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<domain>/api/v1/telegram/webhook" -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```
Also tell BotFather the login domain (`/setdomain`) for the sign-in widget. Google: add `https://<domain>/api/v1/auth/google/callback` as an authorised redirect URI.

## Backups and restore
- The `backup` service writes `edubridge-<time>.dump.enc` every night at 02:00 UTC (pg_dump, AES-256, key from BACKUP_PASSPHRASE, plus a `.sha256`),
  keeps 14 days on the server, and copies each one off the server when `BACKUP_S3_*` is set (any S3-compatible storage; give the bucket a 14-day lifecycle rule).
- **Restore drill** (do it after setup and after any change to backups): `docker compose -f docker-compose.prod.yml --env-file .env.production exec backup drill.sh`.
  It takes a real backup, checks that a wrong passphrase and a damaged file are refused, restores into a scratch database, compares row counts and a content
  fingerprint with the live database, and drops the scratch copy. It prints `DRILL PASSED`.
- **Disaster recovery:** new server, steps 1-3 above (stop `api`, `worker` before restoring), copy a backup file into the `backups` volume, then
  `docker compose ... exec backup restore.sh /backups/<file>.dump.enc edubridge --clean`, start everything, check `/api/v1/ready`. Do not run the catalogue import.
- Deleted accounts disappear from the database at once and from backups when those expire (14 days). The privacy page says exactly this.

## Updating
`git pull`, then `docker compose ... up -d --build`. Migrations run by themselves (`migrate` service) and only move forward, so **take a backup first**
(`exec backup backup.sh`). To roll back code, check out the previous version and `up -d --build`; a migration that already ran is not undone, so keep migrations additive.

## Watching it
- `GET /api/v1/metrics` (Prometheus text) needs `Authorization: Bearer $METRICS_TOKEN` and is blocked at the proxy, so scrape it from inside the Docker network
  (`api:8787`). It has request counts and latency per route, estimated AI spend against the budget, pending/failed reminders, open recheck findings, the time of the last
  successful recheck, users and the catalogue version.
- Suggested alerts: `/api/v1/ready` not 200 for 2 minutes; `edubridge_ai_cost_usd_month_estimate` above 80% of `edubridge_ai_budget_usd`; `edubridge_reminders_failed` growing;
  `edubridge_recheck_last_success_timestamp` older than 40 days; no new file in the backup location for 36 hours.
- Logs: `docker compose ... logs -f api worker`. They carry request ids and route metadata; never cookies, tokens, prompts or document text.

## Monthly link recheck
The worker queues a run every `RECHECK_INTERVAL_DAYS` (30) by itself; admins can also press *Run the recheck now* in `#admin`. Results appear under *Link recheck*.
Nothing is ever changed without an editor draft and an admin approval. Sites that refuse robots.txt or automation are listed under *Needs a manual check*.

## Not verified yet (needs your real accounts)
Public HTTPS certificates (needs your domain), the Telegram webhook and bot messages, Google sign-in, the off-server backup upload, real Anthropic calls,
and the first run of the recheck against the real university websites (their pages may change on every load, which shows up as many *changed* findings
at first; dismiss them in bulk and the next run starts from a clean baseline).
