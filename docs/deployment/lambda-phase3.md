# Phase 3: Backend Lambda infrastructure (Terraform)

Backend-only Terraform for Fastify on Lambda + API Gateway HTTP API. **No apply in this phase doc** — operator runs plan/apply manually when ready.

> **Temporary:** Consolidate with [lambda-phase2.md](lambda-phase2.md), [prod-release.md](prod-release.md), and `infra/README.md` before final merge.

## What this provisions (`create_serverless_backend = true`)

| Resource                    | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `aws_lambda_function`       | Fastify handler `dist/lambda.handler`, zip from `backend/lambda.zip`   |
| `aws_apigatewayv2_api`      | HTTP API, routes `ANY /api` and `ANY /api/{proxy+}`                    |
| `aws_iam_role` (Lambda)     | Logs, Neon secret read, S3 attachments (same actions as ECS task role) |
| `aws_secretsmanager_secret` | **Container only** for Neon `DATABASE_URL` — no value in Terraform     |

**Not created:** VPC, NAT, ALB, ECS, ECR, RDS.

## Flags

| Variable                    | prod.tfvars | dev.tfvars        |
| --------------------------- | ----------- | ----------------- |
| `create_backend_infra`      | `false`     | `false`           |
| `create_rds`                | `false`     | `false`           |
| `create_serverless_backend` | `true`      | `false` (default) |

`create_backend_infra` and `create_serverless_backend` are mutually exclusive.

## Before `terraform plan` / `apply`

```bash
cd backend
npm run build:lambda
npm run package:lambda   # → backend/lambda.zip (gitignored)
```

```bash
# From repo root
make init
make plan-prod   # or plan-dev with -var create_serverless_backend=true for experiments
```

## After apply — required order (Neon secret + Lambda env)

Terraform creates the Secrets Manager secret **without** a value. Lambda has **no** native `--secrets` flag on `aws lambda update-function-configuration` (that CLI option does not exist). The working serverless pattern is:

1. Store the connection string in Secrets Manager (source of truth).
2. Inject it into Lambda as a normal **`DATABASE_URL` environment variable** (plaintext at rest in Lambda config, same as today in prod).

### 1. Populate the secret (Neon **pooler** URL only — never commit this string)

```bash
SECRET_ARN="$(terraform -chdir=infra output -raw neon_database_url_secret_arn)"
aws secretsmanager put-secret-value \
  --secret-id "$SECRET_ARN" \
  --secret-string 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require'
```

Use the **pooler** hostname for Lambda runtime. Use Neon **direct** host only for one-off migrations — see [neon-phase1.md](neon-phase1.md).

### 2. Inject `DATABASE_URL` into Lambda environment (no code change)

Read the secret, then merge `DATABASE_URL` into the function’s existing environment variables. **Do not** overwrite unrelated keys (`COGNITO_*`, `S3_ATTACHMENTS_BUCKET`, etc.).

```bash
FN="$(terraform -chdir=infra output -raw backend_lambda_function_name)"
SECRET_ARN="$(terraform -chdir=infra output -raw neon_database_url_secret_arn)"

DB_URL="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)"

# Fetch current env JSON, add DATABASE_URL, write back (requires jq)
CURRENT="$(aws lambda get-function-configuration --function-name "$FN" --query 'Environment.Variables' --output json)"
NEW_ENV="$(echo "$CURRENT" | jq --arg url "$DB_URL" '. + {DATABASE_URL: $url}')"

aws lambda update-function-configuration \
  --function-name "$FN" \
  --environment "Variables=${NEW_ENV}"
```

The Lambda execution role already has `secretsmanager:GetSecretValue` on this secret (`serverless-backend-iam.tf`) so operators (or a future sync script) can read it. **Application code reads `process.env.DATABASE_URL` only** — no runtime Secrets Manager call today.

### 3. Deploy Lambda code when the handler changes

Run **Backend Deploy (prod)** (`workflow_dispatch`) or locally:

```bash
cd backend && npm run package:lambda
aws lambda update-function-code --function-name fefeave-backend-prod --zip-file fileb://lambda.zip
```

Requires GitHub prod vars from `make gh-sync-prod` (`BACKEND_DEPLOY_ROLE_ARN`, `BACKEND_LAMBDA_FUNCTION_NAME`).

Until steps 1–2 complete, Lambda invocations fail env validation or DB connection.

## Cognito (prod)

Terraform sets non-secret `COGNITO_*` env vars on the backend Lambda. Create prod User Pool manually — roles use Cognito **groups** (`ADMIN`, `OPERATOR`, `WHOLESALER`) from `cognito:groups`, not `custom:role`. See [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md) and [prod-release.md](prod-release.md).

Frontend session/OAuth secrets (`AUTH_SESSION_SECRET`, `COGNITO_CLIENT_SECRET`) are **not** in Terraform — see [prod-secrets.md](prod-secrets.md).

## Outputs for Phase 4/5

| Output                                                           | Use                                   |
| ---------------------------------------------------------------- | ------------------------------------- |
| `backend_lambda_function_name`                                   | Deploy workflow target                |
| `backend_lambda_function_arn`                                    | IAM / monitoring                      |
| `backend_api_gateway_url`                                        | API base (`${url}api/health`)         |
| `neon_database_url_secret_arn` / `neon_database_url_secret_name` | Secret population, operator scripts   |
| `backend_lambda_execution_role_arn`                              | Auditing                              |
| `github_prod_backend_serverless_vars`                            | Suggested non-secret GitHub prod vars |

## Related

- [prod-secrets.md](prod-secrets.md) — all prod secrets, injection pattern, cleanup roadmap
- [lambda-phase2.md](lambda-phase2.md) — handler, env vars, packaging
- [neon-phase1.md](neon-phase1.md) — Postgres validation
- [prod-release.md](prod-release.md) — prod release checklist (serverless path)
