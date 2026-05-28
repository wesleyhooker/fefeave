# Production secrets handling (serverless)

Post-launch reference for how prod secrets are stored, injected, and rotated. **Never commit secret values** to git or Terraform state beyond what AWS already holds.

## Current production truth

| Layer                       | What it owns                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Terraform**               | Empty Secrets Manager **containers** (Neon + frontend session/OAuth), IAM for `GetSecretValue`, Lambda shell (memory, timeout, roles). Does **not** set secret values or day-to-day Lambda code. |
| **GitHub deploy workflows** | Lambda **deployment packages** (`update-function-code`) for backend and frontend server/image.                                                                                                   |
| **Operators**               | Secret **values** (`put-secret-value`), merging values into Lambda **env** (console, CLI, or optional `scripts/prod/sync-lambda-env-from-secrets.sh`).                                           |

**Source of truth for secret values:** AWS Secrets Manager (after operators populate containers).

**Runtime delivery:** Application code reads **`process.env` only** — no cold-start Secrets Manager fetch today.

**Lambda env stability:** Serverless Lambdas use `lifecycle { ignore_changes = [environment, filename, source_code_hash, ...] }` so a normal `terraform apply` does not strip live env vars or redeploy code. See [prod-release.md](prod-release.md).

## Current state (live prod)

| Secret                  | Storage (source of truth)                                                                            | Runtime consumption                                    | Set by                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Secrets Manager `fefeave-backend-prod-neon-database-url`                                             | Plain Lambda env var on `fefeave-backend-prod`         | Manual: `put-secret-value` + `get-secret-value` → `update-function-configuration`        |
| `COGNITO_CLIENT_SECRET` | SM `fefeave-frontend-prod-cognito-client-secret` (Terraform container; value via `put-secret-value`) | Plain Lambda env var on `fefeave-frontend-server-prod` | Operator: console, CLI merge, or optional `scripts/prod/sync-lambda-env-from-secrets.sh` |
| `AUTH_SESSION_SECRET`   | SM `fefeave-frontend-prod-auth-session-secret` (Terraform container; value via `put-secret-value`)   | Plain Lambda env var on `fefeave-frontend-server-prod` | Operator: console, CLI merge, or optional `scripts/prod/sync-lambda-env-from-secrets.sh` |

All three are **visible in Lambda configuration** to anyone with `lambda:GetFunctionConfiguration`. Secrets Manager for `DATABASE_URL` is the durable store; Lambda env is the runtime copy.

Non-secrets on the same Lambdas (`COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`, `BACKEND_BASE_URL`, etc.) are set via Terraform or deploy docs — see [opennext-phase5.md](opennext-phase5.md).

## Working injection pattern (all serverless secrets today)

There is **no** `aws lambda update-function-configuration --secrets` flag. Do **not** use the old Phase 3 doc step that referenced it.

1. **Write** value to Secrets Manager (`put-secret-value`) when rotating or backfilling a container.
2. **Read** when rotating: `aws secretsmanager get-secret-value --secret-id … --query SecretString --output text`
3. **Merge** into existing Lambda environment (preserve other keys):

```bash
FN="fefeave-frontend-server-prod"   # or fefeave-backend-prod
KEY="AUTH_SESSION_SECRET"           # or DATABASE_URL, COGNITO_CLIENT_SECRET
VALUE="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)"

CURRENT="$(aws lambda get-function-configuration --function-name "$FN" --query 'Environment.Variables' --output json)"
NEW_ENV="$(echo "$CURRENT" | jq --arg v "$VALUE" --arg k "$KEY" '. + {($k): $v}')"

aws lambda update-function-configuration \
  --function-name "$FN" \
  --environment "Variables=${NEW_ENV}"
```

4. **Verify** without printing secrets: check key presence only.

```bash
aws lambda get-function-configuration --function-name "$FN" \
  --query 'Environment.Variables | keys(@)'
```

Backend DB wiring details: [lambda-phase3.md](lambda-phase3.md). Cognito bootstrap: [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md).

## Future options (not required for stable prod)

| Option               | What                                                                                  | Risk                          | When to consider                                               |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| **Env sync from SM** | Operators use `scripts/prod/sync-lambda-env-from-secrets.sh` after `put-secret-value` | Low                           | Rotation or keeping SM and Lambda env aligned                  |
| **Runtime SM fetch** | App reads secret ARN at cold start; remove plaintext from Lambda env                  | Medium (code + IAM + latency) | Only if rotation without redeploying Lambda config is required |

**Not recommended:** storing secrets in GitHub Actions vars, `prod.tfvars`, or Terraform `environment` blocks.

## What is already in place (merged on main)

- Terraform SM containers for Neon `DATABASE_URL`, `AUTH_SESSION_SECRET`, and `COGNITO_CLIENT_SECRET` (values never in `.tf`).
- Frontend server Lambda IAM: `GetSecretValue` on frontend secret ARNs (for future runtime fetch; app still reads env today).
- Optional operator script: `scripts/prod/sync-lambda-env-from-secrets.sh` — not run in CI.
- Lambda lifecycle ignores env + deployment package drift — see [infra/README.md](../../infra/README.md).

**Operator checklist after populating or rotating a secret:**

1. `aws secretsmanager put-secret-value` (never commit strings).
2. Merge into Lambda env via sync script or manual CLI (preserve other keys).
3. Login smoke test (`/api/auth/health`, admin dashboard for frontend secrets).

## Validation plan

After any secret or env change:

1. **Backend:** `curl -sS "https://fefeave.com/api/health"` (or API Gateway URL) → `200`, DB connected.
2. **Frontend auth:** fresh logout/login → `[auth/callback] setCookieCount: 1`, `[auth/health] decision: ok`.
3. **Lambda env keys** (not values): confirm expected keys present via CLI `keys(@)` query.
4. **Secrets Manager:** confirm secret has a version; no secret strings in shell history logs committed to repo.
5. **Terraform plan:** if infra changed, plan must show only new SM resources / IAM — no accidental env var values in state.

## Blast radius / rollback

- **Wrong `DATABASE_URL` in Lambda env:** backend health fails; re-run merge with previous SM version (`get-secret-value` with `VersionStage=AWSPREVIOUS` if versioning enabled).
- **Wrong session secret:** all users logged out; restore previous `AUTH_SESSION_SECRET` in Lambda env.
- **Wrong Cognito client secret:** OAuth callback fails; restore from Cognito console app client.

## Related files

| Area                                 | Path                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Neon secret container                | `infra/secrets.tf`                                                                            |
| Backend Lambda env (non-secret)      | `infra/lambda-api.tf`                                                                         |
| Backend SM IAM                       | `infra/serverless-backend-iam.tf`                                                             |
| Frontend Lambda env comments         | `infra/frontend-opennext-lambda.tf`                                                           |
| Backend reads `DATABASE_URL`         | `backend/src/db/index.ts`                                                                     |
| Frontend reads session/OAuth secrets | `frontend/lib/auth/session-verify.node.ts`, `frontend/app/api/auth/callback/route.ts`         |
| Lambda env lifecycle (Terraform)     | `infra/lambda-api.tf`, `infra/frontend-opennext-lambda.tf` (`ignore_changes = [environment]`) |
| Frontend SM containers               | `infra/secrets.tf`                                                                            |
| Env sync script                      | `scripts/prod/sync-lambda-env-from-secrets.sh`                                                |
