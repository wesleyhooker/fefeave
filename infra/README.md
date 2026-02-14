# Fefeave Infrastructure

Terraform-managed AWS resources for frontend static hosting: S3 bucket, CloudFront distribution, GitHub OIDC deploy role.

---

## 1. Overview

| Resource | Purpose |
| --- | --- |
| S3 bucket | Static site hosting (Angular build output) |
| CloudFront | CDN, HTTPS, SPA fallback |
| IAM OIDC role | GitHub Actions deploy without long-lived secrets |

Workspaces: `dev`, `prod`. Region: `us-west-2`.

---

## 2. File Layout

```text
infra/
├── main.tf      # S3, CloudFront, bucket policy, GitHub OIDC role
├── providers.tf # AWS provider
├── variables.tf # Input variables
├── outputs.tf   # S3 name, CF ID, role ARN
├── dev.tfvars   # Dev variable values
└── prod.tfvars  # Prod variable values
```

---

## 3. Local Usage

Run from **repo root** via Make:

| Target | Purpose |
| --- | --- |
| `make init` | Terraform init |
| `make plan-dev` | Plan dev |
| `make apply-dev` | Apply dev |
| `make plan-prod` | Plan prod |
| `make apply-prod` | Apply prod |
| `make output-dev` / `make output-prod` | Show outputs |
| `make gh-sync-dev` / `make gh-sync-prod` | Sync outputs → GitHub env vars (requires `gh` CLI) |

---

## 4. Variables

| Variable | Description | Default |
| --- | --- | --- |
| `project_name` | Base name for resources | `fefeave-frontend` |
| `env` | Environment (`dev`, `prod`) | — |
| `aws_region` | AWS region | `us-west-2` |
| `github_repo` | Repo for OIDC trust | `wesleyhooker/fefeave` |
| `github_branch` | Branch for OIDC trust | `main` |
| `create_github_deploy_role` | Create IAM OIDC role | `true` |

Values come from `dev.tfvars` and `prod.tfvars`.

---

## 5. Outputs

| Output | Use |
| --- | --- |
| `s3_bucket_name` | Upload target for GitHub Actions |
| `cloudfront_distribution_id` | Invalidation target |
| `github_actions_role_arn` | OIDC assume-role ARN for Actions |

---

## 6. Workflow

1. **First time:** `make init` → `make plan-dev` → `make apply-dev`
2. **Sync to GitHub:** `make gh-sync-dev` (writes env vars for Actions)
3. **Prod:** `make plan-prod` → `make apply-prod` → `make gh-sync-prod`

---

## 7. Troubleshooting

| Issue | Fix |
| --- | --- |
| `terraform plan` fails | Run `make init` after provider changes. |
| `make gh-sync-*` fails | Install `gh` CLI and run `gh auth login`. |
| OIDC assume fails in Actions | Confirm GitHub env vars (`S3_BUCKET`, `CF_DIST_ID`, `AWS_ROLE_ARN`, `AWS_REGION`) are set; repo/branch in `variables.tf` match. |
