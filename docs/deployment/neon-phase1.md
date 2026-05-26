# Phase 1: Neon Postgres compatibility

Validate that existing FefeAve migrations and integration tests work against [Neon](https://neon.tech) Postgres **before** Lambda, OpenNext, or Terraform changes. This phase is database-only: no app behavior changes.

**Out of scope for Phase 1:** Lambda, OpenNext, Terraform, GitHub Actions, frontend, removing ECS/RDS files.

---

## Current backend database tooling (audit)

| Command                    | Script / definition                                               | Schema                     | Notes                                                        |
| -------------------------- | ----------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `npm run migrate:up`       | `backend/package.json` → `node-pg-migrate --tsx up -m migrations` | **`public`** (default)     | Used by `make dev-migrate`, `db-reset.sh`, prod migrate docs |
| `npm run migrate:down`     | `node-pg-migrate --tsx down -m migrations`                        | `public`                   | Roll back one migration                                      |
| `npm run migrate:create`   | `node-pg-migrate create -m migrations`                            | —                          | New migration file                                           |
| `npm run test`             | Jest, excludes `*-integration*`                                   | —                          | **No database**                                              |
| `npm run test:integration` | `backend/scripts/run-integration-tests.sh`                        | **`test`**                 | Drops/recreates `test` schema; then Jest integration suites  |
| `make dev-migrate`         | Repo root Makefile → `migrate:up` on local Docker URL             | `public`                   | Default `LOCAL_DB_URL`                                       |
| `npm run db:reset`         | `backend/scripts/db-reset.sh`                                     | **`public`** (destructive) | **Local only** — drops entire `public` schema                |

Integration suites call `node-pg-migrate --tsx` with `-s test --create-schema --create-migrations-schema` via `runTestSchemaMigrations()` in `backend/src/__tests__/helpers.ts` (must match `npm run migrate:up`, which uses `--tsx` for ESM migration files). The shell runner only resets `test` via `DROP SCHEMA IF EXISTS test CASCADE`.

**Migrations on disk:** 16 files under `backend/migrations/`, including one no-op placeholder (`1771120000000_live_page_config.js`).

---

## Neon branches (recommended)

| Branch purpose                                  | Use for                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **`phase1-validation`** (or any throwaway name) | First `migrate:up`, integration tests, experiments                               |
| **`staging`** (optional later)                  | Pre-prod app testing                                                             |
| **`main` / production**                         | Felicia’s real data — **never** run integration tests or `db-reset` against this |

In the Neon console: **Branches** → **Create branch** from `main` (or empty project). Each branch has its **own connection string**.

**Rule:** Copy the connection string for the **validation branch only**. Do not commit URLs or passwords to git.

---

## Connection string and SSL

Neon requires TLS. Use the connection string from the Neon dashboard (it usually includes SSL parameters).

**Recommended query params** (if not already present):

```text
?sslmode=require
```

**Example shape** (placeholders only — use your dashboard value):

```text
postgresql://<user>:<password>@<endpoint>.us-west-2.aws.neon.tech/<database>?sslmode=require
```

The app uses `pg` with `connectionString: DATABASE_URL` (`backend/src/db/index.ts`). No code change is required for SSL when `sslmode=require` is in the URL.

**Pooled vs direct (Neon):**

| Endpoint                                | When to use in Phase 1                                    |
| --------------------------------------- | --------------------------------------------------------- |
| **Direct** (host **without** `-pooler`) | `npm run migrate:up`, `npm run test:integration`          |
| **Pooled** (`-pooler` in host)          | Lambda prod runtime later — **not** for integration tests |

Integration tests set `PGOPTIONS=-c search_path=test`. Neon’s pooler **rejects** `search_path` as a startup parameter ([Neon docs](https://neon.tech/docs/connect/connection-errors#unsupported-startup-parameter)). `run-neon-integration-tests.sh` fails fast if the URL contains `-pooler`.

For Phase 1, use the **direct** connection string from the Neon dashboard for migrations and tests. Migrations may work on pooler; the app test suite requires direct.

---

## Exact commands

### 1. Run migrations on Neon (`public` schema)

From `backend/` with a **non-production** Neon branch URL in the environment:

```bash
cd backend
export DATABASE_URL='postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require'
npm run migrate:up
```

Equivalent explicit invoke:

```bash
cd backend
DATABASE_URL='postgresql://...' npx node-pg-migrate --tsx up -m migrations
```

**Verify:** In Neon SQL editor or `psql`, check `public` tables exist (`shows`, `owed_line_items`, `payments`, `accounts`, …) and `pgmigrations` has 16 rows.

### 2. Run integration tests against Neon

Uses the same `test` schema isolation as local Docker. **Does not** start Docker when `DATABASE_URL` is set.

```bash
cd backend
export DATABASE_URL='postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require'
npm run test:integration
```

Optional guard wrapper (refuses empty `DATABASE_URL`, prints reminder about branches):

```bash
cd backend
export DATABASE_URL='postgresql://...'
./scripts/run-neon-integration-tests.sh
```

### 3. Keep local workflow unchanged

```bash
# Unit tests (no DB)
cd backend && npm test

# Integration tests (Docker Postgres if DATABASE_URL unset)
cd backend && npm run test:integration

# Local public schema
make dev-migrate
```

---

## Migration compatibility

| Feature                                          | In FefeAve migrations                                | Neon support                                    |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------- |
| Postgres **16**                                  | Target in RDS/terraform docs                         | Supported (match major version in Neon project) |
| Extension **`pgcrypto`**                         | `1771033638928_core-schema.js` (`gen_random_uuid()`) | **Supported** on Neon                           |
| **ENUM types**                                   | `app_role`, `show_status`, `account_type`, …         | Standard Postgres — OK                          |
| **`numeric(19,4)`**                              | Ledger amounts                                       | OK                                              |
| **Partial indexes** / `WHERE deleted_at IS NULL` | Several migrations                                   | OK                                              |
| **FK constraints**                               | Throughout core schema                               | OK                                              |
| **PL/pgSQL**                                     | Not used in migrations                               | —                                               |

**Compatibility verdict:** Migrations are **compatible** with Neon; no migration file changes required for Phase 1.

**Not used:** `uuid-ossp`, PostGIS, custom C extensions, tablespaces, or RDS-only roles.

---

## What not to run on Neon

| Command                                             | Risk                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `backend/scripts/db-reset.sh`                       | Drops **`public`** schema — destroys all prod data                                   |
| `npm run test:integration` on **production** branch | Drops **`test`** schema only (safe for `test`), but load/noise on prod; use a branch |
| `npm run seed:dev` on production                    | Inserts dev sample data — use local or throwaway branch only                         |

---

## Avoid using production Neon for tests

1. Create a dedicated branch (e.g. `phase1-validation`) per engineer or CI job.
2. Never export prod `DATABASE_URL` into shell history for `test:integration`.
3. Prefer Neon **branch expiration** or delete throwaway branches after validation.
4. Later CI: store branch URL in GitHub **secrets** named e.g. `NEON_DATABASE_URL_STAGING`, not prod.

---

## Blockers and risks

| Item                                    | Severity                | Mitigation                                                 |
| --------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| Missing `sslmode=require`               | High (connection fails) | Use dashboard connection string                            |
| Running `db-reset` on prod branch       | Critical                | Local/docker only; documented above                        |
| Migration order / missing files         | Medium                  | Same as local; see `backend/README.md` § Migrations        |
| Neon compute **suspend** on free tier   | Low                     | First query after idle may be slow; acceptable for Phase 1 |
| Two migrations sharing timestamp prefix | Medium                  | Already documented in backend README                       |

**No code blockers** identified for Phase 1.

---

## Estimated Neon cost (ongoing)

Neon pricing changes; verify on [neon.tech/pricing](https://neon.tech/pricing).

| Tier              | Typical fit for FefeAve                          | Rough monthly |
| ----------------- | ------------------------------------------------ | ------------- |
| **Free**          | 1 admin, very low traffic, branch for validation | **$0**        |
| **Launch / paid** | Always-on compute, more storage/branches         | **~$5–19+**   |

For the serverless prod target ($10–15/mo total AWS+Neon), **Neon free** or **~$5 Launch** is realistic. Storage and branch count drive upgrades.

---

## Phase 1 checklist

- [ ] Neon project created (Postgres 16, region e.g. `us-west-2` to match AWS later)
- [ ] Throwaway branch created; `DATABASE_URL` set locally (not committed)
- [ ] `npm run migrate:up` succeeds
- [ ] `npm run test:integration` succeeds against that branch
- [ ] `npm test` still passes locally without Neon
- [ ] Document results in PR / ticket (no secrets)

---

## Related docs

- [backend/README.md](../../backend/README.md) — migrations, integration tests
- [docs/testing.md](../testing.md) — test layers and CI scope
- [docs/deployment/prod-release.md](prod-release.md) — current ECS prod path (unchanged in Phase 1)
