# Production secrets handling (serverless)

Post-launch reference for how prod secrets are stored, injected, and rotated. **Never commit secret values** to git or Terraform state beyond what AWS already holds.

## Current state (live prod)

| Secret                  | Storage (source of truth)                                                           | Runtime consumption                                    | Set by                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Secrets Manager `fefeave-backend-prod-neon-database-url`                            | Plain Lambda env var on `fefeave-backend-prod`         | Manual: `put-secret-value` + `get-secret-value` → `update-function-configuration` |
| `COGNITO_CLIENT_SECRET` | SM `fefeave-frontend-prod-cognito-client-secret` (after apply + `put-secret-value`) | Plain Lambda env var on `fefeave-frontend-server-prod` | Manual console, CLI merge, or `scripts/prod/sync-lambda-env-from-secrets.sh`      |
| `AUTH_SESSION_SECRET`   | SM `fefeave-frontend-prod-auth-session-secret` (after apply + `put-secret-value`)   | Plain Lambda env var on `fefeave-frontend-server-prod` | Manual console, CLI merge, or `scripts/prod/sync-lambda-env-from-secrets.sh`      |

All three are **visible in Lambda configuration** to anyone with `lambda:GetFunctionConfiguration`. Secrets Manager for `DATABASE_URL` is the durable store; Lambda env is the runtime copy.

Non-secrets on the same Lambdas (`COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`, `BACKEND_BASE_URL`, etc.) are set via Terraform or deploy docs — see [opennext-phase5.md](opennext-phase5.md).

## Working injection pattern (all serverless secrets today)

There is **no** `aws lambda update-function-configuration --secrets` flag. Do **not** use the old Phase 3 doc step that referenced it.

1. **Write** value to Secrets Manager (`put-secret-value`) — or keep operator-only record until SM container exists.
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

## Cleanup options (smallest safe → largest change)

| Option                               | What                                                                                                 | Risk                                     | When                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| **A. Docs-only**                     | Fix deployment docs; document manual SM + env injection                                              | None                                     | **Now (Phase 1)**                             |
| **B. SM containers + env injection** | Terraform creates empty SM secrets for frontend; operators `put-secret-value`; same env merge script | Low (apply creates empty secrets only)   | Phase 2 after approval                        |
| **C. Runtime SM fetch**              | App reads ARN at cold start, caches in memory; remove plaintext from Lambda env                      | Medium (code + IAM + cold-start latency) | Only if rotation without redeploy is required |
| **D. Terraform containers only**     | Same as B — values always manual, never in `.tf`                                                     | Low                                      | Preferred infra step before C                 |

**Not recommended now:** storing secrets in GitHub Actions vars, `prod.tfvars`, or Terraform `environment` blocks.

## Recommended path

**Phase 1 (this doc): docs-only** — prod is stable; align docs with reality. No Terraform apply.

**Phase 2 (infra ready on branch `fix/terraform-lambda-env-stabilization`):**

- Terraform creates empty SM containers for `AUTH_SESSION_SECRET` and `COGNITO_CLIENT_SECRET` (no values in repo).
- Frontend server Lambda role has `secretsmanager:GetSecretValue` on those ARNs (for future runtime fetch; app still reads env today).
- Operator script: `scripts/prod/sync-lambda-env-from-secrets.sh` — not run in CI.
- Lambda `lifecycle { ignore_changes = [environment] }` on all serverless functions so `terraform apply` cannot strip live env vars.

**After apply (operator, one-time per secret):**

1. `aws secretsmanager put-secret-value` — copy live values into SM (never commit strings).
2. Run sync script or manual env merge (see script `--help`).
3. Login smoke test before any runtime SM fetch code change.

**Do not** change application code or remove existing Lambda env until smoke test passes.

**Phase 3 (defer):** runtime fetch (option C) only if you need automatic rotation without redeploying Lambda config.

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
