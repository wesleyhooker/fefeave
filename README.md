# FefeAve

FefeAve is a monorepo for operating a live-resale business. A **PostgreSQL-backed API** records show payouts, per-wholesaler settlements, payments, and balances; a **Next.js** app provides an admin workspace for operators, a read-only wholesaler portal, and public marketing pages. Attachments (payout evidence) use **S3 presigned URLs** when configured.

**Financial rules and permissions are enforced on the server.** The UI reflects API state; it does not define balances, settlement caps, or role access.

---

## System at a glance

| Layer          | Technology                                                            |
| -------------- | --------------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React 19, TypeScript                         |
| Backend        | Fastify, Node.js                                                      |
| Database       | PostgreSQL (`node-pg-migrate`)                                        |
| Infrastructure | Terraform on AWS (`us-west-2`)                                        |
| Attachments    | S3 (presigned upload/download when configured)                        |
| Auth           | Cognito-ready JWT verification; local `dev_bypass` for inner-loop dev |

---

## Architecture summary

```text
Browser
  → Next.js (public | admin | portal | /api/auth/*)
      → dev: /api/* rewritten to Fastify :3000
  → Fastify API (/api/*)
      → PostgreSQL
      → S3 (attachments, when configured)
```

**Surfaces**

| Surface | Routes           | Access                                        |
| ------- | ---------------- | --------------------------------------------- |
| Public  | `(public)/`      | Marketing pages; env-driven social/live links |
| Admin   | `(admin)/admin/` | Session cookie; `ADMIN` or `OPERATOR`         |
| Portal  | `(portal)/`      | Session cookie; `WHOLESALER`                  |
| API     | `/api/*`         | Bearer token from session; guards per route   |

Aggregations and balance math live in backend **read models** (`backend/src/read-models/`). Route handlers validate input; services enforce invariants (e.g. settlement payout caps, closed-show freeze). See [docs/roadmap.md](docs/roadmap.md) for V1 scope.

---

## Repository layout

```text
fefeave/
├── backend/              # Fastify API, migrations, tests
├── frontend/           # Next.js (public, admin, portal, auth)
├── infra/                # Terraform (S3, CloudFront, optional ECS/RDS)
├── docs/                 # Technical documentation (start: docs/README.md)
├── design/               # Brand and UI specs (marketing + tokens reference)
├── scripts/              # Repo automation (format, project-head, etc.)
├── .github/workflows/    # CI and deploy workflows
├── Makefile              # Canonical dev and quality commands
└── docker-compose.yml    # Local Postgres
```

| Path        | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `backend/`  | REST API, Swagger at `/docs`, integration tests                |
| `frontend/` | App Router route groups, session BFF, `@/system` UI primitives |
| `infra/`    | AWS resources; local-first defaults in `dev.tfvars`            |
| `docs/`     | Setup, roadmap, UX history, and deeper guides                  |
| `design/`   | Color, typography, and homepage guidance for the public site   |

The `context/` directory holds legacy pointers; active roadmap and agent conventions live under `docs/`.

---

## Local development

Prerequisites: Node.js 20+, Docker (for Postgres), `make`.

```bash
docker compose up -d postgres
make dev-migrate
make dev             # backend :3000 + frontend :3001 (tmux)
make dev-seed        # optional: realistic mock data + financial_events
make dev-seed-verify # optional: confirm event-backed Financials are ready
```

| URL                              | Service     |
| -------------------------------- | ----------- |
| http://localhost:3001            | Frontend UI |
| http://localhost:3000/api/health | API health  |
| http://localhost:3000/docs       | Swagger UI  |

Copy env templates before first run: `backend/.env.example` → `backend/.env`, `frontend/.env.example` → `frontend/.env.local`.

Full setup, Cognito flow, WSL/Docker notes, and troubleshooting: **[docs/DEV.md](docs/DEV.md)**.

---

## Configuration

| File                    | Role                                               |
| ----------------------- | -------------------------------------------------- |
| `backend/.env.example`  | Database URL, `AUTH_MODE`, S3 attachment vars      |
| `frontend/.env.example` | Backend URL, session secret, public marketing URLs |

**`AUTH_MODE`** (backend):

| Value        | Use                                                |
| ------------ | -------------------------------------------------- |
| `off`        | No auth plugin enforcement (limited routes)        |
| `dev_bypass` | Local default; fixed dev user via env (`make dev`) |
| `cognito`    | JWT verification against Cognito                   |

Cognito console mapping and session cookies: **[frontend/AUTH_SETUP.md](frontend/AUTH_SETUP.md)**.

---

## Testing and quality

```bash
make check    # format check, lint, backend unit tests, frontend build (CI-aligned)
```

| Command                                  | Scope                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `make test` / `cd backend && npm test`   | Unit tests (no database)                                         |
| `cd backend && npm run test:integration` | Full integration suite (Docker Postgres, isolated `test` schema) |

**CI** (`.github/workflows/`) runs backend unit tests and frontend build on push; **integration tests are local-only** today. Run them before changes that touch ledger, settlements, or migrations.

Details: **[docs/testing.md](docs/testing.md)** and **[backend/README.md](backend/README.md)**.

---

## Database

Local Postgres runs via `docker compose`. Migrations and seed:

```bash
make dev-migrate
make dev-seed
```

Reset: `make dev-db-reset` then migrate again. Migration conventions (timestamps, soft delete): **[backend/README.md](backend/README.md)** § Migrations.

---

## Infrastructure

**Local-first by default.** `infra/dev.tfvars` sets `create_backend_infra = false` (no NAT/ALB/ECS/RDS until opted in). Terraform still provisions shared low-cost resources (e.g. S3 site bucket, CloudFront, attachment bucket policies) per workspace.

Hosted backend and RDS are **feature-flagged** in tfvars. **Dev:** local `make dev` + CI only (no auto deploy on merge). **Prod:** manual ECS deploy workflows when infra is enabled — **[infra/README.md](infra/README.md)**.

---

## Documentation

| Document                                                                                      | Contents                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [docs/README.md](docs/README.md)                                                              | Documentation index                              |
| [docs/architecture.md](docs/architecture.md)                                                  | System structure, layers, auth, financial domain |
| [docs/testing.md](docs/testing.md)                                                            | Tests, `make check`, CI vs local                 |
| [docs/DEV.md](docs/DEV.md)                                                                    | Daily dev commands, ports, troubleshooting       |
| [docs/roadmap.md](docs/roadmap.md)                                                            | V1 phases, epics, completion criteria            |
| [backend/README.md](backend/README.md)                                                        | API env vars, migrations, tests                  |
| [infra/README.md](infra/README.md)                                                            | Terraform variables, outputs, deploy             |
| [frontend/AUTH_SETUP.md](frontend/AUTH_SETUP.md)                                              | Cognito and session setup                        |
| [design/](design/)                                                                            | Brand tokens and public UI specs                 |
| [frontend/app/(public)/\_components/README.md](<frontend/app/(public)/_components/README.md>) | Public marketing component map                   |

Branch naming for features: `feature/v<version>-<phase>.<epic>-short-description` (see [docs/roadmap.md](docs/roadmap.md)).

---

## Roadmap and scope

Version 1 is an **admin financial control system**: reliable show settlements, wholesaler obligations, payments, and balances—replacing spreadsheet tracking. Optional phases cover portals, exports, and analytics.

Current phase/epic breakdown and completion criteria: **[docs/roadmap.md](docs/roadmap.md)**.
