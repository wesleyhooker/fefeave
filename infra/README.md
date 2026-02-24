# Fefeave Infrastructure

Terraform-managed AWS resources: frontend static hosting (S3, CloudFront, OIDC); optional backend (VPC, ECR, ALB, ECS Fargate, RDS) for DEV.

---

## 1. Overview

**Frontend (always):** S3 bucket, CloudFront distribution, GitHub OIDC deploy role, attachments S3 bucket, backend task IAM role.

**Backend (when `create_backend_infra = true`, e.g. DEV):** VPC, ECR repo, ALB (HTTP 80), ECS Fargate cluster/service, optional RDS Postgres with Secrets Manager for `DATABASE_URL`, and a separate GitHub OIDC role for backend deploy (ECR push + ECS update).

| Resource                 | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| S3 bucket                | Static site hosting (Angular build output)                |
| CloudFront               | CDN, HTTPS, SPA fallback                                  |
| IAM OIDC role (frontend) | GitHub Actions deploy without long-lived secrets          |
| ECR                      | Backend container images (scan on push)                   |
| ALB + target group       | HTTP 80 → ECS backend                                     |
| ECS Fargate              | Backend API (Fastify)                                     |
| RDS Postgres             | DEV database; `DATABASE_URL` in Secrets Manager           |
| IAM OIDC role (backend)  | GitHub Actions backend deploy: ECR push + ECS update only |

Workspaces: `dev`, `prod`. Region: `us-west-2`.

---

## 2. File Layout

```text
infra/
├── main.tf      # S3, CloudFront, attachments bucket, GitHub OIDC, backend task role
├── vpc.tf       # VPC, subnets, IGW, NAT (backend only)
├── ecr.tf       # ECR repository for backend images
├── alb.tf       # ALB, target group, listener, ALB SG
├── ecs.tf       # ECS cluster, task execution role, task def, service, ECS SG
├── rds.tf                # RDS Postgres, Secrets Manager DATABASE_URL (optional)
├── backend-deploy-role.tf # GitHub OIDC role for backend deploy (ECR + ECS)
├── providers.tf          # AWS + random providers
├── variables.tf # Input variables
├── outputs.tf   # S3, CF, role ARN; backend_api_base_url, backend_ecr_repo_url, rds_endpoint
├── dev.tfvars   # Dev (create_backend_infra = true, create_rds = true)
└── prod.tfvars  # Prod (frontend only by default)
```

---

## 3. Local Usage

Run from **repo root** via Make:

| Target                                   | Purpose                                            |
| ---------------------------------------- | -------------------------------------------------- |
| `make init`                              | Terraform init                                     |
| `make plan-dev`                          | Plan dev                                           |
| `make apply-dev`                         | Apply dev                                          |
| `make plan-prod`                         | Plan prod                                          |
| `make apply-prod`                        | Apply prod                                         |
| `make output-dev` / `make output-prod`   | Show outputs                                       |
| `make gh-sync-dev` / `make gh-sync-prod` | Sync outputs → GitHub env vars (requires `gh` CLI) |

---

## 4. Variables

| Variable                    | Description                                    | Default                |
| --------------------------- | ---------------------------------------------- | ---------------------- |
| `project_name`              | Base name for resources                        | `fefeave-frontend`     |
| `env`                       | Environment (`dev`, `prod`)                    | —                      |
| `aws_region`                | AWS region                                     | `us-west-2`            |
| `github_repo`               | Repo for OIDC trust                            | `wesleyhooker/fefeave` |
| `github_branch`             | Branch for OIDC trust                          | `main`                 |
| `create_github_deploy_role` | Create IAM OIDC role                           | `true`                 |
| `create_backend_infra`      | Create VPC, ECR, ALB, ECS (and optionally RDS) | `false`                |
| `backend_image_tag`         | Backend Docker image tag for task definition   | `latest`               |
| `backend_desired_count`     | ECS service desired count                      | `1`                    |
| `vpc_cidr`                  | CIDR for backend VPC                           | `10.0.0.0/16`          |
| `create_rds`                | Create RDS Postgres + Secrets Manager secret   | `false`                |
| `db_name`                   | Postgres database name                         | `fefeave`              |
| `db_username`               | Postgres master username                       | `fefeave`              |

Values come from `dev.tfvars` and `prod.tfvars`. DEV enables backend + RDS; prod leaves them disabled unless overridden.

---

## 5. Outputs

| Output                       | Use                                                       |
| ---------------------------- | --------------------------------------------------------- |
| `s3_bucket_name`             | Upload target for GitHub Actions                          |
| `cloudfront_distribution_id` | Invalidation target                                       |
| `github_actions_role_arn`    | OIDC assume-role ARN for Actions                          |
| `attachments_bucket_name`    | S3 bucket for backend attachments                         |
| `backend_api_base_url`       | Backend API base URL (ALB DNS; use `http://<this>/api`)   |
| `backend_ecr_repo_url`       | ECR repository URL for backend images (CI push target)    |
| `backend_ecs_cluster_name`   | ECS cluster name (for GitHub Actions / CLI)               |
| `backend_ecs_service_name`   | ECS service name (for GitHub Actions / CLI)               |
| `backend_deploy_role_arn`    | OIDC role ARN for GitHub Actions backend deploy           |
| `rds_endpoint`               | RDS endpoint (when RDS created)                           |
| `database_url_secret_arn`    | Secrets Manager ARN for `DATABASE_URL` (used by ECS task) |

---

## 6. Workflow

1. **First time:** `make init` → `make plan-dev` → `make apply-dev`
2. **Sync to GitHub:** `make gh-sync-dev` (writes **frontend** env vars for Actions).
3. **Backend deploy (dev):** For workflow `Backend Deploy (dev)` set GitHub environment **dev** variables from Terraform outputs (see **DEV vars** below). Dev auto-deploys on push to `main` (backend/infra paths); also runnable via `workflow_dispatch`.
4. **Prod:** `make plan-prod` → `make apply-prod` → `make gh-sync-prod`. **PROD deploy is manual only** — backend is deployed only via the `Backend Deploy (prod)` workflow (Actions → Run workflow). No push triggers.

---

## 7. GitHub environment variables

**DEV (backend deploy)** — set in GitHub environment **dev** (from Terraform outputs when `create_backend_infra = true`):

| Variable                  | Source / use                             |
| ------------------------- | ---------------------------------------- |
| `BACKEND_DEPLOY_ROLE_ARN` | OIDC role for ECR push + ECS update      |
| `AWS_REGION`              | e.g. `us-west-2`                         |
| `BACKEND_ECR_REPO_URL`    | ECR repository URL (push target)         |
| `BACKEND_ECS_CLUSTER`     | ECS cluster name                         |
| `BACKEND_ECS_SERVICE`     | ECS service name                         |
| `BACKEND_API_BASE_URL`    | Backend API base URL (e.g. `http://...`) |

**PROD (backend deploy)** — set in GitHub environment **prod** when backend infra is enabled in prod (same names as above, from prod Terraform outputs). Used only by the manual `Backend Deploy (prod)` workflow.

---

## 8. Troubleshooting

| Issue                        | Fix                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `terraform plan` fails       | Run `make init` after provider changes.                                                                                         |
| `make gh-sync-*` fails       | Install `gh` CLI and run `gh auth login`.                                                                                       |
| OIDC assume fails in Actions | Confirm GitHub env vars (`S3_BUCKET`, `CF_DIST_ID`, `AWS_ROLE_ARN`, `AWS_REGION`) are set; repo/branch in `variables.tf` match. |
