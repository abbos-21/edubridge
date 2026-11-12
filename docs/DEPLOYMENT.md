# Deploying EduBridge on a VPS that already runs Nginx

The stack publishes **one** local port (`127.0.0.1:${WEB_PORT}`, default 8080). Your Nginx adds HTTPS and forwards
to it. Other sites and ports are untouched.

```
browser -> host nginx (:443, certificate) -> 127.0.0.1:WEB_PORT -> "web" container (nginx: the app + /api) -> api -> postgres
                                                                                       worker, backup (internal only)
```

## 1. Configure
```
git clone <repo> /opt/edubridge && cd /opt/edubridge
cp .env.production.example .env.production && chmod 600 .env.production
```
Fill in `APP_ORIGIN=https://your.domain`, `POSTGRES_PASSWORD`, `SESSION_SECRET`, `BACKUP_PASSPHRASE`, `METRICS_TOKEN`
(generate each with `openssl rand -hex 32`). Store `BACKUP_PASSPHRASE` somewhere that is
not this server. `ALLOW_DEV_LOGIN` and `AI_MOCK` are refused in production.

## 2. Start
```
docker compose -f docker-compose.nginx.yml --env-file .env.production up -d --build
docker compose -f docker-compose.nginx.yml --env-file .env.production run --rm api npx tsx scripts/import_catalog.ts   # once
```
The import refuses to run again on a database that already has a catalogue, so it cannot wipe editors' changes.
Migrations run by themselves when the API starts and only move forward.

## 3. HTTPS
Copy `infra/nginx/host-site.conf.example` to `/etc/nginx/sites-available/edubridge`, set the domain and port, get a
certificate with certbot, enable the site and reload Nginx. Keep `proxy_set_header X-Forwarded-For $remote_addr;`
exactly as given: the API uses it for rate limiting.

## 4. Staff and integrations
* Sign in once, then: `docker compose ... run --rm api npx tsx scripts/set_role.ts telegram:<your telegram id> admin`.
* **Telegram**: BotFather bot; set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (16+ chars),
  restart, then register the webhook once:
  `curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://your.domain/api/v1/telegram/webhook" -d "secret_token=<SECRET>"`
  and send BotFather `/setdomain` = your domain (for the login widget).
* **Google**: redirect URI `https://your.domain/api/v1/auth/google/callback`; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
* **AI**: set `ANTHROPIC_API_KEY`. Without it live AI is simply unavailable. Lower `AI_MONTHLY_BUDGET_USD` while testing.

## 5. Backups and updates
Encrypted backups run nightly (14 days kept). Test the restore path once: `docker compose ... exec backup drill.sh`
must end with `DRILL PASSED`. Set `BACKUP_S3_*` to also copy them off the server.
```
cd /opt/edubridge && git pull
docker compose -f docker-compose.nginx.yml --env-file .env.production exec backup backup.sh
docker compose -f docker-compose.nginx.yml --env-file .env.production up -d --build
```
