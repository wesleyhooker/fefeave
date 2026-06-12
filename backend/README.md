# Fefeave Backend

Fastify API for the Fefeave reseller system. Postgres for data; Zod for env validation; Swagger at `/docs`.

**Monorepo onboarding:** use the root [README.md](../README.md) and [docs/DEV.md](../docs/DEV.md) (`make dev`, UI on **:3001**, API on **:3000**). This file covers backend-only setup and API details.

---

## 1. Local Development

### Prerequisites

- Node.js 20+
- Postgres (or `docker compose up -d postgres` from repo root)

### Quick start (backend only)

```bash
npm install
export DATABASE_URL=postgres://fefeave:fefeave@localhost:5432/fefeave
npm run dev
```

API at `http://localhost:3000/api`. Health at `/api/health`, Swagger at `/docs`.

For full stack (frontend + `AUTH_MODE=dev_bypass`), from repo root: `make dev-migrate` then `make dev`.

---

## 2. Available Scripts

| Script                                      | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                               | Dev server with watch                                                   |
| `npm run build`                             | Compile to `dist/`                                                      |
| `npm run build:lambda`                      | Build + verify `dist/lambda.js` exports `handler`                       |
| `npm run package:lambda`                    | Stage `lambda.zip` (dist + prod deps; deploy in a later phase)          |
| `npm start`                                 | Run compiled app                                                        |
| `npm run lint`                              | ESLint                                                                  |
| `npm run format`                            | Prettier                                                                |
| `npm test`                                  | Unit tests (Jest, DB-free; excludes integration suites)                 |
| `npm run test:integration`                  | Integration tests (Docker Postgres + isolated `test` schema)            |
| `npm run migrate:up`                        | Run migrations                                                          |
| `npm run migrate:down`                      | Rollback last migration                                                 |
| `npm run migrate:create`                    | Create new migration                                                    |
| `npm run seed:dev`                          | Dev seed (domain tables + financial_events backfill)                    |
| `npm run seed:verify`                       | Verify dev seed / Financials mock metrics (local only)                  |
| `npm run backfill:financial-events`         | Backfill domain rows into `financial_events` (CLI; prod/staging manual) |
| `npm run backfill:financial-events:dry-run` | Preview backfill counts without inserting                               |

### Dev seed and event-backed Financials

Local Financials calculations read from `financial_events`. `npm run seed:dev` (or `make dev-seed`) writes operational domain rows, then runs the same backfill service as `npm run backfill:financial-events`. Re-running seed deletes seed-namespace `financial_events` before re-inserting domain data, so duplicate events do not accumulate.

Prod/staging backfill remains **manual** — seed never runs outside local dev.

---

## 3. Integration Tests

`npm run test:integration` (from `backend/`) runs the full DB integration suite with minimal setup:

1. If `DATABASE_URL` is unset, starts Postgres via `docker compose up -d postgres` (repo root)
2. Waits until Postgres is ready
3. Resets an isolated **`test`** schema and runs Jest
4. Stops Postgres only if this script started it

**Suites included:** `db-smoke`, `shows-integration`, `wholesalers-integration`, `owed-line-items-integration`, `settlement-ledger-integration`, `vendor-expense-ledger-integration`, `closed-show-freeze-integration`, `inventory-purchases-integration`, `business-expenses-integration`, `financial-strategy-integration`, `cash-snapshots-integration`, `financial-recommendations-integration`, `portal-integration`, `exports-balances-csv`.

**Prerequisites:** Docker installed.

**If `DATABASE_URL` is already set:** the script skips Docker startup and uses that URL (useful when Postgres is already running locally).

**CI:** GitHub Actions does **not** run integration tests today; run them locally before ledger, settlement, or migration changes.

**Neon (serverless migration Phase 1):** Run the same integration suite against a throwaway Neon branch — see [docs/deployment/neon-phase1.md](../docs/deployment/neon-phase1.md). Optional wrapper: `./scripts/run-neon-integration-tests.sh` (requires `NEON_INTEGRATION_CONFIRM=1`).

**Lambda (serverless migration Phase 2):** API entry is `src/lambda.ts` → `dist/lambda.js` (`handler`). Local dev is unchanged (`npm run dev` / `src/index.ts`). See [docs/deployment/lambda-phase2.md](../docs/deployment/lambda-phase2.md).

---

## 4. Database

### Local Postgres (Docker)

From repo root:

```bash
docker compose up -d postgres
# or: make dev-db-up
```

