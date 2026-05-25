# Cognito Auth Setup

This app uses Cognito Hosted UI + server-side session cookies for admin and portal routes.

Never commit `frontend/.env.local`. Keep real values local only.

**Canonical local workflow:** [docs/DEV.md](../docs/DEV.md) and `make dev` (see **Local auth modes** below).

---

## Local auth modes

| Mode                                | How to run                                   | Backend `AUTH_MODE` | Use when                                      |
| ----------------------------------- | -------------------------------------------- | ------------------- | --------------------------------------------- |
| **dev_bypass** (default inner loop) | `make dev` or `make dev-api` + `make dev-ui` | `dev_bypass`        | Fast local work; fixed dev user; no Cognito   |
| **Cognito**                         | `make dev-cognito`                           | `cognito`           | Real Hosted UI, JWT verification, role claims |

Ports (Makefile):

- Backend: `http://localhost:3000` (`make dev-api` / `make dev-api-cognito`)
- Frontend: `http://localhost:3001` (`make dev-ui` — **not** default `next dev` on 3000)
- OAuth callback: `http://localhost:3001/api/auth/callback`
- Logout landing: `http://localhost:3001/login`

Do not use `cd frontend && npm run dev` for Cognito or BFF testing; Next defaults to port **3000**, which conflicts with the API and mismatches Cognito callback URLs.

Optional: **`/api/auth/dev-bootstrap`** (localhost only) mints a session without Cognito when the API is in `dev_bypass`. See [docs/DEV.md](../docs/DEV.md) (Playwright screenshots).

---

## Required env vars (frontend)

Set these in `frontend/.env.local` for Cognito local dev:

- `AUTH_SESSION_SECRET` - long random secret for signing the `fefeave_session` cookie
- `COGNITO_DOMAIN` - Cognito Hosted UI domain (no trailing slash)
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `COGNITO_REDIRECT_URI` - should match Cognito app client callback URL exactly (example: `http://localhost:3001/api/auth/callback`)
- `COGNITO_LOGOUT_URI` - should match Cognito app client sign-out URL exactly (example: `http://localhost:3001/login`)
- `BACKEND_BASE_URL` - backend origin + API prefix used by auth callback server route (example: `http://localhost:3000/api`)
- `NEXT_PUBLIC_BACKEND_URL` - **set to `/api`** so browser traffic goes through the frontend BFF proxy

---

## AWS Console mapping (copy/paste source)

Use Cognito User Pool app client + Hosted UI settings:

- `COGNITO_DOMAIN`
  - Cognito Console -> User pool -> App integration -> Domain -> your Hosted UI domain
  - Example format: `your-domain.auth.us-west-2.amazoncognito.com` (no protocol)
- `COGNITO_CLIENT_ID`
  - Cognito Console -> User pool -> App integration -> App clients -> selected client -> Client ID
- `COGNITO_CLIENT_SECRET`
  - Cognito Console -> User pool -> App integration -> App clients -> selected client -> Client secret
- `COGNITO_REDIRECT_URI`
  - Must match app client callback URL exactly:
  - `http://localhost:3001/api/auth/callback`
- `COGNITO_LOGOUT_URI`
  - Must match app client sign-out URL exactly:
  - `http://localhost:3001/login`
- `AUTH_SESSION_SECRET`
  - Generate a long random value locally (used to sign session cookie)
- `BACKEND_BASE_URL`
  - Local backend API origin for auth callback route:
  - `http://localhost:3000/api`
- `NEXT_PUBLIC_BACKEND_URL`
  - Keep `/api` for BFF mode.

---

## Hosted UI Logout

- Allowed sign-out URL in Cognito should include `http://localhost:3001/login`.
- App logout uses Cognito Hosted UI `/logout` for global sign-out, then returns to `COGNITO_LOGOUT_URI`.
- This avoids stale Cognito browser sessions and reduces intermittent logout/login redirect flakiness.

---

## Deploy env guidance

