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

## After apply — required order (secret + Lambda wiring)

Terraform creates the Secrets Manager secret **without** a value and does **not** map it to Lambda (AWS provider has no `secrets` block on `aws_lambda_function`). Complete these steps after apply:

1. **Populate the secret** (Neon **pooler** URL only — never commit this string):

```bash
SECRET_ARN="$(terraform -chdir=infra output -raw neon_database_url_secret_arn)"
aws secretsmanager put-secret-value \
  --secret-id "$SECRET_ARN" \
  --secret-string 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require'
```

2. **Attach the secret to Lambda as `DATABASE_URL`** (runtime injection; no code change):

```bash
FN="$(terraform -chdir=infra output -raw backend_lambda_function_name)"
aws lambda update-function-configuration \
  --function-name "$FN" \
  --secrets "[{\"EnvironmentVariableName\":\"DATABASE_URL\",\"SecretArn\":\"$SECRET_ARN\"}]"
```

3. **Deploy Lambda code** when the handler changes: run **Backend Deploy (prod)** (`workflow_dispatch`) or locally:

```bash
cd backend && npm run package:lambda
aws lambda update-function-code --function-name fefeave-backend-prod --zip-file fileb://lambda.zip
```

Requires GitHub prod vars from `make gh-sync-prod` (`BACKEND_DEPLOY_ROLE_ARN`, `BACKEND_LAMBDA_FUNCTION_NAME`).

Until steps 1–2 complete, Lambda invocations fail env validation or DB connection.

Migrations: run against Neon **direct** host (`npm run migrate:up`), not the pooler — see [neon-phase1.md](neon-phase1.md).

## Cognito (prod)

Terraform sets placeholder `COGNITO_*` env vars on Lambda. Create prod User Pool manually (see [prod-release.md](prod-release.md)), then update Lambda environment or `prod.tfvars` and re-apply.

## Outputs for Phase 4/5

| Output                                                           | Use                                   |
| ---------------------------------------------------------------- | ------------------------------------- |
| `backend_lambda_function_name`                                   | Deploy workflow target                |
| `backend_lambda_function_arn`                                    | IAM / monitoring                      |
| `backend_api_gateway_url`                                        | API base (`${url}api/health`)         |
| `neon_database_url_secret_arn` / `neon_database_url_secret_name` | Secret population, GH vars            |
| `backend_lambda_execution_role_arn`                              | Auditing                              |
| `github_prod_backend_serverless_vars`                            | Suggested non-secret GitHub prod vars |

## Related

- [lambda-phase2.md](lambda-phase2.md) — handler, env vars, packaging
- [neon-phase1.md](neon-phase1.md) — Postgres validation
- [prod-release.md](prod-release.md) — prod release checklist (serverless path)
