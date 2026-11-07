# Builds the web app, then serves it (and proxies /api) with Caddy.
FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm ci --workspace @edubridge/web --include-workspace-root && npm run build -w @edubridge/web

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=web /app/apps/web/dist /srv
