# One image for the API and the worker (different command in docker-compose.prod.yml).
FROM node:22-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
# the catalogue files, only needed for the one-time first import (see docs/PRODUCTION.md)
COPY data/recovered ./data/recovered
RUN npm ci --workspace @edubridge/api --include-workspace-root && npx --workspace @edubridge/api prisma generate
ENV NODE_ENV=production
EXPOSE 8787
WORKDIR /app/apps/api
USER node
CMD ["npx", "tsx", "src/server.ts"]
