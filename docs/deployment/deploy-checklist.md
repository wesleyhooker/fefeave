# Production deploy checklist

Operator checklist for **serverless prod** (`infra/prod.tfvars`). Run in order; do not skip migration or readiness steps.

Related docs: [prod-release.md](prod-release.md), [neon-phase1.md](neon-phase1.md), [lambda-phase3.md](lambda-phase3.md), [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md).

---

## Pre-deploy (code merged to `main`)

- [ ] **Backend CI green** — lint, unit tests, `npm run build`, critical integration suites (obligations, payment corrections, cash parity).
- [ ] **Frontend CI green** — lint, tests, build.
- [ ] **Review migration diff** — if `backend/migrations/` changed, plan `migrate:up` against Neon **before** or **immediately after** backend deploy (never deploy code that expects schema the DB lacks).
- [ ] **Pre-launch data policy** — see [pre-launch-data-policy.md](pre-launch-data-policy.md). For dev/mock DBs, prefer reset over drift repair.
- [ ] **Payment drift (real prod only)** — skip for fresh or reset environments:
  - [ ] `npm run reconcile:payment-drift -- --report` only if preserving legacy rows with real activity
  - [ ] Reconcile if report shows drift; otherwise rely on write-path tests + CI

---

## Database migrations

Run from a machine with Neon network access (or CI job with `DATABASE_URL` secret):

```bash
cd backend
DATABASE_URL='postgresql://...' npm run verify:migrations   # must exit 0
DATABASE_URL='postgresql://...' npm run migrate:up          # if verify reports pending
DATABASE_URL='postgresql://...' npm run verify:migrations   # confirm clean
```

**Rules:**

- `verify:migrations` compares `pgmigrations` to the build manifest / `migrations/` directory.
- Pending migrations → **do not deploy** backend until `migrate:up` succeeds.
- Unknown applied migrations → code is **behind** DB; deploy older commit or restore missing migration files.

---

## Backend deploy (Lambda)

GitHub Actions: **Backend Deploy (prod)** (`workflow_dispatch`).

Required GitHub `prod` vars: `BACKEND_DEPLOY_ROLE_ARN`, `BACKEND_LAMBDA_FUNCTION_NAME`, `AWS_REGION`.

Optional but recommended:

| Var / secret              | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `BACKEND_API_GATEWAY_URL` | Post-deploy readiness probe                  |
| `DATABASE_URL` (secret)   | Pre-deploy `verify:migrations` workflow step |

Workflow steps:

1. Build + package Lambda (`build:lambda`, `package:lambda`)
2. _(Optional)_ `npm run verify:migrations` when `DATABASE_URL` secret is set
3. Update Lambda code
4. Post-deploy: `GET /api/health` must return `200` with `"status":"ok"` and `"checks":{"database":{"status":"ok"},...}`

**Lambda env (must be set outside Terraform code deploy):**

- `NODE_ENV=production`
- `AUTH_MODE=cognito` (never `dev_bypass` — startup will fail)
- `DATABASE_URL` from Secrets Manager
- `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_APP_CLIENT_ID`

---

## Frontend deploy (OpenNext)

GitHub Actions: **Frontend Deploy (prod)** (`workflow_dispatch`).

After backend is healthy:

1. Build OpenNext artifacts
2. Sync static assets to S3
3. Update server + image optimizer Lambdas
4. CloudFront invalidation

---

## Post-deploy smoke

- [ ] `curl -sfS https://fefeave.com/api/health` → `status: ok`, database + migrations checks ok
- [ ] `curl -sfS https://fefeave.com/api/health/live` → `{ "status": "ok" }`
- [ ] `https://fefeave.com/api/auth/health` → authenticated session after login
- [ ] Login → Cognito → `/admin` dashboard loads
- [ ] Spot-check: vendor balances, financial activity, cash snapshot

---

## Rollback

| Layer        | Action                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Backend code | Re-run **Backend Deploy** from previous git tag/commit                                            |
| Frontend     | Re-run **Frontend Deploy** from previous commit                                                   |
| Migrations   | **Forward-fix only** — add a new migration; do not `migrate:down` in prod without operator review |
| Infra        | `terraform apply` with previous tfvars (see [prod-release.md](prod-release.md))                   |

---

## Health endpoints

| Path                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `GET /api/health`       | Readiness — DB + migrations + app (503 when unhealthy) |
| `GET /api/health/ready` | Same as `/health`                                      |
| `GET /api/health/live`  | Liveness only — no DB check                            |

ALB / API Gateway deploy probes should use `/api/health` (readiness), not `/health/live`.
