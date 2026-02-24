# --- Project shortcuts for Terraform + GitHub Actions ---
# Usage examples:
#   make init
#   make plan-dev   | make apply-dev
#   make plan-prod  | make apply-prod
#   make output-dev | make output-prod
#   make gh-sync-dev | make gh-sync-prod
#   make deploy-dev | make deploy-prod

TF_DIR := infra
DEV_VARS := dev.tfvars
PROD_VARS := prod.tfvars
TF := terraform -chdir=$(TF_DIR)

REPO := wesleyhooker/fefeave
AWS_REGION := us-west-2

.PHONY: init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod gh-sync-dev gh-sync-prod deploy-dev deploy-prod

# One-time (or after provider/module changes)
init:
	$(TF) init

# Workspaces (idempotent)
ws-dev:
	@$(TF) workspace select dev >/dev/null 2>&1 || $(TF) workspace new dev >/dev/null
ws-prod:
	@$(TF) workspace select prod >/dev/null 2>&1 || $(TF) workspace new prod >/dev/null

# Plans / Applies
plan-dev: ws-dev
	$(TF) plan -var-file=$(DEV_VARS)
apply-dev: ws-dev
	$(TF) apply -var-file=$(DEV_VARS)

plan-prod: ws-prod
	$(TF) plan -var-file=$(PROD_VARS)
apply-prod: ws-prod
	$(TF) apply -var-file=$(PROD_VARS)

# Show TF outputs (handy when wiring CI/CD)
output-dev: ws-dev
	$(TF) output
output-prod: ws-prod
	$(TF) output

# Sync TF outputs -> GitHub Environment Variables (requires gh CLI)
gh-sync-dev: ws-dev
	@command -v gh >/dev/null || (echo "Missing gh CLI"; exit 1)
	@S3=$$($(TF) output -raw s3_bucket_name); \
	  CF=$$($(TF) output -raw cloudfront_distribution_id); \
	  ROLE=$$($(TF) output -raw github_actions_role_arn); \
	  gh variable set -R $(REPO) --env dev S3_BUCKET --body "$$S3"; \
	  gh variable set -R $(REPO) --env dev CF_DIST_ID --body "$$CF"; \
	  gh variable set -R $(REPO) --env dev AWS_ROLE_ARN --body "$$ROLE"; \
	  gh variable set -R $(REPO) --env dev AWS_REGION --body "$(AWS_REGION)"; \
	  echo "Synced dev env vars: S3_BUCKET=$$S3 CF_DIST_ID=$$CF AWS_ROLE_ARN=$$ROLE"; \
	  BDR=$$($(TF) output -raw backend_deploy_role_arn 2>/dev/null); \
	  if [ -n "$$BDR" ]; then \
	    BECR=$$($(TF) output -raw backend_ecr_repo_url); \
	    BCL=$$($(TF) output -raw backend_ecs_cluster_name); \
	    BSV=$$($(TF) output -raw backend_ecs_service_name); \
	    BAPI=$$($(TF) output -raw backend_api_base_url); \
	    gh variable set -R $(REPO) --env dev BACKEND_DEPLOY_ROLE_ARN --body "$$BDR"; \
	    gh variable set -R $(REPO) --env dev BACKEND_ECR_REPO_URL --body "$$BECR"; \
	    gh variable set -R $(REPO) --env dev BACKEND_ECS_CLUSTER --body "$$BCL"; \
	    gh variable set -R $(REPO) --env dev BACKEND_ECS_SERVICE --body "$$BSV"; \
	    gh variable set -R $(REPO) --env dev BACKEND_API_BASE_URL --body "$$BAPI"; \
	    echo "Synced dev backend env vars"; \
	  fi

gh-sync-prod: ws-prod
	@command -v gh >/dev/null || (echo "Missing gh CLI"; exit 1)
	@S3=$$($(TF) output -raw s3_bucket_name); \
	  CF=$$($(TF) output -raw cloudfront_distribution_id); \
	  ROLE=$$($(TF) output -raw github_actions_role_arn); \
	  gh variable set -R $(REPO) --env prod S3_BUCKET --body "$$S3"; \
	  gh variable set -R $(REPO) --env prod CF_DIST_ID --body "$$CF"; \
	  gh variable set -R $(REPO) --env prod AWS_ROLE_ARN --body "$$ROLE"; \
	  gh variable set -R $(REPO) --env prod AWS_REGION --body "$(AWS_REGION)"; \
	  echo "Synced prod env vars: S3_BUCKET=$$S3 CF_DIST_ID=$$CF AWS_ROLE_ARN=$$ROLE"

# Kick off deploy workflows (uses the display names you set)
deploy-dev:
	@command -v gh >/dev/null || (echo "Missing gh CLI"; exit 1)
	gh workflow run "Frontend Deploy (dev)" -R $(REPO)

deploy-prod:
	@command -v gh >/dev/null || (echo "Missing gh CLI"; exit 1)
	gh workflow run "Frontend Deploy (prod)" -R $(REPO)
