# Deploying the backend to Google Cloud Run (free tier)

The backend (`apps/backend`) is optimized for **fast cold starts** on Cloud Run
scale-to-zero. Cloud Run marks the container ready the moment it binds `$PORT`; the app
binds `$PORT` first and defers all BullMQ workers + Redis I/O to *after* `app.listen`.

## Prerequisites

- Managed, serverless-reachable Postgres and Redis (Cloud Run has no sidecar services).
  This project already targets **Neon Postgres** + **Redis Cloud** (see `compose.prod.yml`).
- `gcloud` CLI authenticated: `gcloud auth login && gcloud config set project <PROJECT_ID>`.
- Secrets stored in Secret Manager (recommended) or passed via `--set-env-vars`.

## Deploy (source-based build)

```sh
gcloud run deploy interview-backend \
  --source apps/backend \
  --region <REGION> \
  --cpu=1 \
  --memory=512Mi \            # more memory => more CPU during boot (~40% faster start)
  --cpu-boost \              # startup CPU boost (up to ~30% faster Node/Bun start)
  --min-instances=0 \        # strictly free: scale to zero, accept (fast) cold starts
  --max-instances=2 \        # cap scaling on free tier
  --concurrency=80 \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,CORS_ORIGIN=https://<frontend-domain> \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,AZURE_OPENAI_ENDPOINT=AZURE_OPENAI_ENDPOINT:latest,AZURE_SECRET_KEY=AZURE_SECRET_KEY:latest,GITHUB_PAT=GITHUB_PAT:latest
  # add the S3 / R2 credentials (bucket, access key, secret, endpoint) the same way
```

> Building from a prebuilt image instead? Replace `--source apps/backend` with
> `--image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPO>/interview-backend:<tag>` after
> `docker build -f apps/backend/Dockerfile -t ... . && docker push ...` from the repo root.

## Notes / knobs

- **Do not** pass `--no-cpu-throttling` on the free tier — it enables always-allocated CPU
  (billed) and is not free. Default request-based billing throttles CPU between requests.
- **Caveat on in-process workers:** with `min-instances=0` + throttled CPU, the BullMQ
  workers only make progress while the instance is briefly alive around a request.
  Background jobs (jobs-ingest cron, resume parsing, interview feedback) process
  opportunistically, not reliably. For reliable background processing, run the workers on
  the always-on Oracle A1 VM (`compose.prod.yml`) instead.
- **Eliminate cold starts later (not free):** `--min-instances=1` keeps one instance warm
  (billed for idle time).
- The app reads `PORT`; Cloud Run's default is `8080`. `--port=8080` is explicit for clarity.

## Optional: HTTP startup probe

By default Cloud Run uses a TCP startup probe (port open = ready). To gate readiness on the
app actually responding, apply a service YAML with an HTTP startup probe on
`/api/v1/health` (short `periodSeconds`, small `failureThreshold`) via
`gcloud run services replace service.cloudrun.yaml`. See `service.cloudrun.yaml`.
