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

.PHONY: help init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod gh-sync-dev gh-sync-prod deploy-dev deploy-prod dev-plan dev-apply ui-aws dev-db-up dev-db-down dev-down dev-db-reset dev-migrate dev-seed check-cognito-env dev-api dev-api-cognito dev-ui dev-tmux dev-tmux-cognito dev-up dev-cognito dev-status dev-backend-health dev-backend-wholesalers test

help:
	@echo "Available targets:"
	@echo "  dev-db-up                Start local Postgres (docker compose)"
	@echo "  dev-db-down              Stop local Postgres"
	@echo "  dev-db-reset             Reset local Postgres volume and restart"
	@echo "  dev-migrate              Run backend migrations against local Postgres"
	@echo "  dev-seed                 Seed dev data (wholesalers, shows, payments); run after dev-migrate"
	@echo "  dev-api                  Run backend locally on :3000 with dev_bypass"
	@echo "  dev-api-cognito          Run backend locally on :3000 with AUTH_MODE=cognito"
	@echo "  dev-ui                   Run frontend locally on :3001 (0.0.0.0)"
	@echo "  dev-tmux                 Run dev-api + dev-ui in tmux split panes"
	@echo "  dev-tmux-cognito         Run dev-api-cognito + dev-ui in tmux split panes"
	@echo "  dev-up                   Print daily inner-loop startup steps"
	@echo "  dev-cognito              Bring up db+migrations and run cognito backend + frontend in tmux"
	@echo "  dev-status               Check local backend endpoint status codes"
	@echo "  test                     Run backend tests and frontend build"
	@echo "  NOTE                     make dev uses AUTH_MODE=dev_bypass (fast local). Use make dev-cognito for real Hosted UI testing."
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

dev-down:
	@kill -9 $$(lsof -t -iTCP:3000 -sTCP:LISTEN) 2>/dev/null || true
	@kill -9 $$(lsof -t -iTCP:3001 -sTCP:LISTEN) 2>/dev/null || true
	@if command -v tmux >/dev/null 2>&1; then tmux kill-session -t fefeave-dev 2>/dev/null || true; fi
	@echo "Dev cleanup done."

dev-db-reset:
	@echo "Resetting local Postgres volume and restarting"
	@docker compose down -v
	@docker compose up -d postgres
	@docker compose ps

dev-migrate:
	@echo "Running backend migrations against local DB"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run migrate:up

dev-seed:
	@echo "Seeding dev data (wholesalers, shows, settlements, payments)"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run seed:dev

check-cognito-env:
	@missing=""; \
	read_frontend_var() { \
	  key="$$1"; \
	  env_val="$$2"; \
	  if [ -n "$$env_val" ]; then \
	    printf '%s' "$$env_val"; \
	    return; \
	  fi; \
	  [ -f frontend/.env.local ] || return; \
	  awk -v k="$$key" ' \
	    /^[[:space:]]*#/ { next } \
	    /^[[:space:]]*$$/ { next } \
	    { \
	      line=$$0; \
	      if (line ~ "^[[:space:]]*" k "[[:space:]]*=") { \
	        sub("^[[:space:]]*" k "[[:space:]]*=[[:space:]]*", "", line); \
	        sub(/\r$$/, "", line); \
	        print line; \
	        exit; \
	      } \
	    } \
	  ' frontend/.env.local; \
	}; \
	[ -n "$$COGNITO_REGION" ] || missing="$$missing COGNITO_REGION"; \
	[ -n "$$COGNITO_USER_POOL_ID" ] || missing="$$missing COGNITO_USER_POOL_ID"; \
	[ -n "$$COGNITO_APP_CLIENT_ID" ] || missing="$$missing COGNITO_APP_CLIENT_ID"; \
	frontend_auth_secret="$$(read_frontend_var AUTH_SESSION_SECRET "$$AUTH_SESSION_SECRET")"; \
	frontend_domain="$$(read_frontend_var COGNITO_DOMAIN "$$COGNITO_DOMAIN")"; \
	frontend_client_id="$$(read_frontend_var COGNITO_CLIENT_ID "$$COGNITO_CLIENT_ID")"; \
	frontend_client_secret="$$(read_frontend_var COGNITO_CLIENT_SECRET "$$COGNITO_CLIENT_SECRET")"; \
	frontend_redirect_uri="$$(read_frontend_var COGNITO_REDIRECT_URI "$$COGNITO_REDIRECT_URI")"; \
	frontend_backend_base="$$(read_frontend_var BACKEND_BASE_URL "$$BACKEND_BASE_URL")"; \
	[ -n "$$frontend_auth_secret" ] || missing="$$missing AUTH_SESSION_SECRET"; \
	[ -n "$$frontend_domain" ] || missing="$$missing COGNITO_DOMAIN"; \
	[ -n "$$frontend_client_id" ] || missing="$$missing COGNITO_CLIENT_ID"; \
	[ -n "$$frontend_client_secret" ] || missing="$$missing COGNITO_CLIENT_SECRET"; \
	[ -n "$$frontend_redirect_uri" ] || missing="$$missing COGNITO_REDIRECT_URI"; \
	[ -n "$$frontend_backend_base" ] || missing="$$missing BACKEND_BASE_URL"; \
	if [ -n "$$missing" ]; then \
	  echo "Missing required Cognito env vars:$$missing"; \
	  echo "Set backend vars in shell env and frontend vars in shell env or frontend/.env.local."; \
	  if [ -f scripts/dev/print-cognito-env-help.sh ]; then \
	    sh scripts/dev/print-cognito-env-help.sh; \
	  fi; \
	  exit 1; \
	fi; \
	if [ "$$frontend_redirect_uri" != "http://localhost:3001/api/auth/callback" ]; then \
	  echo "COGNITO_REDIRECT_URI must be http://localhost:3001/api/auth/callback for make dev-cognito."; \
	  exit 1; \
	fi; \
	if [ "$$frontend_backend_base" != "http://localhost:3000/api" ]; then \
	  echo "BACKEND_BASE_URL must be http://localhost:3000/api for make dev-cognito."; \
	  exit 1; \
	fi

