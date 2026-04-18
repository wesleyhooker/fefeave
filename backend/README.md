# Fefeave Backend

Fastify API for the Fefeave reseller system. Postgres for data; Zod for env validation; Swagger at `/docs`.

---

## 1. Local Development

### Prerequisites

- Node.js 20+
- Postgres (or use `docker compose up -d postgres` from repo root)

### Quick start

```bash
npm install
export DATABASE_URL=postgres://fefeave:fefeave@localhost:5432/fefeave
npm run dev
```

API at `http://localhost:3000/api`. Health at `/api/health`, docs at `/docs`.

---

## 2. Available Scripts

| Script                     | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Dev server with watch                                        |
| `npm run build`            | Compile to `dist/`                                           |
| `npm start`                | Run compiled app                                             |
| `npm run lint`             | ESLint                                                       |
| `npm run format`           | Prettier                                                     |
| `npm test`                 | Unit tests (Jest, DB-free)                                   |
| `npm run test:integration` | Integration tests (starts Postgres automatically; see below) |
| `npm run migrate:up`       | Run migrations                                               |
| `npm run migrate:down`     | Rollback last migration                                      |
| `npm run migrate:create`   | Create new migration                                         |

---

## 3. Integration Tests (One Command)

`npm run test:integration` runs all integration tests (db-smoke, shows, wholesalers) with **zero manual setup**:

1. Starts Postgres via `docker compose up -d postgres` (from repo root)
2. Waits until Postgres is ready
3. Runs tests with schema isolation (test schema)
4. Stops containers with `docker compose down`

**Prerequisites:** Docker installed. Run from repo root or `backend/` (script uses `../docker-compose.yml`).

**CI / existing Postgres:** If `DATABASE_URL` is already set, the script skips docker and runs jest only (e.g. GitHub Actions with a postgres service).

---

## 4. Database

### Local Postgres (Docker)

From repo root:

```bash
docker compose up -d postgres
```

Then in `backend/`:

```bash
export DATABASE_URL=postgres://fefeave:fefeave@localhost:5432/fefeave
npm run migrate:up
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

Database is optional for health, docs, and auth endpoints. The app fails fast on invalid config.

---

## 6. Project Structure

```text
backend/
├── src/
│   ├── config/       # Env, database URL
│   ├── routes/       # API handlers
│   ├── plugins/      # Fastify plugins
│   ├── utils/        # Logger, errors
│   └── index.ts
├── migrations/       # node-pg-migrate
└── package.json
```

### Migrations

- **Create:** `npm run migrate:create -- <migration-name>` (from `backend/`) so `node-pg-migrate` assigns a **unique** timestamp prefix. Avoid hand-copying an existing file’s numeric prefix.
- **Order:** `node-pg-migrate` sorts by the numeric prefix (first `_`-separated segment), then by full filename. It also **checks** that the ordered file list matches the database’s applied migration names in lockstep. Two different files must not share the same prefix (e.g. `1771120000000_a` and `1771120000000_b` both sort as `1771120000000` and break ordering expectations).
- **Missing file on disk:** If the DB already lists a migration name that is not in `migrations/`, every later `migrate:up` fails. Restore the matching file (use a no-op `up`/`down` only if the DDL already exists everywhere), or fix the DB metadata in controlled environments.
- **Renames:** If you rename a migration file **after** it has been applied somewhere, reconcile the `pgmigrations` metadata (or re-baseline that environment) so the tool does not try to run the same schema change twice.

---

## 7. Module Status

- `auth` — Authentication
- `users` — User management
- `wholesalers` — POST/GET (implemented)
- `shows` — POST/GET (implemented)
- `owed-line-items` — POST/GET under shows (implemented)
- `payments`, `adjustments`, `attachments` — Pending

---

## 8. Troubleshooting

| Issue                            | Fix                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| App fails to start               | Check `DATABASE_URL` or split DB vars; Postgres must be running.                                                                                      |
| `npm run test:integration` fails | Ensure Docker is running. For manual runs, set `DATABASE_URL` to skip docker.                                                                         |
| Migrations fail                  | Ensure DB exists; user has create-table privileges. Check for **duplicate migration timestamp prefixes** in `migrations/` (see **Migrations** above). |
