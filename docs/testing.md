# Testing and quality validation

Single reference for how FefeAve is tested locally and in CI. For day-to-day dev commands and ports, see [DEV.md](DEV.md). For how tests fit the system, see [architecture.md](architecture.md).

---

## Testing overview

| Layer                         | What it validates                                                 | Typical command                          |
| ----------------------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| **Formatting**                | Prettier across the repo                                          | `make format-check` / `make format`      |
| **Linting**                   | ESLint on `backend/src` and Next.js ESLint on `frontend`          | `make lint`                              |
| **Backend unit tests**        | Jest with mocked DB/S3; no running Postgres required              | `cd backend && npm test`                 |
| **Backend integration tests** | Jest against real Postgres; isolated `test` schema                | `cd backend && npm run test:integration` |
| **Frontend validation**       | Production build (and lint when run via Make)                     | `cd frontend && npm run build`           |
| **Repository check**          | Format + project-head script + lint + unit tests + frontend build | `make check`                             |

There is **no** automated frontend unit/integration test suite in this repo today. Frontend quality gates are **build** (and **lint** when you run `make lint` or `make frontend-check`).

---

## Test types

### Backend unit tests

Run via `npm test` in `backend/`. Jest is invoked with `--ci` and excludes integration file name patterns (see `backend/package.json` `test` script).

**Characteristics:**

- Uses `buildAppForTest` and `app.inject()` (no network listen).
- DB and S3 are **mocked** where needed (e.g. `attachment-linking.test.ts`, `uploads.test.ts`).
- Does **not** require Docker or `DATABASE_URL`.

**Files commonly in the unit run** (not matching integration name patterns):

| File                                         | Focus                                        |
| -------------------------------------------- | -------------------------------------------- |
| `smoke.test.ts`                              | Health, auth-off behavior                    |
| `uploads.test.ts`                            | Presign upload/download handlers (mocked S3) |
| `attachment-linking.test.ts`                 | Attachment CRUD/linking (mocked pool)        |
| `owed-line-items-settlements-delete.test.ts` | Settlement delete rules (mocked)             |
| `wholesalers-balances-bootstrap.test.ts`     | Balance bootstrap edge cases                 |

### Backend integration tests

Run via `npm run test:integration` → `backend/scripts/run-integration-tests.sh`.

**Characteristics:**

- Real Postgres connection (`DATABASE_URL`, default `postgres://fefeave:fefeave@localhost:5432/fefeave`).
- Each suite migrates into PostgreSQL schema **`test`** (`search_path=test`, `node-pg-migrate -s test`).
- Exercises HTTP handlers end-to-end against a running app instance with real SQL.

**Neon branch validation (Phase 1):** Same command with `DATABASE_URL` set to a **non-production** Neon branch (`sslmode=require`). See [deployment/neon-phase1.md](deployment/neon-phase1.md).

**Suites included in the integration runner** (Jest `--testPathPattern` in `run-integration-tests.sh`):

| Pattern / file                              | Focus                                      |
| ------------------------------------------- | ------------------------------------------ |
| `db-smoke.test.ts`                          | DB connectivity and basic API smoke        |
| `shows-integration.test.ts`                 | Shows API                                  |
| `wholesalers-integration.test.ts`           | Wholesalers, balances, unpaid closed shows |
| `owed-line-items-integration.test.ts`       | Settlements / owed line items              |
| `settlement-ledger-integration.test.ts`     | Settlement + ledger flows                  |
| `vendor-expense-ledger-integration.test.ts` | Vendor expenses                            |
| `closed-show-freeze-integration.test.ts`    | Closed show edit restrictions              |
| `inventory-purchases-integration.test.ts`   | Inventory purchases                        |
| `portal-integration.test.ts`                | Wholesaler portal routes                   |
| `exports-balances-csv.test.ts`              | CSV export endpoints                       |

### Frontend validation

| Check            | Command                                           | In CI?            |
| ---------------- | ------------------------------------------------- | ----------------- |
| Production build | `cd frontend && npm run build`                    | Yes (Frontend CI) |
| ESLint           | `cd frontend && npm run lint`                     | No                |
| Security audit   | `cd frontend && npm audit --audit-level=moderate` | Yes (Frontend CI) |

Playwright screenshot scripts under `frontend/scripts/playwright/` are **manual/dev-only** helpers (see [DEV.md](DEV.md)); they are not part of `make check` or CI.

### Repository checks

| Target                | Steps                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `make test`           | Backend unit tests + frontend build                                                                              |
| `make check`          | `format-check` → `npm run test:project-head` → `lint` (backend + frontend) → backend unit tests → frontend build |
| `make backend-check`  | `backend-lint` + `backend-test` + `backend-build`                                                                |
| `make frontend-check` | `frontend-lint` + `frontend-build`                                                                               |

Root `package.json` also defines `format`, `format-check`, and `test:project-head` (validates `scripts/project-head.sh` / roadmap tooling).

---

## Common commands

From **repo root** unless noted.

### Full pre-push check

```bash
make check
```

### Formatting

```bash
make format-check    # verify only
make format          # apply Prettier (repo root npm script)
```

### Linting

```bash
make lint                 # backend + frontend
make backend-lint         # backend only
make frontend-lint        # frontend only
```

### Backend tests

```bash
cd backend && npm test              # unit tests only
cd backend && npm run test:integration   # integration suite (Docker if needed)
make backend-test                   # same as npm test in backend/
```

### Frontend validation

```bash
cd frontend && npm run build
cd frontend && npm run lint         # not part of make check's CI mirror for frontend workflow
make frontend-build
make frontend-check                 # lint + build
```

### Lighter repo test (no format/lint/project-head)

