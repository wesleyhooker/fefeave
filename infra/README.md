# Fefeave Infrastructure

Terraform-managed AWS resources for FefeAve. **Day-to-day development is local** (`make dev`, Docker Postgres). This stack is for shared AWS resources and optional hosted runtime.

Workspaces: `dev`, `prod`. Region: `us-west-2`.

---

## 1. Overview

### Local-first (default)

`infra/dev.tfvars` and `infra/prod.tfvars` both set:

```hcl
create_backend_infra = false
create_rds           = false
```

With that configuration, Terraform provisions **low-cost shared resources only** (no VPC, NAT, ALB, ECS, or RDS). You run the API and UI on your machine.

### Always provisioned (both workspaces, current tfvars)

| Resource                     | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| S3 site bucket               | Static asset origin (CloudFront OAC)                                       |
| CloudFront                   | CDN, HTTPS, SPA fallback for static site bucket                            |
| S3 attachments bucket        | Backend payout evidence (presigned access; not public)                     |
| IAM task role (`backend`)    | Lets the API access the attachments bucket when `ATTACHMENTS_*` env is set |
| Cognito (dev workspace only) | Dev user pool, app client, Hosted UI domain (`cognito-dev.tf`)             |

### Optional: hosted runtime (`create_backend_infra = true`)

When enabled in `*.tfvars`, Terraform also creates:

| Resource                     | Purpose                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| VPC, NAT, subnets            | Private networking for ECS                                                                          |
| ECR (backend + frontend)     | Container images for deploy workflows                                                               |
| ALB (HTTP 80)                | Routes `/api/*` → backend ECS; default → frontend ECS                                               |
| ECS Fargate                  | Backend API and Next.js frontend services                                                           |
| RDS (if `create_rds = true`) | Postgres; `DATABASE_URL` in Secrets Manager                                                         |
| OIDC roles                   | `backend_deploy_role_arn`, `frontend_deploy_role_arn` for GitHub Actions (Lambda or ECS per tfvars) |

Opt-in by uncommenting the block at the bottom of `dev.tfvars` (and setting `alb_ingress_cidrs` for dev).

### Serverless backend (`create_serverless_backend = true`)

When enabled (prod `prod.tfvars`):

| Resource             | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| Lambda + log group   | Fastify API (`dist/lambda.handler`, `backend/lambda.zip`)        |
| API Gateway HTTP API | Public `/api/*` routes                                           |
| Secrets Manager      | Neon `DATABASE_URL` secret **container** (value set after apply) |
| Lambda IAM role      | CloudWatch logs, secret read, S3 attachments                     |

No VPC, NAT, ALB, ECS, ECR, or RDS.

### Serverless frontend (`create_serverless_frontend = true`)

When enabled (prod `prod.tfvars`; requires `create_serverless_backend = true`):

| Resource                  | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| Lambda (server)           | OpenNext SSR, middleware, `/api/*` proxy                             |
| Lambda (image)            | `next/image` optimizer                                               |
| CloudFront (multi-origin) | S3 `/_assets`, server Lambda URL, image Lambda URL                   |
| OIDC deploy role          | GitHub Actions: S3 sync, Lambda code update, CloudFront invalidation |

**Not created:** DynamoDB, SQS, warmer/EventBridge, ECS, ECR, NAT, ALB, RDS.

Domain defaults to **fefeave.com** (Cognito URLs in tfvars). DNS is **Cloudflare**; ACM in us-east-1 is required for CloudFront custom domain. Route53 zone (`route53_zone_id`) is optional and unused for current launch — see [docs/deployment/route53-acm-cutover.md](../docs/deployment/route53-acm-cutover.md).

Before plan/apply: `cd frontend && npm run build:opennext && npm run package:opennext` (produces `opennext-server.zip`, `opennext-image.zip`). OpenNext uses `tagCache: dummy` and `queue: dummy` (no DynamoDB/SQS).

---

## 2. File layout