- **Local:** set in `frontend/.env.local`.
- **Hosted frontend (dev/staging/prod):** set as platform environment variables (for example ECS task env when `create_backend_infra` is enabled).
- Keep `NEXT_PUBLIC_BACKEND_URL=/api` in all environments unless intentionally bypassing BFF.
- Keep secrets (`AUTH_SESSION_SECRET`, `COGNITO_CLIENT_SECRET`) only in server-side env storage, never in client code.

---

## Auth flow notes

- Session is stored in `httpOnly` cookie (`fefeave_session`), not in `localStorage`.
- Middleware gates only `/admin/*` and `/portal/*`.
- `/login`, `/api/auth/*`, and `/api/auth/health` are not matched by middleware, preventing auth redirect loops.

---

## Debug endpoint

Use `GET /api/auth/health` to quickly verify session state without exposing tokens:

- `200` -> `{ authenticated: true, user, roles, expiresAt }`
- `401` -> `{ authenticated: false }`

---

## Common failure modes

- `redirect_uri mismatch` in Cognito:
  - `COGNITO_REDIRECT_URI` must exactly match Cognito callback URL (scheme, host, path, trailing slash behavior).
- Login URL contains `change_me_domain` or `CHANGE_ME_FRONTEND_CLIENT_ID`:
  - your env values were not set correctly.
  - set `COGNITO_DOMAIN` and `COGNITO_CLIENT_ID` in shell env or `frontend/.env.local`.
- Missing or wrong roles/groups:
  - users can authenticate but then route to `/403` if they do not have `ADMIN`/`OPERATOR`/`WHOLESALER` claims expected by backend `/users/me` and session roles.
- Cookie issues:
  - in production, cookie is `secure=true`; ensure HTTPS.
  - cross-site deployment setups may need careful domain and SameSite expectations (`lax` is currently used).
- BFF bypass misconfiguration:
  - if `NEXT_PUBLIC_BACKEND_URL` is set to a direct backend URL, browser requests can fail due to CORS/auth context differences.

---

## Local smoke test (Cognito)

1. From repo root: `make dev-cognito` (sets backend `AUTH_MODE=cognito` and starts UI on **:3001**).
2. Open `http://localhost:3001/login`.
3. Visit `http://localhost:3001/admin/dashboard` while signed out → redirected to `/login`.
4. Complete Cognito login:
   - ADMIN/OPERATOR account → `/admin/dashboard`
   - WHOLESALER account → `/portal/statement`
5. Check session: `http://localhost:3001/api/auth/health` → `authenticated: true`, expected `user`/`roles`, `expiresAt`.
6. Forbidden routes: WHOLESALER on `/admin/*` → `/403`; ADMIN on `/portal/*` → `/403`.
7. Logout from admin/portal layout → protected routes redirect to `/login`.

`make dev-cognito` fails fast if required Cognito vars are missing and prints setup hints.

---

## Verification

1. `make dev-cognito`
2. Open `http://localhost:3001/login`
3. Confirm Hosted UI authorize URL uses your real `COGNITO_DOMAIN` and `COGNITO_CLIENT_ID` (not placeholders).

---

## Role / portal smoke steps

1. Create or identify Cognito test users:
   - one user with `ADMIN` (or `OPERATOR`) role claim
   - one user with `WHOLESALER` role claim
2. Sign in as ADMIN and create/find a wholesaler in admin UI or API.
3. Link the WHOLESALER Cognito user to that wholesaler:
   - `POST /api/admin/wholesalers/:id/link-user`
   - body: `{ "userId": "<WHOLESALER_COGNITO_SUB>" }`
4. Verify WHOLESALER portal access:
   - sign in as WHOLESALER
   - open `/portal/statement` and confirm statement rows (or empty state) load
   - click Download CSV and confirm file name format: `wholesaler-statement-YYYY-MM-DD.csv`
5. Verify ADMIN access:
   - sign in as ADMIN
   - open `/admin/dashboard` and confirm admin UI/shell renders normally
6. Verify forbidden redirects:
   - as WHOLESALER, open `/admin/dashboard` -> `/403`
   - as ADMIN, open `/portal/statement` -> `/403`
