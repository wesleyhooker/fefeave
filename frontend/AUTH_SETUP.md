# Cognito Auth Setup (Phase 5.1 PR1)

Configure these environment variables in `frontend/.env.local`:

- `BACKEND_BASE_URL` (e.g. `http://localhost:3001/api`)
- `COGNITO_DOMAIN` (Hosted UI domain, without trailing slash)
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `COGNITO_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/callback`)
- `AUTH_SESSION_SECRET` (long random secret used to sign session cookies)

Notes:

- This flow uses Cognito Hosted UI Authorization Code exchange.
- Session is stored in `httpOnly` cookie (`fefeave_session`).
- No JWT is stored in `localStorage`.
- Protected routes are frontend-gated by middleware for `/admin/*` and `/portal/*`.
- Middleware reads roles from signed session data (no backend call in middleware).

## Local smoke test

1. Start backend and frontend:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`
2. Visit `/admin/dashboard` while signed out -> redirected to `/login`.
3. Complete Cognito login:
   - ADMIN/OPERATOR account redirects to `/admin/dashboard`
   - WHOLESALER account redirects to `/portal/statement`
4. Try opening a mismatched area:
   - WHOLESALER visiting `/admin/*` -> `/403`
   - ADMIN/OPERATOR visiting `/portal/*` -> `/403`
5. Click logout from admin/portal layout and confirm protected routes redirect to `/login`.

## Phase 5.1 smoke steps

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
