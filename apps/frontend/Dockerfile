# syntax=docker/dockerfile:1

# --- Stage 1: full deps (for the build) ---
FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN bun install --frozen-lockfile

# --- Stage 2: build the SSR bundle ---
FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY package.json bun.lock ./
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN bun run build

# --- Stage 3: production-only deps (slimmer runtime) ---
FROM oven/bun:1.3.14-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN bun install --frozen-lockfile --production

# --- Stage 4: runtime ---
FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV PORT=5173                               # match nginx upstream frontend:5173
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/frontend/build ./build
COPY apps/frontend/package.json ./package.json
USER bun
EXPOSE 5173
CMD ["bun", "run", "start"]                 # react-router-serve build/server/index.js
