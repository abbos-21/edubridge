# Deploying EduBridge on a VPS that already runs Nginx and other projects

This setup does not touch ports 80/443, other containers or other sites. The stack publishes **one** port, `127.0.0.1:8080` (change it with
`WEB_PORT`), reachable only from the server itself. Your existing Nginx adds HTTPS for your domain and passes requests to it.

```
browser ──https──> host nginx (:443, certificate) ──> 127.0.0.1:8080 ──> "web" container (nginx: web app + /api forwarding) ──> api ──> postgres
                                                                                                                    worker, backup (internal only)
```
Tried for real on a local copy: build, start, first import, and a smoke test of headers, caching, deep links, blocked metrics and absent dev login.
(The stack with Caddy instead, `docker-compose.prod.yml`, is for a server where nothing else uses ports 80/443; ignore it here.)

## Before you start
- A domain (or subdomain) whose DNS A/AAAA record points at the VPS.
- Free resources: building needs about 2 GB of RAM and 4 GB of disk for the images; running uses about 500 MB. Check with `free -h` and `df -h`.
- Check that port 8080 is free: `ss -ltn | grep 8080`. If not, pick another and set `WEB_PORT`.
- Your Telegram bot and Google OAuth client are optional on day one; the site works without them (guests), but sign-in needs at least one.

## 1. Get the code and configure
```
git clone <your repo> /opt/edubridge && cd /opt/edubridge
cp .env.production.example .env.production
nano .env.production
```
Fill in at least: `APP_ORIGIN=https://example.org`, `POSTGRES_PASSWORD`, `SESSION_SECRET`, `BACKUP_PASSPHRASE`, `METRICS_TOKEN`
(generate each with `openssl rand -hex 32`). Remove the `SITE_ADDRESS` line (only the Caddy variant uses it). Add `WEB_PORT=8080` if you want to see it.
**Store BACKUP_PASSPHRASE somewhere that is not this server**: without it the backups cannot be opened.
`chmod 600 .env.production` (it holds secrets and is never committed).

## 2. Start the stack
```
docker compose -f docker-compose.nginx.yml --env-file .env.production up -d --build
docker compose -f docker-compose.nginx.yml --env-file .env.production ps        # api should say "healthy"
```
Load the catalogue **once**:
```
docker compose -f docker-compose.nginx.yml --env-file .env.production run --rm api npx tsx scripts/import_catalog.ts
```
(It refuses to run again on a database that already has universities, so it cannot wipe admin edits by accident.)
Check from the server: `curl -s http://127.0.0.1:8080/api/v1/ready` should print `{"status":"ready",...}`.

## 3. HTTPS with the server's Nginx
1. `sudo cp infra/nginx/host-site.conf.example /etc/nginx/sites-available/edubridge`, replace `example.org` with your domain, and change `8080` if you changed `WEB_PORT`.
2. Get a certificate. If you already use certbot: `sudo certbot certonly --nginx -d example.org` (do this before enabling the 443 block; if nginx refuses to start because the certificate files do not exist yet, comment out the 443 server block, run certbot, then restore it).
3. `sudo ln -s /etc/nginx/sites-available/edubridge /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx`
4. Open `https://example.org`. In the browser's developer tools (Network tab) the page response should carry `Strict-Transport-Security` and `Content-Security-Policy`.

Keep the `proxy_set_header X-Forwarded-For $remote_addr;` line exactly as given (it overwrites rather than appends). The app uses that address for rate limiting, so
a visitor must not be able to choose their own.

## 4. Make yourself admin
Sign in on the site once, then:
```
docker compose -f docker-compose.nginx.yml --env-file .env.production run --rm api npx tsx scripts/set_role.ts telegram:<your telegram id> admin
```
Then open `https://example.org/#admin`.

## 5. Telegram and Google (when you have them)
- **Telegram:** create the bot with BotFather; put `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (16+ characters) in `.env.production`; run `docker compose ... up -d`; then once:
  `curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://example.org/api/v1/telegram/webhook" -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"`
  and tell BotFather `/setdomain` = `example.org` (needed for the login button).
- **Google:** authorised redirect URI `https://example.org/api/v1/auth/google/callback`; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- **AI:** set `ANTHROPIC_API_KEY`. Without it the advisor says it is unavailable (it never fakes answers in production).

## 6. Backups (do the drill once)
```
docker compose -f docker-compose.nginx.yml --env-file .env.production exec backup drill.sh      # must end with DRILL PASSED
```
Backups run every night at 02:00 UTC into the `backups` volume and are kept 14 days. Set `BACKUP_S3_*` in `.env.production` to also copy them off the server
(any S3-compatible storage), and give the bucket a 14-day lifecycle rule. Restore and disaster-recovery steps: `docs/PRODUCTION.md`.

## Updating
```
cd /opt/edubridge && git pull
docker compose -f docker-compose.nginx.yml --env-file .env.production exec backup backup.sh      # backup first
docker compose -f docker-compose.nginx.yml --env-file .env.production up -d --build
```
Database migrations run by themselves and only move forward.

## Good neighbours on a shared server
- All containers, networks and volumes are prefixed `edubridge_`. Nothing else is touched. `docker compose -f docker-compose.nginx.yml ... down` stops this project only (add `-v` only if you really want to delete its data).
- Postgres, the API, the worker and the backup job are not published to the host at all.
- To limit resources, add `mem_limit` / `cpus` to a service in `docker-compose.nginx.yml`.
- Logs: `docker compose ... logs -f api worker web`.
- Metrics (internal): `docker compose ... exec api wget -qO- --header="Authorization: Bearer $METRICS_TOKEN" http://127.0.0.1:8787/api/v1/metrics`.

## Not verified
Your domain's certificate and Nginx host file (I cannot see your server), the Telegram webhook, Google sign-in, the real Anthropic API and the off-server backup upload.