Then in `backend/`:

```bash
export DATABASE_URL=postgres://fefeave:fefeave@localhost:5432/fefeave
npm run migrate:up
# or from repo root: make dev-migrate
```

### Split env vars

Alternatively use `.env` with:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fefeave
DB_USER=fefeave
DB_PASSWORD=fefeave
```

---

## 5. Environment Variables

| Variable                                                  | Purpose                                         | Default       |
| --------------------------------------------------------- | ----------------------------------------------- | ------------- |
| `NODE_ENV`                                                | Environment                                     | `development` |
| `PORT`                                                    | Server port                                     | `3000`        |
| `LOG_LEVEL`                                               | Log level                                       | `info`        |
| `API_PREFIX`                                              | Route prefix                                    | `/api`        |
| `DATABASE_URL`                                            | Postgres connection string                      | —             |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Split DB config (alternative to `DATABASE_URL`) | —             |
| `AUTH_MODE`                                               | `off`, `dev_bypass`, or `cognito`               | `off`         |
| `AUTH_DEV_BYPASS_*`                                       | Required when `AUTH_MODE=dev_bypass`            | —             |
| `COGNITO_*`                                               | Required when `AUTH_MODE=cognito`               | —             |

`make dev-api` sets `AUTH_MODE=dev_bypass` for you. Raw `npm run dev` uses the code default (`off`) unless `.env` overrides it.

Most business routes require a database. Health, Swagger, and some auth paths can run without DB depending on mode.

---

## 6. Project Structure

```text
backend/
├── src/
│   ├── index.ts          # Fastify app entry
│   ├── config/           # Env validation (Zod)
│   ├── routes/           # HTTP handlers (shows, payments, portal, …)
│   ├── services/         # Business rules (settlements, statements, …)
│   ├── read-models/      # SQL aggregations (balances, ledger)
│   ├── db/               # Pool, transactions (withTx), helpers
│   ├── auth/             # Guards (requireAuth, requireRole)
│   ├── plugins/          # auth, swagger, request-id
│   ├── lib/              # S3 presign helpers
│   ├── utils/            # Logger, errors
│   └── __tests__/        # Unit + integration tests
├── migrations/           # node-pg-migrate
└── scripts/              # seed-dev, integration test runner, db-reset
```

### API areas (`src/routes/`)

| Route module                                               | Area                                     |
| ---------------------------------------------------------- | ---------------------------------------- |
| `health`, `auth`, `users`                                  | Health, auth helpers, `/users/me`        |
| `shows`, `show-financials`, `owed-line-items`              | Shows, payout, settlements               |
| `payments`, `adjustments`                                  | Payments and adjustments                 |
| `wholesalers`, `accounts`, `portal`                        | Wholesalers, accounts, portal statements |
| `attachments`                                              | Presigned S3 upload/download             |
| `exports`                                                  | CSV / balance exports                    |
| `vendor-expenses`, `inventory-purchases`, `owner-self-pay` | Expenses and owner flows                 |

### Migrations

- **Create:** `npm run migrate:create -- <migration-name>` (from `backend/`) so `node-pg-migrate` assigns a **unique** timestamp prefix. Avoid hand-copying an existing file’s numeric prefix.
- **Order:** `node-pg-migrate` sorts by the numeric prefix (first `_`-separated segment), then by full filename. It also **checks** that the ordered file list matches the database’s applied migration names in lockstep. Two different files must not share the same prefix (e.g. `1771120000000_a` and `1771120000000_b` both sort as `1771120000000` and break ordering expectations).
- **Missing file on disk:** If the DB already lists a migration name that is not in `migrations/`, every later `migrate:up` fails. Restore the matching file (use a no-op `up`/`down` only if the DDL already exists everywhere), or fix the DB metadata in controlled environments.
- **Renames:** If you rename a migration file **after** it has been applied somewhere, reconcile the `pgmigrations` metadata (or re-baseline that environment) so the tool does not try to run the same schema change twice.

---

## 7. Troubleshooting

| Issue                            | Fix                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| App fails to start               | Check `DATABASE_URL` or split DB vars; Postgres must be running.                                                                                      |
| `npm run test:integration` fails | Ensure Docker is running. Or set `DATABASE_URL` when Postgres is already up.                                                                          |
| Migrations fail                  | Ensure DB exists; user has create-table privileges. Check for **duplicate migration timestamp prefixes** in `migrations/` (see **Migrations** above). |
