# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY package.json bun.lock ./
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN bun --bun run prisma generate

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app/apps/backend
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend /app/apps/backend
USER bun
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:8000/api/v1/health || exit 1
CMD ["bun", "src/index.ts"]