```text
infra/
├── main.tf                 # S3 site, CloudFront, attachments bucket, backend task IAM role
├── cognito-dev.tf          # Dev Cognito user pool (dev workspace only)
├── vpc.tf, ecr.tf, alb.tf, ecs.tf, rds.tf   # When create_backend_infra = true
├── lambda-api.tf, apigateway.tf, secrets.tf, serverless-backend-iam.tf  # When create_serverless_backend = true
├── frontend-opennext-lambda.tf, cloudfront-opennext.tf, route53-acm.tf, frontend-serverless-deploy-role.tf  # When create_serverless_frontend = true
├── monitoring.tf, budgets.tf               # When enable_cost_alerts && env == prod
├── secrets.tf                              # SM containers (Neon + frontend session/OAuth)
├── backend-deploy-role.tf, backend-serverless-deploy-role.tf, frontend-deploy-role.tf
├── providers.tf, variables.tf, outputs.tf
├── dev.tfvars              # Default: create_backend_infra = false
└── prod.tfvars             # Default: create_backend_infra = false
```

---

## 3. Local usage (Terraform)

Run from **repo root**:

| Target                                   | Purpose                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| `make init`                              | Terraform init                                              |
| `make plan-dev` / `make apply-dev`       | Plan/apply dev workspace                                    |
| `make plan-prod` / `make apply-prod`     | Plan/apply prod workspace                                   |
| `make output-dev` / `make output-prod`   | Show outputs                                                |
| `make gh-sync-dev` / `make gh-sync-prod` | Sync some outputs → GitHub environment variables (`gh` CLI) |

Application development does **not** require `terraform apply` with the default tfvars.

---

## 4. Variables (selected)

| Variable                                  | Description                                                               | Default in code                   |
| ----------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| `create_backend_infra`                    | VPC, ECR, ALB, ECS, deploy OIDC roles                                     | `false`                           |
| `create_serverless_backend`               | Lambda, API Gateway HTTP API, Neon secret container                       | `false`                           |
| `create_serverless_frontend`              | OpenNext Lambdas + multi-origin CloudFront (requires serverless backend)  | `false`                           |
| `enable_frontend_custom_domain`           | ACM cert + CloudFront aliases (us-east-1 ACM); DNS in Cloudflare manually | `false`                           |
| `frontend_domain` / `frontend_www_domain` | Production apex + optional www alias (Cognito URLs)                       | `fefeave.com` / `www.fefeave.com` |
| `create_rds`                              | RDS + Secrets Manager `DATABASE_URL` (requires backend infra)             | `false`                           |
| `create_github_deploy_role`               | OIDC provider data used by deploy roles when infra is on                  | `true`                            |
| `enable_cost_alerts`                      | AWS Budget + CloudWatch alarms (prod workspace only)                      | `false`                           |
| `alert_email`                             | Email for budget and SNS alarm notifications                              | `""`                              |
| `monthly_budget_usd`                      | Monthly AWS account cost budget (USD)                                     | `20`                              |

`create_backend_infra` and `create_serverless_backend` are **mutually exclusive**.

Committed tfvars: **dev** keeps all backend flags `false` (local-first). **prod** uses `create_serverless_backend = true` and `create_serverless_frontend = true` (see `prod.tfvars`). See [docs/deployment/lambda-phase3.md](../docs/deployment/lambda-phase3.md) and [opennext-phase5.md](../docs/deployment/opennext-phase5.md).

---

## 5. Outputs

| Output                                                                                                                  | When set                                |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `s3_bucket_name`, `cloudfront_distribution_id`                                                                          | Always                                  |
| `attachments_bucket_name`, `backend_role_name`                                                                          | Always                                  |
| `user_pool_id`, `app_client_id`, `cognito_domain`, …                                                                    | Dev workspace                           |
| `backend_*`, `frontend_*` (ECR, ECS, ALB URL, deploy role ARNs)                                                         | `create_backend_infra = true`           |
| `rds_endpoint`, `database_url_secret_arn`                                                                               | `create_backend_infra` and `create_rds` |
| `backend_lambda_*`, `backend_api_gateway_url`, `neon_database_url_secret_*`, `github_prod_backend_serverless_vars`      | `create_serverless_backend`             |
| `frontend_server_lambda_name`, `frontend_image_lambda_name`, `frontend_app_url`, `github_prod_frontend_serverless_vars` | `create_serverless_frontend`            |
| `alerts_sns_topic_arn`, `monthly_budget_limit_usd`, `monitoring_alarm_names`                                            | `enable_cost_alerts && env == prod`     |

