# Production Cognito bootstrap (first admin)

> **Temporary** — consolidate before final merge.

How to provision the **first production admin** (Felicia) without an in-app user-management UI. Prod Cognito is **not** in Terraform today.

## How roles work in this app

The backend reads roles from the Cognito access token claim **`cognito:groups`**, not from `custom:role` or other custom attributes.

Valid group names (case-sensitive, must match exactly):

| Group        | Access                    |
| ------------ | ------------------------- |
| `ADMIN`      | Admin portal (`/admin/*`) |
| `OPERATOR`   | Admin portal (`/admin/*`) |
| `WHOLESALER` | Portal only (`/portal/*`) |

If the user is in no matching group, the backend defaults the session role to **`OPERATOR`** (admin UI still allowed). For Felicia, assign **`ADMIN`** explicitly.

Authorization flow:

1. User signs in via Hosted UI (Google federated).
2. Frontend exchanges the OAuth code and calls backend `GET /api/users/me` with the **access token**.
3. Backend verifies JWT and maps `cognito:groups` → `roles`.
4. Session cookie stores `roles`; middleware gates `/admin` and `/portal`.

Database:

- **No manual `users` row** is required for login or read-only admin use.
- **`ensureUser`** upserts `users` on the first **write** API call (shows, payments, etc.).
- **No prod seed script** — `make dev-seed` / `seed-dev.ts` are local-only.
- Migrations already create a default **OWNER** account row (`Felicia`); linking that account to Felicia’s DB user is optional after her first write.

## Preferred production flow (Felicia)

```text
Google Account
  ↓
Cognito Hosted UI
  ↓
Google Identity Provider
  ↓
Federated Cognito user (auto-created on first sign-in)
  ↓
Operator adds user to ADMIN Cognito group
  ↓
Admin dashboard access (https://fefeave.com/admin)
```

---

## Setup steps

### A. Create production Cognito User Pool

1. AWS Console → **Cognito** → **Create user pool**.
2. Use a **new** pool for production (do **not** reuse the dev pool from `infra/cognito-dev.tf`).
3. Note **User pool ID** and **Region** (e.g. `us-west-2`) for Lambda env vars.

### B. Configure Google Identity Provider

1. In the prod pool → **Sign-in experience** / **Social and external providers** → add **Google**.
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/) (OAuth client, Web application).
3. Authorized redirect URI must include the Cognito IdP callback shown in the AWS console (format like `https://<your-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse`).
4. Copy Google **Client ID** and **Client secret** into the Cognito Google provider.
5. Attribute mapping: ensure **email** maps to `email` (used by `/users/me` and `ensureUser`).
6. Enable Google on the app client (step E) under **Supported identity providers**.

### C. Create Cognito groups

User pool → **Groups** → create exactly:

- `ADMIN`
- `OPERATOR`
- `WHOLESALER`

Group names must match the table above. Do **not** rely on `custom:role`.

### D. Configure Hosted UI

1. **App integration** → **Domain** → create Cognito Hosted UI domain (e.g. `fefeave-prod-<suffix>`).
2. Record the full domain for `COGNITO_DOMAIN` (no `https://`):  
   `your-domain.auth.us-west-2.amazoncognito.com`

### E. App client and URLs

Create (or edit) an app client:

| Setting            | Value                                   |
| ------------------ | --------------------------------------- |
| OAuth flow         | Authorization code grant                |
| Client secret      | Enabled                                 |
| Scopes             | `openid`, `email`, `profile`            |
| Identity providers | Cognito + **Google**                    |
| Callback URL(s)    | `https://fefeave.com/api/auth/callback` |
| Sign-out URL(s)    | `https://fefeave.com/login`             |

Must match `cognito_redirect_uri` / `cognito_logout_uri` in `infra/prod.tfvars`.

### F. First login (Felicia)

1. Deploy frontend/backend with Cognito env vars set (see [prod-release.md](prod-release.md)).
2. Felicia opens `https://fefeave.com/login` and chooses **Google**.
3. On first sign-in, Cognito **creates the federated user** automatically.
4. **Before or immediately after first login**, an operator adds that user to the **`ADMIN`** group:
   - Console: User pool → **Users** → select Felicia → **Add user to group** → `ADMIN`
   - CLI example:

```bash
POOL_ID="us-west-2_XXXXX"
USERNAME="felicia@example.com"   # or the Cognito username shown for the federated user

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$POOL_ID" \
  --username "$USERNAME" \
  --group-name ADMIN
```

5. Felicia signs out and signs in again (or wait for token refresh on next login) so the access token includes `cognito:groups`.
6. Verify session:
   - `GET https://fefeave.com/api/auth/health` → `authenticated: true`, `roles` includes `ADMIN`
   - Lands on `https://fefeave.com/admin/dashboard`
   - Protected admin routes load (not `/403`)

7. Optional: after one admin write (e.g. create a show), confirm DB sync:

```sql
SELECT id, cognito_user_id, email, role FROM users WHERE email = 'felicia@example.com';
```

---

## Environment variables (after pool exists)

| Variable                | Where                     | Notes                                   |
| ----------------------- | ------------------------- | --------------------------------------- |
| `COGNITO_DOMAIN`        | Frontend server Lambda    | Hosted UI domain, no `https://`         |
| `COGNITO_CLIENT_ID`     | Frontend + backend Lambda | App client ID                           |
| `COGNITO_CLIENT_SECRET` | Frontend server Lambda    | Server-side only                        |
| `COGNITO_REDIRECT_URI`  | Frontend Lambda           | `https://fefeave.com/api/auth/callback` |
| `COGNITO_LOGOUT_URI`    | Frontend Lambda           | `https://fefeave.com/login`             |
| `AUTH_SESSION_SECRET`   | Frontend server Lambda    | Long random secret                      |
| `COGNITO_REGION`        | Backend Lambda            | e.g. `us-west-2`                        |
| `COGNITO_USER_POOL_ID`  | Backend Lambda            | `us-west-2_xxxxx`                       |
| `COGNITO_APP_CLIENT_ID` | Backend Lambda            | Same client ID (JWT `client_id` check)  |
| `AUTH_MODE`             | Backend Lambda            | `cognito` (set in Terraform for prod)   |

Replace `REPLACE_ME` placeholders in `infra/prod.tfvars` / Lambda console after the pool is created.

---

## Launch checklist item

- [ ] **Create Felicia Google-backed Cognito admin account** — pool, Google IdP, groups, Hosted UI, app client URLs, first Google sign-in, add to `ADMIN` group, verify `/api/auth/health` and `/admin/dashboard`.

---

## Common mistakes

| Mistake                                | Symptom                          | Fix                                         |
| -------------------------------------- | -------------------------------- | ------------------------------------------- |
| Set `custom:role` only                 | Wrong or default `OPERATOR` role | Add user to **`ADMIN` group**               |
| User not in group before login         | `/403` or wrong landing route    | Add to `ADMIN`, sign in again               |
| Callback/sign-out URL mismatch         | `redirect_uri` error             | Match tfvars and app client exactly         |
| Backend `COGNITO_*` still `REPLACE_ME` | `/users/me` fails at login       | Update Lambda env from prod pool            |
| Expecting manual SQL user insert       | Unnecessary for launch           | Rely on login + `ensureUser` on first write |

---

## Related

- [prod-release.md](prod-release.md) — full prod release order
- [frontend/AUTH_SETUP.md](../../frontend/AUTH_SETUP.md) — local Cognito dev and auth debugging
- [lambda-phase3.md](lambda-phase3.md) — backend Lambda + Cognito env
