# FefeAve Dev Commands

## Daily Loop

```bash
make dev-db-up
make dev-migrate
make dev-api
make dev-ui
```

Open `http://localhost:3001`.

Recommended daily setup is local-only: frontend + backend on your machine, plus local Postgres in Docker. Backend defaults to `AUTH_MODE=dev_bypass` for inner-loop development.

Frontend API calls use same-origin `/api/*` (`NEXT_PUBLIC_BACKEND_URL=/api`). In local development, Next rewrites `/api/*` to `http://localhost:3000/api/*`, so no browser CORS flow is needed.

## Common commands

- `make dev-db-up` — start local Postgres (`docker compose`)
- `make dev-db-down` — stop local Postgres
- `make dev-db-reset` — reset local Postgres volume and restart
- `make dev-migrate` — run DB migrations against local Postgres
- `make dev-api` — run backend locally on `:3000` with dev bypass auth
- `make dev-ui` — run frontend locally on `:3001` (bind `0.0.0.0`)
- `make dev-status` — check local backend endpoint HTTP status codes
- `make test` — run backend tests, then frontend build

## Local UI screenshots (Playwright, dev-only)

**Normal workflow:** keep using `make dev` (or `make dev-ui` + `make dev-api`). No change to that. Screenshots layer on top.

**What the code enforces automatically**

- The preferred path uses **`/api/auth/dev-bootstrap`** (development only, localhost, opt-in env, shared secret). Before minting `fefeave_session`, the server **calls your local API `/users/me`** with the dev bootstrap bearer token. If the backend is not in **`AUTH_MODE=dev_bypass`** or is unreachable, bootstrap **fails with a clear JSON error** — no half-broken cookie.
- Session **roles and user** are taken from **`/users/me`**, so the cookie matches the backend dev-bypass identity.
- Production is unaffected: wrong `NODE_ENV`, missing opt-in, wrong host, or wrong secret → **no cookie** (404/403).

**One-time setup in `frontend/.env.local`**

1. Keep existing vars (`AUTH_SESSION_SECRET`, `BACKEND_BASE_URL`, etc. — see `AUTH_SETUP.md`).
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

**Flags:** `--full` (default) or `--viewport`; `--storage` to force the older **saved Cognito session** file (`playwright:save-auth`) instead of bootstrap.

**Manual steps you still own**

- Put the two bootstrap lines in **`.env.local`** (not committed).
- Run **`make dev`** so API + UI are up; bootstrap requires **`dev_bypass`** API (default for `make dev-api`).
- For real Cognito-only API (`make dev-api-cognito`), use **`npm run playwright:save-auth`** once and **`--storage`**, or rely on Hosted UI — bootstrap is not compatible with Cognito API mode.

**Cognito-only fallback (optional):** `npm run playwright:save-auth` saves **`frontend/.playwright-dev/auth.json`** after you sign in manually; use `playwright:screenshot -- --storage /admin/...`.

## Troubleshooting

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
  - Run `make dev-db-reset`, then `make dev-migrate`.

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