---

## 5b. Monitoring (prod guardrails)

When `enable_cost_alerts = true` in **prod** workspace (`prod.tfvars`):

| Resource                        | Purpose                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| AWS Budget                      | Account-wide **$20/mo** limit; 80% forecast + 100% actual email alerts                                          |
| SNS topic `fefeave-alerts-prod` | Fan-out for CloudWatch alarms                                                                                   |
| CloudWatch alarms               | Backend Lambda **Errors**, frontend server Lambda **Errors**, backend Lambda **Throttles**, API Gateway **5xx** |

**Not created:** frontend image Lambda alarm, duration alarms, CloudFront alarms, log metric filters.

After apply, confirm the **SNS email subscription** (AWS sends a confirmation link). Budget covers the whole AWS account (dev + prod); Neon and Cloudflare are external.

See [prod-release.md](../docs/deployment/prod-release.md) for post-apply verification.

### Lambda ownership (serverless prod)

| Concern             | Owner          | Mechanism                                                                                                                                                                              |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Function shell      | Terraform      | IAM, memory, timeout, log groups, API Gateway, CloudFront                                                                                                                              |
| Deployment package  | GitHub Actions | `aws lambda update-function-code` ([backend-deploy-prod.yml](../.github/workflows/backend-deploy-prod.yml), [frontend-deploy-prod.yml](../.github/workflows/frontend-deploy-prod.yml)) |
| Runtime env secrets | Operator       | CLI / `scripts/prod/sync-lambda-env-from-secrets.sh`                                                                                                                                   |

Lambdas use `lifecycle { ignore_changes = [environment, filename, source_code_hash, s3_bucket, s3_key] }` so `terraform apply` does not redeploy code or strip secrets. Local `lambda.zip` / OpenNext zips are only needed for **initial** create; day-to-day code updates go through deploy workflows.

---

## 6. Deployment paths (GitHub Actions)

**Local dev + CI only for dev.** Dev CD workflows (`*Deploy*dev*`, `Backend Migrate (dev)`) were removed. Production ECS deploy is **manual** (`workflow_dispatch`) only.

| Workflow                   | Trigger                         | Requires                                                                                                                     |
| -------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Backend CI**             | Push/PR (`backend/**`, etc.)    | Unit tests, lint, format (no AWS)                                                                                            |
| **Frontend CI**            | Push/PR (`frontend/**`)         | `npm run build`, audit (no AWS)                                                                                              |
| **Backend Deploy (prod)**  | Manual `workflow_dispatch` only | `create_backend_infra = true` in **prod** tfvars when ready; **prod** vars: `BACKEND_*`, `AWS_REGION`                        |
| **Frontend Deploy (prod)** | Manual `workflow_dispatch` only | OpenNext path when `create_serverless_frontend = true`; **prod** vars: `FRONTEND_*`, `S3_BUCKET`, `CF_DIST_ID`, `AWS_REGION` |

**Prod tfvars:** `prod.tfvars` enables serverless backend + frontend (`create_serverless_backend = true`, `create_serverless_frontend = true`; ECS/RDS off). Package `backend/lambda.zip` and frontend OpenNext zips before plan/apply. Cognito for prod is **not** in Terraform — see [cognito-prod-bootstrap.md](../docs/deployment/cognito-prod-bootstrap.md), [prod-release.md](../docs/deployment/prod-release.md), [opennext-phase5.md](../docs/deployment/opennext-phase5.md), and [lambda-phase3.md](../docs/deployment/lambda-phase3.md).

