# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN bun install --frozen-lockfile
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" bunx --bun prisma generate
ENV NODE_ENV=production
ENV PORT=8000
RUN apk add --no-cache curl
USER bun
EXPOSE 8000
CMD ["bun", "run", "start"]
