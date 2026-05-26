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

| Resource                     | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| VPC, NAT, subnets            | Private networking for ECS                                               |
| ECR (backend + frontend)     | Container images for deploy workflows                                    |
| ALB (HTTP 80)                | Routes `/api/*` → backend ECS; default → frontend ECS                    |
| ECS Fargate                  | Backend API and Next.js frontend services                                |
| RDS (if `create_rds = true`) | Postgres; `DATABASE_URL` in Secrets Manager                              |
| OIDC roles                   | `backend_deploy_role_arn`, `frontend_deploy_role_arn` for GitHub Actions |

Opt-in by uncommenting the block at the bottom of `dev.tfvars` (and setting `alb_ingress_cidrs` for dev).

---

## 2. File layout

```text
infra/
├── main.tf                 # S3 site, CloudFront, attachments bucket, backend task IAM role
├── cognito-dev.tf          # Dev Cognito user pool (dev workspace only)
├── vpc.tf, ecr.tf, alb.tf, ecs.tf, rds.tf   # When create_backend_infra = true
├── backend-deploy-role.tf, frontend-deploy-role.tf
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

| Variable                    | Description                                                   | Default in code |
| --------------------------- | ------------------------------------------------------------- | --------------- |
| `create_backend_infra`      | VPC, ECR, ALB, ECS, deploy OIDC roles                         | `false`         |
| `create_rds`                | RDS + Secrets Manager `DATABASE_URL` (requires backend infra) | `false`         |
| `create_github_deploy_role` | OIDC provider data used by deploy roles when infra is on      | `true`          |

Committed tfvars (`dev.tfvars`, `prod.tfvars`) keep **`create_backend_infra = false`** unless you opt in.

---

## 5. Outputs

| Output                                                          | When set                                |
| --------------------------------------------------------------- | --------------------------------------- |
| `s3_bucket_name`, `cloudfront_distribution_id`                  | Always                                  |
| `attachments_bucket_name`, `backend_role_name`                  | Always                                  |
| `user_pool_id`, `app_client_id`, `cognito_domain`, …            | Dev workspace                           |
| `backend_*`, `frontend_*` (ECR, ECS, ALB URL, deploy role ARNs) | `create_backend_infra = true`           |
| `rds_endpoint`, `database_url_secret_arn`                       | `create_backend_infra` and `create_rds` |

---

## 6. Deployment paths (GitHub Actions)

**Local dev + CI only for dev.** Dev CD workflows (`*Deploy*dev*`, `Backend Migrate (dev)`) were removed. Production ECS deploy is **manual** (`workflow_dispatch`) only.

| Workflow                   | Trigger                         | Requires                                                                                              |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Backend CI**             | Push/PR (`backend/**`, etc.)    | Unit tests, lint, format (no AWS)                                                                     |
| **Frontend CI**            | Push/PR (`frontend/**`)         | `npm run build`, audit (no AWS)                                                                       |
| **Backend Deploy (prod)**  | Manual `workflow_dispatch` only | `create_backend_infra = true` in **prod** tfvars when ready; **prod** vars: `BACKEND_*`, `AWS_REGION` |
| **Frontend Deploy (prod)** | Manual `workflow_dispatch` only | Same in **prod** when ECS enabled; **prod** vars: `FRONTEND_*`, `AWS_REGION`                          |

**Prod tfvars:** `prod.tfvars` enables low-traffic ECS + RDS (`create_backend_infra = true`, `create_rds = true`). Cognito for prod is **not** in Terraform — see [docs/deployment/prod-release.md](../docs/deployment/prod-release.md). Prod deploy workflows need `make apply-prod`, `make gh-sync-prod`, manual Cognito/ECS auth env, then manual workflow dispatch.

With default tfvars, **ECS deploy workflows have nothing to deploy to** until you enable `create_backend_infra` and set GitHub environment variables from `terraform output`.

### `make gh-sync-dev` / `make gh-sync-prod`

- Always attempts to sync `S3_BUCKET`, `CF_DIST_ID`, and `AWS_REGION` from Terraform outputs.
- When `backend_deploy_role_arn` is non-null, also syncs backend ECS deploy vars (`BACKEND_*`).
- **`make gh-sync-prod`:** syncs `S3_BUCKET`, `CF_DIST_ID`, `AWS_REGION`, and when ECS is enabled all `BACKEND_*` and `FRONTEND_*` deploy vars from Terraform outputs. Cognito/session secrets are **not** synced (manual ECS / Secrets Manager).

---

## 7. GitHub environment variables

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

S3 and CloudFront outputs exist for future or manual static deploys; there is **no** automated “upload to S3” workflow in `.github/workflows/` today. Hosted app deploys use **ECS** when infra is enabled.

---

## 8. Troubleshooting

| Issue                            | Fix                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `terraform plan` fails           | Run `make init` after provider changes.                                                       |
| `make gh-sync-*` fails           | Install `gh` CLI and run `gh auth login`.                                                     |
| Deploy workflow missing env vars | Enable `create_backend_infra`, `make apply-dev`, `make output-dev`, set GitHub vars (see §7). |
| OIDC assume fails in Actions     | Confirm repo/branch in `variables.tf` match; role ARNs match Terraform outputs.               |