**ECS path (legacy):** opt in via `create_backend_infra = true` in tfvars; mutually exclusive with serverless.

### `make gh-sync-dev` / `make gh-sync-prod`

- Always attempts to sync `S3_BUCKET`, `CF_DIST_ID`, and `AWS_REGION` from Terraform outputs.
- When `backend_deploy_role_arn` is non-null, syncs serverless backend vars (`BACKEND_LAMBDA_FUNCTION_NAME`, `BACKEND_API_GATEWAY_URL`) or legacy ECS vars (`BACKEND_ECR_*`, `BACKEND_ECS_*`).
- **`make gh-sync-prod`:** syncs `S3_BUCKET`, `CF_DIST_ID`, `AWS_REGION`. When serverless frontend is enabled, also syncs OpenNext deploy vars (`FRONTEND_DEPLOY_ROLE_ARN`, `FRONTEND_*_LAMBDA_NAME`, `BACKEND_BASE_URL`, Cognito URLs). When ECS is enabled, syncs `BACKEND_*` / legacy `FRONTEND_*` ECR/ECS vars. Cognito/session **secrets** are **not** synced (manual Lambda env / Secrets Manager).

---

## 7. GitHub environment variables

### When `create_serverless_backend = true` (backend deploy)

| Variable                       | Source                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `BACKEND_DEPLOY_ROLE_ARN`      | `backend_deploy_role_arn`                                   |
| `BACKEND_LAMBDA_FUNCTION_NAME` | `backend_lambda_function_name`                              |
| `BACKEND_API_GATEWAY_URL`      | `backend_api_gateway_url` (optional; workflow health check) |
| `AWS_REGION`                   | e.g. `us-west-2`                                            |

Workflow: [Backend Deploy (prod)](../.github/workflows/backend-deploy-prod.yml) — packages `lambda.zip` and runs `aws lambda update-function-code` (no ECS/ECR).

### When `create_backend_infra = true` (backend deploy)

| Variable                  | Source                     |
| ------------------------- | -------------------------- |
| `BACKEND_DEPLOY_ROLE_ARN` | `backend_deploy_role_arn`  |
| `BACKEND_ECR_REPO_URL`    | `backend_ecr_repo_url`     |
| `BACKEND_ECS_CLUSTER`     | `backend_ecs_cluster_name` |
| `BACKEND_ECS_SERVICE`     | `backend_ecs_service_name` |
| `BACKEND_API_BASE_URL`    | `backend_api_base_url`     |
| `AWS_REGION`              | e.g. `us-west-2`           |

### When `create_backend_infra = true` (frontend deploy)

| Variable                   | Source                      |
| -------------------------- | --------------------------- |
| `FRONTEND_DEPLOY_ROLE_ARN` | `frontend_deploy_role_arn`  |
| `FRONTEND_ECR_REPO_URL`    | `frontend_ecr_repo_url`     |
| `FRONTEND_ECS_CLUSTER`     | `frontend_ecs_cluster_name` |
| `FRONTEND_ECS_SERVICE`     | `frontend_ecs_service_name` |
| `AWS_REGION`               | e.g. `us-west-2`            |

### Static site outputs (always)

S3 and CloudFront outputs exist for static assets. **OpenNext prod deploy** (`frontend-deploy-prod.yml`) syncs `/_assets` to S3, updates frontend Lambdas, and invalidates CloudFront when `create_serverless_frontend = true`. Legacy **ECS** deploy remains available when `create_backend_infra = true`.

---

## 8. Troubleshooting

| Issue                            | Fix                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `terraform plan` fails           | Run `make init` after provider changes.                                                       |
| `make gh-sync-*` fails           | Install `gh` CLI and run `gh auth login`.                                                     |
| Deploy workflow missing env vars | Enable `create_backend_infra`, `make apply-dev`, `make output-dev`, set GitHub vars (see §7). |
| OIDC assume fails in Actions     | Confirm repo/branch in `variables.tf` match; role ARNs match Terraform outputs.               |
