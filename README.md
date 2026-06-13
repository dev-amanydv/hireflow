# AI Interviewer

An AI-driven interview platform. Candidates upload a resume and pick a target role
(e.g. *Backend Engineer*); the platform scrapes their public proof-of-work, runs a
real-time **voice** interview powered by an OpenAI realtime model, scores the
transcript, and gives back a video recording plus a detailed breakdown of mistakes and
areas to improve. Interviews can be made public and shared with recruiters, who can
search by role, watch interviews, and reach out to candidates.

## How it works (candidate flow)

1. **Upload resume + select role.** GitHub and LinkedIn URLs are extracted from the
   resume automatically.
2. **Scrape proof-of-work.** A [Crawlee](https://crawlee.dev/) scraper crawls the
   candidate's GitHub and LinkedIn to build context about their real work. This, plus
   the resume's skills and details, becomes context for the interviewer.
3. **Live voice interview.** The browser opens a **WebRTC** peer connection straight to
   OpenAI for low-latency audio. The model is prompted to conduct a role-specific
   interview informed by the scraped context.
4. **Scoring.** Once the interview ends, the full conversation stored in our DB is run
   through scoring to produce the candidate's result.
5. **Results.** The candidate receives the score, a video recording of the interview,
   and a detailed analysis of mistakes and scope for improvement. They can optionally
   make the interview **public**.

## Recruiter flow

Recruiters visit the site, search specific job roles, watch candidates' public
interviews, and connect with candidates they're interested in.

## Architecture - the "side-band" design

The hard part is doing real-time voice **without** trusting the client.

### Why not connect the browser straight to OpenAI for everything?

The simple approach (browser ⇄ OpenAI over WebRTC, backend only mints the token) is fast
and simple, but has two fatal problems:

- **The system prompt would have to live on the client** — trivially inspectable and
  manipulable by the candidate.
- **Our server is never part of the conversation**, so we can't reliably capture the
  transcript for scoring.

```
Architecture #1 (Bad)

  Browser ── get_token ──────────▶ Backend
  Browser ◀── ephemeral token ──── Backend
  Browser ── webrtc (audio) ─────▶ OpenAI server
                                   ▲
                                   └── (no path back to our server)

  Cons: system prompt must sit on the client; we can't get a full
        transcript because our server is never in the loop.
```

### The chosen design: voice on WebRTC, control on the side-band

We split the connection into two channels with different trust levels:

- **Browser ⇄ OpenAI (WebRTC):** carries **voice only**. Nothing sensitive crosses
  this link, so client-side tampering buys the candidate nothing.
- **Backend ⇄ OpenAI (server-to-server socket, OpenAI's "side-band"):** carries
  everything trusted — injecting the **system prompt**, persisting the **user/AI
  conversation** to the DB, and any other secure control. The candidate's browser never
  sees or touches it.

```
            ┌──────────── voice only (WebRTC) ───────────┐
            ▼                                             ▼
        Browser                                      OpenAI server
            │                                             ▲
            │ 1. get ephemeral token                      │ side-band socket:
            ▼                                             │  - system prompt
        Backend ───────────────────────────────────────┘   - save transcript
                  (server-to-server, trusted)               - secure control
```

**Flow:** the backend mints an **ephemeral token** for the browser → the browser uses it
to open the WebRTC voice link to OpenAI → in parallel, the backend holds the side-band
socket to OpenAI to inject the system prompt and stream the conversation into the DB.
After the interview, that saved transcript drives scoring.

## Tech stack

Turborepo monorepo managed with **Bun** workspaces (`apps/*`, `packages/*`).

| Area        | Stack                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Runtime/PM  | Bun `1.3.14`, Turborepo                                                |
| Backend     | Express 5, Zod, Prisma 7 → PostgreSQL 18                               |
| Frontend    | React 19, React Router 7 (framework/SSR mode), Tailwind v4, shadcn/Radix |
| Realtime    | WebRTC (browser ⇄ OpenAI), OpenAI realtime voice model, side-band socket |
| Scraping    | Crawlee (GitHub + LinkedIn)                                            |
| Infra       | Docker Compose: nginx, frontend, backend, postgres                    |

### Backend (`apps/backend`)

Express API under `/api/v1` (e.g. `POST /api/v1/pre-interview`). Bodies validated with
**Zod**, persistence via **Prisma 7** (client generated to `src/generated/prisma`).
Domain models: `User`, `Interview` (`SCHEDULED` / `ONGOING` / `COMPLETED`, holds
`githubMetadata` JSON), `Message` (User/Assistant transcript), and `Result` (score).

### Frontend (`apps/frontend`)

React Router 7 in framework mode (SSR). Routes are declared in `app/routes.ts` and
implemented in `app/routes/` — the flow is **form → interview → result**. API calls use
`axios` against `BACKEND_URL` from `app/lib/config.ts`.

### Shared packages (`packages/`)

`@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`.

## Getting started

Requires [Bun](https://bun.sh) `1.3.14`. Use `bun`/`bunx` — not npm/pnpm/yarn or `node`.

```sh
bun install
bun run dev          # turbo run dev — frontend + backend in parallel
```

Scope to a single app with a filter:

```sh
bunx turbo run dev --filter=frontend
```

### Backend dev server

`apps/backend` has no package scripts — run the Express entrypoint directly:

```sh
bun --hot src/index.ts          # dev server on :8000 with hot reload
```

Prisma commands must run through Bun so `.env` / `DATABASE_URL` is loaded:

```sh
bun --bun run prisma migrate dev
bun --bun run prisma generate
```

### Frontend scripts (`apps/frontend`)

```sh
bun run dev          # react-router dev
bun run build        # react-router build
bun run start        # serve the production build
bun run typecheck    # react-router typegen && tsc
```

## Common commands (repo root)

```sh
bun run dev          # turbo run dev
bun run build        # turbo run build
bun run lint         # turbo run lint
bun run check-types  # turbo run check-types
bun run format       # prettier --write on **/*.{ts,tsx,md}
```

Tests use `bun test` (none yet).

## Deployment

`compose.yml` runs four services behind nginx:

- **nginx** (port 80) — proxies `/` → `frontend:5173` and `/api/` → `backend:8000`
  (`nginx/nginx.conf`).
- **frontend**, **backend**, and a **postgres:18** `db`.

The backend healthcheck targets `/api/v1/health`.
