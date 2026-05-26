# Production release (low-traffic full app)

Manual path to run Felicia’s full app on AWS: public homepage, admin login (Cognito), ledger API, Postgres (RDS), ECS behind ALB. **No automated prod deploy on merge** — only `workflow_dispatch` workflows.

Local development stays unchanged (`make dev`, `create_backend_infra = false` in `infra/dev.tfvars`).

---

## What Terraform provisions

### With current `infra/prod.tfvars` (`create_backend_infra = true`, `create_rds = true`)

| Layer              | Resources                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Always (unchanged) | S3 site bucket, CloudFront, attachments S3, backend ECS **task role** (S3 attachments)                             |
| Networking         | VPC, IGW, 2 AZ public/private subnets, **single NAT** + EIP                                                        |
| Compute            | ECR `fefeave-backend-prod`, `fefeave-frontend-prod`; ECS cluster; Fargate services (desired count **1** each)      |
| Load balancing     | Internet ALB HTTP :80 — `/api/*` → backend, default → frontend                                                     |
| Data               | RDS Postgres 16 **`db.t3.micro`**, 20 GiB; `DATABASE_URL` in Secrets Manager                                       |
| CI/CD IAM          | OIDC roles `fefeave-backend-deploy-prod`, `fefeave-frontend-deploy-prod` (when `create_github_deploy_role = true`) |

### Not provisioned by Terraform (prod gap)

- **Cognito User Pool** — `infra/cognito-dev.tf` runs only when `env == "dev"`. Prod needs a **manual** pool (AWS Console) or a future `cognito-prod.tf`.
- **Auth env on ECS tasks** — Terraform sets `AUTH_MODE=cognito` on the backend task, but **does not** inject `COGNITO_*`, `AUTH_SESSION_SECRET`, or frontend OAuth vars. Set these on ECS task definitions (console, CLI, or extended Terraform) before auth works.
- **HTTPS / custom domain** — ALB is HTTP only; add ACM + listener 443 separately if needed.
- **DB migrations workflow** — no `Backend Migrate (prod)` workflow; run migrations manually (see below).

### What prod used to create (`create_backend_infra = false`)

S3 + CloudFront + attachments bucket + backend task IAM role only — **no** VPC, NAT, ALB, ECS, RDS, or deploy OIDC roles.

---

## Cognito (manual setup)

Create a **production** User Pool (do not reuse the dev pool from `cognito-dev.tf`).

1. User pool with Hosted UI domain (e.g. `fefeave-prod-<suffix>`).
2. App client: OAuth **authorization code**, secret enabled, scopes `openid`, `email`, `profile`.
3. Callback URL: `http://<ALB_DNS>/api/auth/callback` (replace with HTTPS URL when you add TLS).
4. Sign-out URL: `http://<ALB_DNS>/login`.
5. Create admin users and set `custom:role` (or your pool’s role claim) to `ADMIN` per [frontend/AUTH_SETUP.md](../../frontend/AUTH_SETUP.md).

Record for GitHub **secrets** / ECS task env (not Terraform outputs today):

| Name                    | Used by            | Notes                                                          |
| ----------------------- | ------------------ | -------------------------------------------------------------- |
| `COGNITO_DOMAIN`        | Frontend           | `your-domain.auth.us-west-2.amazoncognito.com` (no `https://`) |
| `COGNITO_CLIENT_ID`     | Frontend + backend | App client ID                                                  |
| `COGNITO_CLIENT_SECRET` | Frontend           | Server-side only                                               |
| `COGNITO_REDIRECT_URI`  | Frontend           | Must match callback URL exactly                                |
| `COGNITO_LOGOUT_URI`    | Frontend           | Must match sign-out URL exactly                                |
| `AUTH_SESSION_SECRET`   | Frontend           | Long random HMAC secret                                        |
| `COGNITO_REGION`        | Backend            | e.g. `us-west-2`                                               |
| `COGNITO_USER_POOL_ID`  | Backend            | `us-west-2_xxxxx`                                              |
| `COGNITO_APP_CLIENT_ID` | Backend            | Same client ID (JWT audience)                                  |

