# FefeAve Dev Commands

See the root [README.md](../README.md) for repo overview. This file is the detailed local development guide.

## Daily Loop

```bash
make dev-db-up
make dev-migrate
make dev-api
make dev-ui
```

Or one command (tmux): `make dev` — DB up, migrate, backend + frontend in tmux (`dev_bypass`).

### Event-backed Financials mock data (recommended)

After `make dev` (or with DB + API running):

```bash
make dev-seed          # domain tables + financial_events backfill
make dev-seed-verify   # print key Financials health metrics
```

For a **clean** local DB with only fresh seed data:

```bash
make dev-reset         # schema reset + migrate + seed (dev only)
make dev-seed-verify
```

`make dev` does **not** run seed automatically — run `make dev-seed` once per session or after schema changes.

Open **http://localhost:3001** (UI). API: **http://localhost:3000/api/health**, Swagger: **http://localhost:3000/docs**.

Recommended daily setup is local-only: frontend + backend on your machine, plus local Postgres in Docker. Backend defaults to `AUTH_MODE=dev_bypass` for inner-loop development.

Frontend API calls use same-origin `/api/*` (`NEXT_PUBLIC_BACKEND_URL=/api`). In local development, Next rewrites `/api/*` to `http://localhost:3000/api/*`, so no browser CORS flow is needed.

### Do not run multiple Next dev servers

**Never run two local Next dev servers for the same frontend at the same time.** They share `frontend/.next` and can corrupt the cache (HTTP 500, missing webpack packs, `/_app` errors).

| Entrypoint                    | Port     | Notes                                                           |
| ----------------------------- | -------- | --------------------------------------------------------------- |
| `make dev-ui` / `make dev`    | **3001** | Standard local UI (recommended)                                 |
| `npm run dev` / `make ui-aws` | **3000** | Direct Next dev; conflicts with `make dev-api` on the same port |

Starting a second server is **blocked** by `frontend/scripts/dev/check-next-dev-singleton.mjs` (wired into `npm run dev`, `make dev-ui`, and `make ui-aws`). Recovery:

```bash
make dev-down
make dev-reset-frontend
```

## Common commands

- `make dev-db-up` — start local Postgres (`docker compose`)
- `make dev-db-down` — stop local Postgres
- `make dev-db-reset` — reset local Postgres volume and restart
- `make dev-migrate` — run DB migrations against local Postgres
- `make dev-seed` — seed sample dev data + backfill `financial_events` (after migrate)
- `make dev-seed-verify` — print Financials mock-data health metrics (DB + API if backend up)
- `make dev-reset` — reset local DB schema, migrate, and seed (clean Financials mock)
- `make dev-backfill-financial-events` — re-run local financial events backfill only (no domain re-seed)
- `make dev` — DB up, migrate, backend + frontend in tmux (`dev_bypass`)
- `make dev-api` — run backend locally on `:3000` with dev bypass auth
- `make dev-ui` — run frontend locally on `:3001` (bind `0.0.0.0`)
- `make dev-cognito` — same as `make dev` but backend `AUTH_MODE=cognito` (see [frontend/AUTH_SETUP.md](../frontend/AUTH_SETUP.md))
- `make dev-status` — check local backend endpoint HTTP status codes
- `make dev-down` — kill dev processes on `:3000`/`:3001` and tmux session
- `make dev-reset-frontend` — kill UI only, clear `frontend/.next`, restart UI (fixes stale Next dev cache; backend/DB stay up)
- `make test` — run backend tests, then frontend build

## Local UI screenshots (Playwright, dev-only)

**Normal workflow:** keep using `make dev` (or `make dev-ui` + `make dev-api`). No change to that. Screenshots layer on top.

**What the code enforces automatically**

- The preferred path uses **`/api/auth/dev-bootstrap`** (development only, localhost, opt-in env, shared secret). Before minting `fefeave_session`, the server **calls your local API `/users/me`** with the dev bootstrap bearer token. If the backend is not in **`AUTH_MODE=dev_bypass`** or is unreachable, bootstrap **fails with a clear JSON error** — no half-broken cookie.
- Session **roles and user** are taken from **`/users/me`**, so the cookie matches the backend dev-bypass identity.
- Production is unaffected: wrong `NODE_ENV`, missing opt-in, wrong host, or wrong secret → **no cookie** (404/403).

**One-time setup in `frontend/.env.local`**

