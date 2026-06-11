---
description: Backend (apps/backend) — Bun runtime, Express, Prisma/Postgres, Zod.
globs: "apps/backend/**/*.ts"
alwaysApply: false
---

This is the backend API. Bun is the runtime and package manager; the HTTP and DB
stack is deliberately Express + Prisma. Match the existing code — do not migrate to
`Bun.serve`, `bun:sqlite`, or `Bun.sql`.

## Stack

- **Bun** as runtime and package manager — see commands below.
- **Express 5** for the HTTP server (`src/index.ts`, routes under `/api/v1`).
- **Prisma 7** against **PostgreSQL** (`prisma/schema.prisma`); the generated client
  is emitted to `src/generated/prisma`.
- **Zod** for request-body validation.

## Bun usage

- `bun <file>` instead of `node <file>` or `ts-node <file>`.
- `bun install` / `bun run <script>` / `bunx` instead of the npm/yarn/pnpm/npx equivalents.
- Bun loads `.env` automatically — no `dotenv`.
- Prefer `Bun.file` over `node:fs` read/write, and `Bun.$` over `execa`.

## Commands

This package has no scripts; run the entrypoint directly:

```sh
bun --hot src/index.ts        # dev server on :8000 with hot reload
```

Prisma must run through Bun so `DATABASE_URL` from `.env` is loaded
(`prisma.config.ts` relies on this):

```sh
bun --bun run prisma migrate dev
bun --bun run prisma generate
```

## Testing

Use `bun test`.

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

For Bun API details, see `node_modules/bun-types/docs/**.mdx`.
