# Builds the web app and serves it with nginx; /api is forwarded to the API container.
FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm ci --workspace @edubridge/web --include-workspace-root && npm run build -w @edubridge/web

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY infra/nginx/web.conf /etc/nginx/conf.d/edubridge.conf
COPY infra/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=web /app/apps/web/dist /usr/share/nginx/html
