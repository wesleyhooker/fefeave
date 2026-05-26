# Phase 2: Fastify backend on AWS Lambda (runtime only)

Backend-only. No Terraform, GitHub Actions, API Gateway, or frontend changes in this phase.

## Current request lifecycle

### Local / ECS (`src/index.ts`)

1. `loadEnv()` validates `process.env` (Zod).
2. `buildApp()` creates Fastify, registers plugins (helmet, cors, auth, swagger), routes under `API_PREFIX` (`/api`).
3. `app.listen()` binds `:PORT` (default 3000).
4. Per request: Fastify hooks → route handlers → `getPool()` / `withTx()` → Postgres.

### Lambda (`src/lambda.ts`)

1. Cold start: `buildApp()` + `app.ready()` once per warm container; wrap with `@fastify/aws-lambda`.
2. Each invocation: API Gateway event → Fastify inject → same route stack as local.
3. No `app.listen()`; `callbackWaitsForEmptyEventLoop = false` so the runtime can freeze while Neon pooler holds connections.

## Lambda handler

| Item         | Value                    |
| ------------ | ------------------------ |
| **Source**   | `backend/src/lambda.ts`  |
| **Compiled** | `backend/dist/lambda.js` |
| **Export**   | `handler`                |

## Adapter choice: `@fastify/aws-lambda`

Official Fastify-maintained bridge to API Gateway/Lambda. Alternatives (e.g. custom `@aws-lambda-powertools` or manual `inject`) add glue code without benefit. This package maps API Gateway proxy events to Fastify’s HTTP model and supports v1/v2 payloads.

## Build commands

```bash
cd backend
npm run build          # tsc → dist/
npm run build:lambda   # build + verify handler artifact exists
```

Packaging for deploy (Phase 3+, not run in Phase 2):

```bash
npm run package:lambda   # node scripts/package-lambda.mjs → backend/lambda.zip
```

Uses the `archiver` npm package (no system `zip` CLI). Suitable for GitHub Actions on `ubuntu-latest`.

## Environment variables

| Variable                | Lambda prod                  | Local dev                                | Notes                             |
| ----------------------- | ---------------------------- | ---------------------------------------- | --------------------------------- |
| `NODE_ENV`              | **required** `production`    | `development`                            |                                   |
| `AUTH_MODE`             | **required** `cognito`       | `dev_bypass` (via Makefile)              |                                   |
| `DATABASE_URL`          | **required**                 | optional (defaults to Docker URL in dev) | Use Neon **pooler** URL on Lambda |
| `COGNITO_REGION`        | **required** when cognito    | when testing cognito                     |                                   |
| `COGNITO_USER_POOL_ID`  | **required** when cognito    | when testing cognito                     |                                   |
| `COGNITO_APP_CLIENT_ID` | **required** when cognito    | when testing cognito                     |                                   |
| `S3_ATTACHMENTS_BUCKET` | **required** for attachments | optional                                 | Presign routes fail without it    |
| `AWS_REGION`            | **required**                 | optional (default `us-east-1`)           | S3 client                         |
| `API_PREFIX`            | optional (`/api`)            | optional                                 | Match API Gateway route           |
| `LOG_LEVEL`             | optional                     | optional                                 |                                   |
| `PORT`                  | unused on Lambda             | used by listen                           |                                   |
| `AUTH_DEV_BYPASS_*`     | **local only**               | dev_bypass                               | Never in prod Lambda              |
| `AUTH_SESSION_SECRET`   | N/A backend                  | N/A                                      | Frontend/BFF only                 |
| `COGNITO_CLIENT_SECRET` | N/A backend                  | N/A                                      | Frontend OAuth only               |

Migrations: run **outside** Lambda (`npm run migrate:up` in CI or locally) against Neon **direct** connection.

## Lambda safety notes

| Topic             | Behavior                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Pool**          | `max: 1` only when `AWS_LAMBDA_FUNCTION_NAME` is set (see `isLambdaRuntime()` in `db/index.ts`); local/tests use pg defaults |
| **Neon**          | Use pooler hostname in `DATABASE_URL`; direct host for migrations only                                                       |
| **Singleton env** | `loadEnv()` caches after first call in a container                                                                           |
| **Cold start**    | Full `buildApp()` + Swagger registration; consider disabling `/docs` in prod later if size/latency matter                    |
| **CORS**          | `origin: false` in production — API Gateway + CloudFront must allow browser origin in Phase 3                                |

## Local development impact

**None.** `npm run dev` and `npm start` still use `src/index.ts` only. Lambda entry is not loaded unless you import `dist/lambda.js` explicitly.

## Related

- [neon-phase1.md](neon-phase1.md) — Postgres on Neon
- [../architecture.md](../architecture.md) — system overview