dev-api:
	@echo "Starting backend on http://0.0.0.0:3000 (dev_bypass)"
	@PORT=3000 \
	 DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" \
	 AUTH_MODE="$${AUTH_MODE:-$(LOCAL_AUTH_MODE)}" \
	 AUTH_DEV_BYPASS_USER_ID="$${AUTH_DEV_BYPASS_USER_ID:-$(LOCAL_AUTH_USER_ID)}" \
	 AUTH_DEV_BYPASS_EMAIL="$${AUTH_DEV_BYPASS_EMAIL:-$(LOCAL_AUTH_EMAIL)}" \
	 AUTH_DEV_BYPASS_ROLE="$${AUTH_DEV_BYPASS_ROLE:-$(LOCAL_AUTH_ROLE)}" \
	 npm --prefix backend run dev

dev-api-cognito: check-cognito-env
	@echo "Starting backend on http://0.0.0.0:3000 (cognito)"
	@PORT=3000 \
	 DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" \
	 AUTH_MODE=cognito \
	 npm --prefix backend run dev

dev-ui:
	@echo "Starting frontend on http://0.0.0.0:3001 with /api proxy to localhost:3000"
	@NEXT_PUBLIC_BACKEND_URL=/api npm --prefix frontend run dev -- -H 0.0.0.0 -p 3001

dev-tmux:
	@if ! test -t 1 || ! command -v tmux >/dev/null 2>&1; then \
	  echo "Non-interactive shell detected; starting dev services without tmux..."; \
	  $(MAKE) dev-api & \
	  api_pid=$$!; \
	  trap 'kill $$api_pid 2>/dev/null || true' EXIT INT TERM; \
	  $(MAKE) dev-ui; \
	else \
	  if tmux has-session -t fefeave-dev 2>/dev/null; then \
	    tmux attach -t fefeave-dev; \
	  else \
	    tmux new-session -d -s fefeave-dev "cd $(CURDIR) && bash -lc 'make dev-api; rc=\$$?; echo; echo \"backend exited \$$rc\"; read -n 1 -s -r -p \"press any key\"'"; \
	    tmux split-window -h -t fefeave-dev "cd $(CURDIR) && make dev-ui"; \
	    tmux attach -t fefeave-dev; \
	  fi; \
	fi

dev-tmux-cognito:
	@if tmux has-session -t fefeave-dev 2>/dev/null; then \
	  tmux attach -t fefeave-dev; \
	else \
	  tmux new-session -d -s fefeave-dev "cd $(CURDIR) && bash -lc 'make dev-api-cognito; rc=\$$?; echo; echo \"backend exited \$$rc\"; read -n 1 -s -r -p \"press any key\"'"; \
	  tmux split-window -h -t fefeave-dev "cd $(CURDIR) && make dev-ui"; \
	  tmux attach -t fefeave-dev; \
	fi

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

dev:
	@$(MAKE) dev-db-up
	@$(MAKE) dev-migrate
	@$(MAKE) dev-tmux

dev-cognito:
	@$(MAKE) dev-db-up
	@$(MAKE) dev-migrate
	@$(MAKE) dev-tmux-cognito
