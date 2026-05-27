# Production release (serverless backend path)

Manual path to run Felicia’s full app on AWS: **OpenNext** frontend on CloudFront (`https://fefeave.com`), Cognito login, ledger API on **Lambda + API Gateway**, Postgres on **Neon**. Prod deploy workflows are **manual** (`workflow_dispatch`) only.

Local development stays unchanged (`make dev`; `infra/dev.tfvars` keeps serverless flags off).

> **Phase docs:** [opennext-phase5.md](opennext-phase5.md), [lambda-phase3.md](lambda-phase3.md), [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md), [route53-acm-cutover.md](route53-acm-cutover.md) (Cloudflare DNS + ACM). Consolidate before final merge.

---

## What Terraform provisions (current `infra/prod.tfvars`)

| Layer               | Resources                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Always              | S3 site bucket, attachments S3, ECS-oriented backend IAM role (legacy; unused by Lambdas)            |
| Serverless frontend | OpenNext Lambdas + multi-origin CloudFront; domain **fefeave.com** (ACM + Cloudflare DNS at cutover) |
| Serverless backend  | Lambda `fefeave-backend-prod`, API Gateway HTTP API, Neon `DATABASE_URL` **secret container**        |
| Not created         | VPC, **NAT**, ALB, ECS, ECR, RDS, DynamoDB, SQS, warmer                                              |

### After apply (manual, not in Terraform)

1. `aws secretsmanager put-secret-value` for Neon pooler `DATABASE_URL` — see [lambda-phase3.md](lambda-phase3.md).
2. `cd backend && npm run package:lambda` before each Lambda code update.
3. Prod **Cognito** User Pool + Google IdP + groups (manual) — [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md).
4. `cd frontend && npm run package:opennext` before frontend Lambda updates.
5. ACM (us-east-1) + Cloudflare DNS for `fefeave.com` — [route53-acm-cutover.md](route53-acm-cutover.md).

### Legacy ECS path (`create_backend_infra = true`)

Opt-in only; mutually exclusive with `create_serverless_backend`. Creates VPC, NAT, ALB, ECS, ECR, optional RDS — see commented blocks in `infra/README.md`.

---

## Cognito (manual setup)

Full bootstrap (Google sign-in, groups, first admin): **[cognito-prod-bootstrap.md](cognito-prod-bootstrap.md)**.

Summary:

- Roles come from Cognito **groups** in the JWT claim `cognito:groups` — not `custom:role`.
- Valid groups: `ADMIN`, `OPERATOR`, `WHOLESALER` (case-sensitive).
- Felicia signs in with **Google** via Hosted UI; Cognito creates the federated user on first login; operator adds her to the **`ADMIN`** group.
- No manual DB `users` insert, no prod seed script, and no user-management UI required for launch. `ensureUser` syncs the DB on first write.

App client URLs (must match `infra/prod.tfvars`):

| URL      | Value                                   |
| -------- | --------------------------------------- |
| Callback | `https://fefeave.com/api/auth/callback` |
| Sign-out | `https://fefeave.com/login`             |

Record for **Lambda env** (not Terraform outputs today):

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

### From Terraform (`make gh-sync-prod` after apply)

**OpenNext frontend (current `prod.tfvars`):**

| GitHub variable                              | Terraform output / source                               |
| -------------------------------------------- | ------------------------------------------------------- |
| `AWS_REGION`                                 | `us-west-2`                                             |
| `S3_BUCKET`                                  | `s3_bucket_name`                                        |
| `CF_DIST_ID`                                 | `cloudfront_distribution_id`                            |
| `FRONTEND_DEPLOY_ROLE_ARN`                   | `frontend_deploy_role_arn`                              |
| `FRONTEND_SERVER_LAMBDA_NAME`                | `frontend_server_lambda_name`                           |
| `FRONTEND_IMAGE_LAMBDA_NAME`                 | `frontend_image_lambda_name`                            |
| `BACKEND_BASE_URL`                           | `github_prod_frontend_serverless_vars.BACKEND_BASE_URL` |
| `FRONTEND_APP_URL`, `FRONTEND_DOMAIN`        | `frontend_app_url`, `frontend_domain`                   |
| `COGNITO_REDIRECT_URI`, `COGNITO_LOGOUT_URI` | tfvars outputs                                          |

Or copy the full map: `terraform -chdir=infra output -json github_prod_frontend_serverless_vars`.