Frontend also needs:

| Name                      | Example                                |
| ------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | `/api` (already in task def via tfvar) |
| `BACKEND_BASE_URL`        | `http://<ALB_DNS>/api`                 |

Optional stub for a future Terraform module — **not applied today**:

```hcl
# infra/cognito-prod.tf (future)
# resource "aws_cognito_user_pool" "prod" { ... count = var.env == "prod" ? 1 : 0 }
```

---

## Terraform plan / apply order (instructions only)

**Do not run `terraform apply` from CI.** An operator runs locally with credentials for the prod account.

```bash
# From repo root
make init
make plan-prod          # workspace prod + prod.tfvars
# Review plan: expect large create if upgrading from static-only prod
make apply-prod         # ONLY when ready — not required for this doc PR
make output-prod
make gh-sync-prod       # Syncs deploy vars when create_backend_infra=true (requires gh CLI)
```

Validate without apply:

```bash
terraform -chdir=infra workspace select prod
terraform -chdir=infra plan -var-file=prod.tfvars
```

**Suggested apply order (when you apply):** single `terraform apply` — dependencies are ordered inside Terraform (VPC → RDS secret → ECS). After apply:

1. Confirm ALB DNS: `terraform -chdir=infra output -raw frontend_app_base_url`
2. Configure Cognito callback/logout URLs to that host.
3. Update ECS task definitions with Cognito + `BACKEND_BASE_URL` env (if not done via console).
4. Run DB migrations (below).
5. Deploy backend image, then frontend (workflows).

**Rollback (infra):** revert `prod.tfvars` flags and `terraform apply` to destroy ECS/RDS/NAT (data loss on RDS unless you snapshot first). **Rollback (app):** redeploy a previous immutable ECR tag via the same deploy workflows.

---

## GitHub environment `prod` — variables and secrets

### From Terraform (`make gh-sync-prod` when ECS enabled)

| GitHub variable            | Terraform output             |
| -------------------------- | ---------------------------- |
| `AWS_REGION`               | `us-west-2` (from Makefile)  |
| `S3_BUCKET`                | `s3_bucket_name`             |
| `CF_DIST_ID`               | `cloudfront_distribution_id` |
| `BACKEND_DEPLOY_ROLE_ARN`  | `backend_deploy_role_arn`    |
| `BACKEND_ECR_REPO_URL`     | `backend_ecr_repo_url`       |
| `BACKEND_ECS_CLUSTER`      | `backend_ecs_cluster_name`   |
| `BACKEND_ECS_SERVICE`      | `backend_ecs_service_name`   |
| `BACKEND_API_BASE_URL`     | `backend_api_base_url`       |
| `FRONTEND_DEPLOY_ROLE_ARN` | `frontend_deploy_role_arn`   |
| `FRONTEND_ECR_REPO_URL`    | `frontend_ecr_repo_url`      |
| `FRONTEND_ECS_CLUSTER`     | `frontend_ecs_cluster_name`  |
| `FRONTEND_ECS_SERVICE`     | `frontend_ecs_service_name`  |

OIDC deploy roles exist **only** when `create_backend_infra = true`.

### Manual — Cognito and session (ECS / Secrets Manager)

Set on **frontend** ECS task definition (server-side):

- `AUTH_SESSION_SECRET` (secret)
- `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` (secret)
- `COGNITO_REDIRECT_URI`, `COGNITO_LOGOUT_URI`
- `BACKEND_BASE_URL` = `http://<ALB_DNS>/api`

Set on **backend** ECS task definition:

- `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_APP_CLIENT_ID`

`DATABASE_URL` is injected from Secrets Manager when `create_rds = true` (no GitHub var needed).