```bash
make test    # backend unit tests + frontend build
```

### Environment health

```bash
make doctor    # Node, npm, Docker, node_modules presence
```

---

## Integration testing

### Docker requirements

If `DATABASE_URL` is **unset**, `run-integration-tests.sh`:

1. Runs `docker compose up -d postgres` from repo root (`docker-compose.yml`).
2. Waits for `pg_isready`.
3. On exit, runs `docker compose down` **only if** it started Postgres (leaves an already-running `fefeave-postgres` container up).

If `DATABASE_URL` is **set** (Postgres already running locally), Docker startup is skipped.

**Prerequisite:** Docker available when relying on the script to start Postgres.

### Test database isolation

- Integration runs use schema **`test`**, not `public`.
- Before Jest, the script runs `DROP SCHEMA IF EXISTS test CASCADE` and `CREATE SCHEMA test`.
- Individual test files run `node-pg-migrate up` with `-s test` and set `PGOPTIONS=-c search_path=test` for the app under test.

Your **development data in `public`** is not targeted by integration teardown. Do not point `DATABASE_URL` at a shared non-local database without understanding this behavior.

### Migration behavior

- Integration suites apply migrations into the **`test`** schema per file setup.
- This is separate from `make dev-migrate`, which migrates the default **`public`** schema used by `make dev`.
- After changing migrations, run integration tests locally to confirm the `test` schema applies cleanly.

### Scenarios covered

Integration tests focus on **ledger and API correctness**: shows, show financials, settlements, payments, wholesaler balances, portal access, exports, closed-show rules, vendor expenses, and inventory. They are the gate for changes to SQL aggregations, route guards, and multi-step writes.

**When to run:** before merging work that touches `backend/migrations/`, `read-models/`, settlement validation, payments, or portal routes.

---

## CI/CD validation

### Backend CI (`.github/workflows/backend-ci.yml`)

**Triggers:** push/PR affecting `backend/**`, `scripts/**`, root `package.json`, or the workflow file.

**Runs on GitHub:**

| Step                               | Local equivalent         |
| ---------------------------------- | ------------------------ |
| `npm run format:check` (repo root) | `make format-check`      |
| `npm run test:project-head`        | part of `make check`     |
| `npm run lint` in `backend/`       | `make backend-lint`      |
| `npm test` in `backend/`           | `cd backend && npm test` |

**Does not run:** integration tests, frontend build, frontend lint.

### Frontend CI (`.github/workflows/frontend-ci.yml`)

**Triggers:** push/PR affecting `frontend/**`, root `package.json`, `frontend/next.config.ts`, or manual `workflow_dispatch`.

**Runs on GitHub:**

| Step                               | Local equivalent                                  |
| ---------------------------------- | ------------------------------------------------- |
| `npm audit --audit-level=moderate` | `cd frontend && npm audit --audit-level=moderate` |
| `npm run build`                    | `cd frontend && npm run build`                    |

**Does not run:** ESLint, backend tests, integration tests, `make check` as a single job.

### What `make check` adds beyond CI

`make check` is **stricter than either workflow alone**:

- Format check (both workflows partially overlap via backend CI only).
- Project-head test (backend CI only).
- **Frontend lint** (not in Frontend CI).
- Backend unit tests (backend CI).
- Frontend build (frontend CI).

**Integration tests are never run in CI** today.

### Deploy workflows

**Prod only (manual):** `Backend Deploy (prod)` and `Frontend Deploy (prod)` via `workflow_dispatch`. Dev CD deploy workflows were removed; CI does not deploy on success. Deploy workflows are ops paths, not test gates. See [infra/README.md](../infra/README.md).

---

## Troubleshooting

| Issue                                 | What to try                                                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Docker unavailable**                | Start Docker Desktop / engine; verify `docker compose version`. Or start Postgres yourself and set `DATABASE_URL=postgres://fefeave:fefeave@localhost:5432/fefeave` before `npm run test:integration`.                                     |
| **Integration fails immediately**     | Ensure port **5432** is free or reachable; check `docker compose ps` for `fefeave-postgres`.                                                                                                                                               |
| **Migration failures in integration** | Pull latest migrations; run `make dev-migrate` on `public` for dev sanity; re-run integration (script recreates `test` schema). Check for duplicate migration timestamp prefixes ([backend/README.md](../backend/README.md) § Migrations). |
| **Stale / confused test schema**      | Re-run `npm run test:integration` (script drops and recreates `test`). Avoid using schema `test` for manual psql experiments during a run.                                                                                                 |
| **Unit tests fail after env change**  | Unit tests do not use Docker; read failure for mock/assertion issues. Run single file: `cd backend && npx jest path/to/file.test.ts`.                                                                                                      |
| **Port conflicts (dev servers)**      | Integration tests do not bind **3000**/**3001**; port conflicts affect `make dev` only. See [DEV.md](DEV.md) (`make dev-down`, EADDRINUSE on 3001).                                                                                        |
| **`make check` fails on format**      | Run `make format`, commit, retry.                                                                                                                                                                                                          |
| **Frontend build fails**              | Run `cd frontend && npm run build` for full Next error; clear `.next` or `tsconfig.tsbuildinfo` per [DEV.md](DEV.md).                                                                                                                      |

---

## Related documentation

| Document                                     | Topic                                   |
| -------------------------------------------- | --------------------------------------- |
| [DEV.md](DEV.md)                             | `make dev`, Postgres, ports, Playwright |
| [architecture.md](architecture.md)           | Testing strategy summary                |
| [../backend/README.md](../backend/README.md) | Backend scripts and env                 |
| [../README.md](../README.md)                 | Repo entry and quick test commands      |
