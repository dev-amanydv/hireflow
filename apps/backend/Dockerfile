# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN bun install --frozen-lockfile
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
RUN bunx --bun prisma generate
ENV NODE_ENV=production
RUN apk add --no-cache curl
USER bun
EXPOSE 8080
CMD ["bun", "run", "start"]