### Workflows

| Workflow                                                                   | Trigger | Required vars              |
| -------------------------------------------------------------------------- | ------- | -------------------------- |
| [Backend Deploy (prod)](../../.github/workflows/backend-deploy-prod.yml)   | Manual  | `BACKEND_*`, `AWS_REGION`  |
| [Frontend Deploy (prod)](../../.github/workflows/frontend-deploy-prod.yml) | Manual  | `FRONTEND_*`, `AWS_REGION` |

Dev CD workflows were removed; **do not** re-add dev deploy on merge.

---

## Manual deploy order

1. **Terraform apply** (prod workspace) — infra only.
2. **Cognito** — pool, client, URLs, users.
3. **ECS env** — Cognito + `BACKEND_BASE_URL` on tasks (new revision).
4. **Database migrations** — one-time before or after first backend deploy:
   - From a machine with network access to RDS (bastion/VPN) **or** ECS one-off task with `DATABASE_URL` from Secrets Manager (`database_url_secret_arn` output).
   - Example: `cd backend && DATABASE_URL='...' npm run migrate` (use the secret value from AWS Console / CLI).
5. **Backend Deploy (prod)** — builds `:shortsha`, updates ECS service.
6. **Frontend Deploy (prod)** — same; run `make deploy-prod` or Actions UI.
7. Smoke test: `http://<ALB_DNS>/`, `/api/health`, `/login` → Cognito → `/admin`.

First deploy may require a placeholder image or accepting failed tasks until ECR has an image; workflows push immutable SHA tags (not `prod-latest` in tfvars).

---

## Cost drivers (low traffic, us-west-2, rough)

| Resource            | Notes                                                    |
| ------------------- | -------------------------------------------------------- |
| **NAT Gateway**     | ~$32/mo + data processing (largest fixed cost)           |
| **ALB**             | ~$16/mo + LCU                                            |
| **RDS db.t3.micro** | ~$15–20/mo + storage                                     |
| **ECS Fargate**     | 2 tasks × 0.25 vCPU / 0.5–1 GiB ≈ modest $               |
| **CloudFront + S3** | Low at minimal traffic (static bucket still provisioned) |
| **Secrets Manager** | 1 secret, low                                            |

Assumption: single NAT, desired count 1, no autoscaling, HTTP only.

---

## What stays disabled in dev

`infra/dev.tfvars` keeps:

```hcl
create_backend_infra = false
create_rds           = false
```

Dev workspace still creates **Cognito** (`cognito-dev.tf`) for local `make dev-cognito`. No VPC/NAT/ALB/ECS/RDS in AWS dev unless you opt in via commented block in `dev.tfvars`.

---

## Risks and blockers

| Risk                                      | Mitigation                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- |
| **No prod Cognito in Terraform**          | Manual pool + ECS env before login works                             |
| **`AUTH_MODE=cognito` without pool vars** | Backend rejects JWT until `COGNITO_*` set on task                    |
| **HTTP only**                             | Accept for initial launch or add ACM                                 |
| **ALB open to world**                     | Prod uses `0.0.0.0/0` on :80; restrict via WAF or IP allowlist later |
| **No prod migrate workflow**              | Documented manual migrate                                            |
| **RDS `skip_final_snapshot = true`**      | Snapshot before destroy                                              |
| **First ECS deploy**                      | Services may not stabilize until ECR has images                      |

---

## Recommended merge / release sequence

1. Merge this branch (tfvars + docs + `AUTH_MODE` + `gh-sync-prod`).
2. Operator: `make plan-prod` → review → `make apply-prod`.
3. `make gh-sync-prod` + set Cognito secrets on ECS tasks.
4. Run migrations.
5. `workflow_dispatch` **Backend Deploy (prod)** then **Frontend Deploy (prod)**.
6. Validate admin ledger flows; monitor CloudWatch log groups `/ecs/fefeave-*-prod`.
