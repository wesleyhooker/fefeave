# Cognito Auth Setup (Phase 5.1)

This app uses Cognito Hosted UI + server-side session cookies.

Never commit `frontend/.env.local`. Keep real values local only.

## Required env vars (frontend)

Set these in `frontend/.env.local` for local dev:

- `AUTH_SESSION_SECRET` - long random secret for signing the `fefeave_session` cookie
- `COGNITO_DOMAIN` - Cognito Hosted UI domain (no trailing slash)
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `COGNITO_REDIRECT_URI` - should match Cognito app client callback URL exactly (example: `http://localhost:3001/api/auth/callback`)
- `BACKEND_BASE_URL` - backend origin + API prefix used by auth callback server route (example: `http://localhost:3000/api`)
- `NEXT_PUBLIC_BACKEND_URL` - **set to `/api`** so browser traffic goes through the frontend BFF proxy

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
- `AUTH_SESSION_SECRET`
  - Generate a long random value locally (used to sign session cookie)
- `BACKEND_BASE_URL`
  - Local backend API origin for auth callback route:
  - `http://localhost:3000/api`
- `NEXT_PUBLIC_BACKEND_URL`
  - Keep `/api` for BFF mode.

## Makefile ports (local)

- Backend runs on `http://localhost:3000` (`make dev-api` / `make dev-api-cognito`)
- Frontend runs on `http://localhost:3001` (`make dev-ui`)
- OAuth callback route is frontend-owned: `http://localhost:3001/api/auth/callback`
- Keep `BACKEND_BASE_URL=http://localhost:3000/api`

## Deploy env guidance

- **Local:** set in `frontend/.env.local`.
- **Hosted frontend (dev/staging/prod):** set as platform environment variables (for example Vercel/Netlify/your container runtime).
- Keep `NEXT_PUBLIC_BACKEND_URL=/api` in all environments unless intentionally bypassing BFF.
- Keep secrets (`AUTH_SESSION_SECRET`, `COGNITO_CLIENT_SECRET`) only in server-side env storage, never in client code.

## Auth flow notes

- Session is stored in `httpOnly` cookie (`fefeave_session`), not in `localStorage`.
- Middleware gates only `/admin/*` and `/portal/*`.
- `/login`, `/api/auth/*`, and `/api/auth/health` are not matched by middleware, preventing auth redirect loops.

## Debug endpoint

Use `GET /api/auth/health` to quickly verify session state without exposing tokens:

- `200` -> `{ authenticated: true, user, roles, expiresAt }`
- `401` -> `{ authenticated: false }`

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

## Local smoke test

1. Start backend and frontend:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`
2. Visit `/admin/dashboard` while signed out -> redirected to `/login`.
3. Complete Cognito login:
   - ADMIN/OPERATOR account redirects to `/admin/dashboard`
   - WHOLESALER account redirects to `/portal/statement`
4. Check session/debug:
   - open `/api/auth/health` and verify `authenticated: true`, expected `user`/`roles`, and `expiresAt`.
5. Try opening a mismatched area:
   - WHOLESALER visiting `/admin/*` -> `/403`
   - ADMIN/OPERATOR visiting `/portal/*` -> `/403`
6. Click logout from admin/portal layout and confirm protected routes redirect to `/login`.

If you use the Makefile flow:

- `make dev` uses backend `AUTH_MODE=dev_bypass` (fast local loop)
- `make dev-cognito` runs local stack with backend `AUTH_MODE=cognito` (real Hosted UI/session path)
- `make dev-cognito` fails fast if required Cognito vars are missing and prints setup hints.

## Verification

1. `cd ~/dev/fefeave && make dev-cognito`
2. Open `http://localhost:3001/login`
3. Confirm Hosted UI authorize URL uses your real `COGNITO_DOMAIN` and `COGNITO_CLIENT_ID` (not placeholders).

## Phase 5.1 role/link smoke steps

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