**Serverless backend:** `terraform output -json github_prod_backend_serverless_vars` (`BACKEND_DEPLOY_ROLE_ARN`, `BACKEND_LAMBDA_FUNCTION_NAME`, `BACKEND_API_GATEWAY_URL`, etc.). Sync via `make gh-sync-prod` after apply.

### Legacy ECS path (`create_backend_infra = true`)

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

| Workflow                                                                   | Trigger | Required vars                                                                                                            |
| -------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Backend Deploy (prod)](../../.github/workflows/backend-deploy-prod.yml)   | Manual  | `BACKEND_DEPLOY_ROLE_ARN`, `BACKEND_LAMBDA_FUNCTION_NAME`, `AWS_REGION` (serverless); optional `BACKEND_API_GATEWAY_URL` |
| [Frontend Deploy (prod)](../../.github/workflows/frontend-deploy-prod.yml) | Manual  | `FRONTEND_*`, `AWS_REGION`                                                                                               |

Dev CD workflows were removed; **do not** re-add dev deploy on merge.

---

## Manual deploy order (serverless path — current prod.tfvars)

Domain **fefeave.com** is on **Cloudflare** (registrar + DNS). Route53 is not used. See [route53-acm-cutover.md](route53-acm-cutover.md) for ACM and Cloudflare record details.

1. **Package artifacts:** `cd backend && npm run package:lambda`; `cd frontend && npm run build:opennext && npm run package:opennext`.
2. **Terraform apply** (prod workspace) with `enable_frontend_custom_domain = false` — infra only; CloudFront on default `*.cloudfront.net` cert.
3. **`make gh-sync-prod`** — GitHub prod env vars (`CF_DIST_ID`, Lambda names, Cognito URLs, etc.).
4. **Neon `DATABASE_URL`** — `aws secretsmanager put-secret-value`, then inject into backend Lambda env (see [lambda-phase3.md](lambda-phase3.md) and [prod-secrets.md](prod-secrets.md)).
5. **Cognito** — prod pool, Google IdP, groups (`ADMIN`/`OPERATOR`/`WHOLESALER`), Hosted UI, app client URLs; set frontend Lambda secrets (`COGNITO_*`, `AUTH_SESSION_SECRET`) via console/CLI env merge. **Create Felicia Google-backed Cognito admin account** — see [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md).
6. **ACM (us-east-1)** — request cert for `fefeave.com` + `www.fefeave.com`; add validation **CNAME** records in Cloudflare (**DNS only**, grey cloud); wait for **ISSUED**.
7. **Terraform custom domain** — set `enable_frontend_custom_domain = true` and `acm_certificate_arn` in `prod.tfvars` (leave `route53_zone_id` unset); `make apply-prod`.
8. **Cloudflare DNS** — CNAME `@` and `www` → `cloudfront_distribution_domain` output; **Proxied**; SSL/TLS **Full (strict)**.
9. **Backend Deploy (prod)** then **Frontend Deploy (prod)** — `workflow_dispatch` (Lambda zip + OpenNext; no ECS/ECR).
10. Smoke test: `https://fefeave.com/`, `/api/auth/health`, `/login` → Cognito → `/admin`.

### Legacy ECS deploy order (`create_backend_infra = true`)

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

## Production launch checklist (operator)

- [ ] Terraform apply (serverless prod) + `make gh-sync-prod`
- [ ] Neon `DATABASE_URL` secret + migrations
- [ ] ACM + Cloudflare DNS cutover ([route53-acm-cutover.md](route53-acm-cutover.md))
- [ ] Backend + Frontend deploy workflows
- [ ] **Create Felicia Google-backed Cognito admin account** ([cognito-prod-bootstrap.md](cognito-prod-bootstrap.md))
- [ ] Smoke: `https://fefeave.com/`, `/api/auth/health`, `/login` → admin dashboard

## Recommended merge / release sequence

1. Merge this branch (tfvars + docs + serverless deploy workflows).
2. Operator: `make plan-prod` → review → `make apply-prod`.
3. `make gh-sync-prod` + set Cognito/Lambda secrets (see [cognito-prod-bootstrap.md](cognito-prod-bootstrap.md)).
4. Run migrations against Neon.
5. `workflow_dispatch` **Backend Deploy (prod)** then **Frontend Deploy (prod)**.
6. Bootstrap Felicia admin (Google → Cognito → `ADMIN` group).
7. Validate admin ledger flows; monitor CloudWatch log groups for Lambdas.