1. Keep existing vars (`AUTH_SESSION_SECRET`, `BACKEND_BASE_URL`, etc. — see [frontend/AUTH_SETUP.md](../frontend/AUTH_SETUP.md)).
2. Add (generate a long random secret for the value):

   ```env
   AUTH_DEV_BOOTSTRAP_ENABLED=1
   AUTH_DEV_BOOTSTRAP_SECRET=<your-long-random-secret>
   ```

3. After `npm install` in `frontend/`, install Chromium once: `npm run playwright:install`.

**Capture a screenshot** (paths are app routes under `http://localhost:3001`):

```bash
cd frontend && npm run playwright:screenshot -- /admin/dashboard
cd frontend && npm run playwright:screenshot -- /admin/shows my-screen.png
```

The script loads `.env.local`, hits dev-bootstrap, then opens the target route. Output: timestamped PNG under **`frontend/.playwright-dev/screenshots/`** (gitignored).

If the page returns **HTTP 500** or **Internal Server Error**, the script **exits with an error** and does not save a misleading screenshot. Fix the dev cache first:

```bash
make dev-reset-frontend
# or: make dev-down && rm -rf frontend/.next && make dev
```

Diagnose cache health:

```bash
cd frontend && npm run dev:diagnose-cache
# optional: DEBUG_RUN_ID=post-fix npm run dev:diagnose-cache
```

**Never run `npm run build` while the frontend dev server (`make dev-ui` / `make dev`) is still running.** The build script now blocks if port `:3001` is listening. Stop the UI first (`make dev-reset-frontend` or kill `:3001`) to avoid mixed prod/dev `.next` state.

**Admin chrome regression check (semantic tokens):** After changing workspace colors, capture desktop `dash.png` / `shows.png` / `balances.png` plus mobile harness (`npm run playwright:screenshot:mobile`). Confirm sidebar near-white text on deep clay, KPI peach/gold readability, warm-but-not-dark shell. Remaining debt is usually stray legacy `admin-brand` references outside the hot path and intentional gray table chrome.

**Flags:** `--full` (default) or `--viewport`; `--storage` to force the older **saved Cognito session** file (`playwright:save-auth`) instead of bootstrap.

**Manual steps you still own**

- Put the two bootstrap lines in **`.env.local`** (not committed).
- Run **`make dev`** so API + UI are up; bootstrap requires **`dev_bypass`** API (default for `make dev-api`).
- For real Cognito-only API (`make dev-api-cognito`), use **`npm run playwright:save-auth`** once and **`--storage`**, or rely on Hosted UI — bootstrap is not compatible with Cognito API mode.

**Cognito-only fallback (optional):** `npm run playwright:save-auth` saves **`frontend/.playwright-dev/auth.json`** after you sign in manually; use `playwright:screenshot -- --storage /admin/...`.

## Troubleshooting

- **Two Next dev servers / mixed `.next` cache**
  - Do not run `make dev-ui` (`:3001`) and `npm run dev` / `make ui-aws` (`:3000`) at the same time.
  - The singleton guard blocks the second start; if you bypass it, run `make dev-reset-frontend`.
- **Frontend 500 / `Cannot read properties of undefined (reading '/_app')` / webpack `ENOENT ... pack.gz`**
  - Stale Next dev cache — usually after `npm run build` or `rm -rf frontend/.next` while `make dev` UI was still running.
  - Fix: `make dev-reset-frontend` (keeps backend/DB) or full `make dev-down && rm -rf frontend/.next && make dev`.
  - Check: `cd frontend && npm run dev:diagnose-cache`
- **Port already in use**
  - Backend: clear process on port `3000`, then rerun `make dev-api`.
  - Frontend: clear process on port `3001`, then rerun `make dev-ui`.
- **Docker not running**
  - Start Docker Desktop/Engine, then rerun `make dev-db-up`.
- **Migrations failed**
  - Confirm DB status with `docker compose ps`.
  - Retry `make dev-migrate`.
- **Migration ordering / duplicate timestamp**
  - Each file in `backend/migrations/` must have a **unique** numeric prefix (the part before the first `_`). Two migrations must not share the same prefix (e.g. colliding with another branch’s `1771120000000_*`).
  - Prefer `npm run migrate:create -- <name>` from `backend/` so `node-pg-migrate` generates a fresh timestamp; avoid copying another file’s prefix when adding migrations by hand.
- **Reset local DB**
  - Run `make dev-db-reset`, then `make dev-migrate`, then `make dev-seed`.
