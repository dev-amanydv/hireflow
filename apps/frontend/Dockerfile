# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY package.json bun.lock ./
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN bun run build

FROM oven/bun:1.3.14 AS prod-deps
WORKDIR /app
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/apps/frontend/package.json ./package.json
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV PORT=5173
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/frontend/build ./build
COPY apps/frontend/package.json ./package.json
USER bun
EXPOSE 5173
CMD ["bun", "run", "start"]


