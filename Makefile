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
DEV_ALB_FALLBACK := http://fefeave-backend-dev-379356847.us-west-2.elb.amazonaws.com

REPO := wesleyhooker/fefeave
AWS_REGION := us-west-2
LOCAL_DB_URL := postgres://fefeave:fefeave@localhost:5432/fefeave
LOCAL_AUTH_MODE := dev_bypass
LOCAL_AUTH_USER_ID := local-dev-user
LOCAL_AUTH_EMAIL := local@fefeave.local
LOCAL_AUTH_ROLE := ADMIN

.DEFAULT_GOAL := help

.PHONY: help init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod gh-sync-dev gh-sync-prod deploy-dev deploy-prod dev-plan dev-apply ui-aws dev-db-up dev-db-down dev-db-reset dev-migrate dev-api dev-ui dev-up dev-status dev-backend-health dev-backend-wholesalers test

help:
	@echo "Available targets:"
	@echo "  dev-db-up                Start local Postgres (docker compose)"
	@echo "  dev-db-down              Stop local Postgres"
	@echo "  dev-db-reset             Reset local Postgres volume and restart"
	@echo "  dev-migrate              Run backend migrations against local Postgres"
	@echo "  dev-api                  Run backend locally on :3000 with dev_bypass"
	@echo "  dev-ui                   Run frontend locally on :3001 (0.0.0.0)"
	@echo "  dev-up                   Print daily inner-loop startup steps"
	@echo "  dev-status               Check local backend endpoint status codes"
	@echo "  test                     Run backend tests and frontend build"
	@echo ""
	@echo "Outer-loop / AWS helper targets:"
	@echo "  dev-plan dev-apply ui-aws dev-backend-health dev-backend-wholesalers"
	@echo ""
	@echo "Legacy targets:"
	@echo "  init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod"
	@echo "  gh-sync-dev gh-sync-prod deploy-dev deploy-prod"

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

# --- Centralized dev command surface ---
dev-plan:
	@echo "Selecting Terraform workspace: dev"
	@terraform -chdir=infra workspace select dev
	@echo "Running Terraform plan (dev.tfvars)"
	@terraform -chdir=infra plan -var-file=dev.tfvars

dev-apply:
	@echo "Selecting Terraform workspace: dev"
	@terraform -chdir=infra workspace select dev
	@echo "Running Terraform apply (dev.tfvars)"
	@terraform -chdir=infra apply -var-file=dev.tfvars

dev-db-up:
	@echo "Starting local Postgres on port 5432"
	@docker compose up -d postgres
	@echo "Waiting for Postgres to report healthy..."
	@docker compose ps

dev-db-down:
	@echo "Stopping local Postgres"
	@docker compose down

dev-db-reset:
	@echo "Resetting local Postgres volume and restarting"
	@docker compose down -v
	@docker compose up -d postgres
	@docker compose ps

dev-migrate:
	@echo "Running backend migrations against local DB"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run migrate:up

dev-api:
	@echo "Starting backend on http://0.0.0.0:3000 (dev_bypass)"
	@PORT=3000 \
	 DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" \
	 AUTH_MODE="$${AUTH_MODE:-$(LOCAL_AUTH_MODE)}" \
	 AUTH_DEV_BYPASS_USER_ID="$${AUTH_DEV_BYPASS_USER_ID:-$(LOCAL_AUTH_USER_ID)}" \
	 AUTH_DEV_BYPASS_EMAIL="$${AUTH_DEV_BYPASS_EMAIL:-$(LOCAL_AUTH_EMAIL)}" \
	 AUTH_DEV_BYPASS_ROLE="$${AUTH_DEV_BYPASS_ROLE:-$(LOCAL_AUTH_ROLE)}" \
	 npm --prefix backend run dev

dev-ui:
	@echo "Starting frontend on http://0.0.0.0:3001 with /api proxy to localhost:3000"
	@NEXT_PUBLIC_BACKEND_URL=/api npm --prefix frontend run dev -- -H 0.0.0.0 -p 3001

dev-up:
	@echo "Daily inner-loop startup:"
	@echo "  1) Terminal A: make dev-db-up"
	@echo "  2) Terminal A: make dev-migrate"
	@echo "  3) Terminal B: make dev-api"
	@echo "  4) Terminal C: make dev-ui"
	@echo "Then open: http://localhost:3001"

dev-status:
	@echo "Local backend status checks (expected 200):"
	@echo -n "  /api/health: "
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
	@echo -n "  /api/wholesalers/balances: "
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/wholesalers/balances
	@echo -n "  /api/shows: "
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/shows
	@echo -n "  /api/payments: "
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/payments

ui-aws:
	@echo "Preparing frontend/.env.local with NEXT_PUBLIC_BACKEND_URL=/api"
	@mkdir -p frontend
	@touch frontend/.env.local
	@if rg -q '^NEXT_PUBLIC_BACKEND_URL=' frontend/.env.local; then \
	  sed -i 's|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=/api|' frontend/.env.local; \
	else \
	  printf '\nNEXT_PUBLIC_BACKEND_URL=/api\n' >> frontend/.env.local; \
	fi
	@echo "Resolving dev backend origin from Terraform output (backend_api_base_url)"
	@backend_url=$$(terraform -chdir=infra workspace select dev >/dev/null 2>&1; terraform -chdir=infra output -raw backend_api_base_url 2>/dev/null || true); \
	if [ -z "$$backend_url" ]; then backend_url="$(DEV_ALB_FALLBACK)"; fi; \
	DEV_BACKEND_ORIGIN="$${backend_url%/}" \
	  && echo "Using DEV_BACKEND_ORIGIN=$$DEV_BACKEND_ORIGIN" \
	  && cd frontend \
	  && DEV_BACKEND_ORIGIN="$$DEV_BACKEND_ORIGIN" npm run dev -- -H 0.0.0.0 -p 3000

dev-backend-health:
	@echo "Checking dev backend health endpoint"
	@terraform -chdir=infra workspace select dev >/dev/null
	@curl -i "$$(terraform -chdir=infra output -raw backend_api_base_url)/api/health" | head

dev-backend-wholesalers:
	@echo "Checking dev backend wholesaler balances endpoint"
	@terraform -chdir=infra workspace select dev >/dev/null
	@curl -s -o /dev/null -w "%{http_code}\n" "$$(terraform -chdir=infra output -raw backend_api_base_url)/api/wholesalers/balances"

test:
	@echo "Running backend tests"
	@cd backend && npm test
	@echo "Running frontend build"
	@cd frontend && npm run build