- **Event-backed Financials looks empty after migrate**
  - Run `make dev-seed` (includes backfill) or `make dev-backfill-financial-events` if domain rows already exist.
  - Re-running `make dev-seed` is safe: it deletes seed-namespace rows and their `financial_events`, then re-inserts and backfills.

## Docker on Windows + WSL integration

If you see `docker: command not found` inside WSL, set up Docker Desktop integration:

1. Install **Docker Desktop for Windows**.
2. Open Docker Desktop -> **Settings** -> **General** and enable **Use the WSL 2 based engine**.
3. Open Docker Desktop -> **Settings** -> **Resources** -> **WSL Integration** and enable integration for your Ubuntu distro.
4. Restart WSL from Windows PowerShell:
   - `wsl --shutdown`
5. Re-open your WSL terminal and verify:
   - `docker version`
   - `docker compose version`

### Frontend dev server exits immediately (`EADDRINUSE` on port 3001)

This is usually **not a routes problem** — a previous `next dev` (or `make dev-ui` / tmux pane) is still listening on **3001**.

1. Stop stale listeners: `make dev-down` (frees **3000** and **3001** and the `fefeave-dev` tmux session).
2. Start again: `make dev-ui` (or `make dev`).

If the port is still held by a stale Node/Next process after `make dev-down`, run `make dev-reset-frontend` or check `ss -tlnp 'sport = :3001'`.

### TypeScript errors about missing `.next/types/*.ts`

After cleaning `.next` or switching branches, run `make dev-ui` or `npm run build` once in `frontend/` so Next regenerates route types. Or delete `frontend/tsconfig.tsbuildinfo` and retry.

### UI or API changes do not appear until `make dev` is restarted

On **WSL2**, file watchers often miss saves (especially if the repo lives under `/mnt/c/...` or the editor runs on Windows). `make dev-ui` / `make dev-api` now enable **polling** automatically when WSL is detected:

- **Frontend:** webpack `watchOptions.poll` (see `frontend/next.config.ts`)
- **Backend:** `nodemon --legacy-watch` via `npm run dev:poll`

After pulling this fix, run **`make dev-down`** once, then **`make dev`** again so both panes start with polling.

**Still no hot reload?**

1. Keep the repo in the **Linux filesystem** (`~/dev/...`), not `/mnt/c/...`.
2. Hard-refresh the browser (Ctrl+Shift+R) — the dev server may have recompiled but the tab is stale.
3. Clear a bad Next cache: `make dev-reset-frontend` (or `make dev-down && rm -rf frontend/.next && make dev`).
4. Force polling in `frontend/.env.local`: `WATCHPACK_POLLING=true` (disable with `WATCHPACK_POLLING=false`).
5. Backend API-only edits: confirm the backend tmux pane shows `Restarting...` after you save; if not, the backend pane may need `dev:poll` (WSL) or a manual restart.

### Docker/WSL troubleshooting

- **Docker Desktop is running, but `docker` is still missing in WSL**
  - Confirm WSL integration is enabled for the exact distro you are using.
  - Run `wsl --shutdown`, then reopen the distro terminal.
- **`permission denied` errors from Docker**
  - In Docker Desktop + WSL integration mode, Docker usually runs without local `docker` group setup.
  - If needed, restart Docker Desktop and WSL; ensure you are in the integrated distro.
- **`docker compose` command not found**
  - Verify you are using Docker Desktop's plugin via `docker compose version` (space, not `docker-compose`).
  - If `docker` works but `docker compose` does not, update Docker Desktop to a recent version.

Dev migrations are **manual** by design. Production migrations are **not** run automatically.

## Public marketing links

The marketing site reads Felicia’s social and live profile URLs from the frontend env (no platform API). Set in `frontend/.env.local` (see `frontend/.env.example`):

- `NEXT_PUBLIC_FEFE_INSTAGRAM_URL` — Instagram profile URL
- `NEXT_PUBLIC_FEFE_WHATNOT_URL` — Whatnot shop/profile URL
- `NEXT_PUBLIC_FEFE_TIKTOK_URL` — TikTok profile URL
- `NEXT_PUBLIC_FEFE_CONTACT_EMAIL` — optional; defaults to `fefeave@outlook.com`

If a URL variable is empty, that link is hidden in the footer and contact page (Instagram is also omitted from the homepage hero platform line). If both Whatnot and TikTok are empty, the homepage “Where to find us live” section shows a short fallback message. These are public URLs only—not secrets.
