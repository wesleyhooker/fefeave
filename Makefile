# FefeAve monorepo Makefile
# Default: make help

TF_DIR := infra
DEV_VARS := dev.tfvars
PROD_VARS := prod.tfvars
TF := terraform -chdir=$(TF_DIR)
# Legacy URL for one-off curls; unused when infra/dev.tfvars has create_backend_infra=false (local dev is default).
DEV_ALB_FALLBACK := http://fefeave-backend-dev-379356847.us-west-2.elb.amazonaws.com

REPO := wesleyhooker/fefeave
AWS_REGION := us-west-2
LOCAL_DB_URL := postgres://fefeave:fefeave@localhost:5432/fefeave
LOCAL_AUTH_MODE := dev_bypass
LOCAL_AUTH_USER_ID := local-dev-user
LOCAL_AUTH_EMAIL := local@fefeave.local
LOCAL_AUTH_ROLE := ADMIN

# WSL2 / cross-editor saves: webpack and nodemon poll when native file events are unreliable.
DEV_POLL_ENV := WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true WATCHPACK_POLLING_INTERVAL=1000

.DEFAULT_GOAL := help

.PHONY: help format format-check lint test build check doctor
.PHONY: backend-lint backend-test backend-build backend-check
.PHONY: frontend-lint frontend-build frontend-check
.PHONY: dev dev-up dev-down dev-status dev-api dev-api-cognito dev-ui dev-tmux dev-tmux-cognito dev-cognito dev-reset-frontend
.PHONY: dev-db-up dev-db-down dev-db-reset dev-migrate dev-seed dev-seed-verify dev-reset dev-backfill-financial-events check-cognito-env
.PHONY: dev-scenario dev-scenario-list dev-scenario-reset
.PHONY: init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod gh-sync-dev gh-sync-prod deploy-dev deploy-prod dev-plan dev-apply ui-aws dev-backend-health dev-backend-wholesalers

# ------------------------------------------------------------------------------
# Help
# ------------------------------------------------------------------------------
help:
	@echo "FefeAve — day-to-day workflow"
	@echo ""
	@echo "  Pre-push (run before pushing):"
	@echo "    make check              Format check, lint, tests, frontend build (mirrors CI)"
	@echo ""
	@echo "  Repo hygiene:"
	@echo "    make format             Apply Prettier formatting across repo"
	@echo "    make format-check       Check formatting only (no write)"
	@echo "    make lint               Lint whole repo (backend + frontend if configured)"
	@echo "    make test               Backend tests + frontend build"
	@echo "    make build              Backend build + frontend build"
	@echo "    make doctor             Print tooling versions / env health"
	@echo ""
	@echo "  Backend-only:"
	@echo "    make backend-lint       Lint backend"
	@echo "    make backend-test       Run backend tests"
	@echo "    make backend-build      Build backend (tsc)"
	@echo "    make backend-check      backend-lint + backend-test + backend-build"
	@echo ""
	@echo "  Frontend-only:"
	@echo "    make frontend-lint      Lint frontend (Next.js ESLint)"
	@echo "    make frontend-build     Build frontend"
	@echo "    make frontend-check     frontend-lint + frontend-build"
	@echo ""
	@echo "  Local dev (inner loop):"
	@echo "    make dev                DB up, migrate, backend + frontend in tmux (dev_bypass auth)"
	@echo "    make dev-up             Print startup steps"
	@echo "    make dev-api            Backend on :3000 (dev_bypass)"
	@echo "    make dev-api-cognito    Backend on :3000 (Cognito)"
	@echo "    make dev-ui             Frontend on :3001"
	@echo "    make dev-tmux           dev-api + dev-ui in tmux"
	@echo "    make dev-tmux-cognito   dev-api-cognito + dev-ui in tmux"
	@echo "    make dev-cognito        DB + migrate + tmux with Cognito"
	@echo "    make dev-status         Hit local backend endpoints"
	@echo "    make dev-down           Kill dev processes on 3000/3001 and tmux session"
	@echo "    make dev-reset-frontend Stop UI, clear frontend/.next, restart UI (fixes stale Next cache)"
	@echo ""
	@echo "  Database / migrations:"
	@echo "    make dev-db-up          Start local Postgres (docker compose)"
	@echo "    make dev-db-down        Stop Postgres"
	@echo "    make dev-db-reset       Reset Postgres volume and restart"
	@echo "    make dev-migrate        Run migrations against local DB"
	@echo "    make dev-seed           Seed dev data + financial_events backfill (after dev-migrate)"
	@echo "    make dev-seed-verify    Print Financials mock-data health metrics (DB + API if up)"
	@echo "    make dev-reset          Reset local DB schema, migrate, seed (clean Financials mock)"
	@echo "    make dev-scenario SCENARIO=<id>  Load dev-only workspace scenario (DB-backed UI states)"
	@echo "    make dev-scenario-list  List workspace scenarios"
	@echo "    make dev-scenario-reset Clear workspace scenario data only"
	@echo "    make dev-backfill-financial-events  Backfill financial_events only (local dev DB)"
	@echo ""
	@echo "  Outer-loop / AWS (low-cost hosting; use plan-dev/plan-prod to preview cost-related changes):"
	@echo "    Local: build/run via make dev*; AWS prod/dev workspaces are S3/CloudFront-first unless you opt into ECS in tfvars."
	@echo "    make dev-plan, dev-apply, ui-aws, dev-backend-health, dev-backend-wholesalers (backend health targets need AWS ECS if enabled)"
	@echo "    init, plan-dev, apply-dev, output-dev, gh-sync-dev, deploy-prod (manual prod ECS deploy)"

# ------------------------------------------------------------------------------
# Repo hygiene (whole-repo)
# ------------------------------------------------------------------------------
format:
	@echo "[repo] Applying format fixes (Prettier)"
	@npm run format

format-check:
	@echo "[repo] Checking formatting (Prettier)"
	@npm run format:check

lint: backend-lint
	@echo "[repo] Frontend lint"
	@npm --prefix frontend run lint

test:
	@echo "[repo] Backend tests"
	@npm --prefix backend run test
	@echo "[repo] Frontend build"
	@npm --prefix frontend run build

build: backend-build
	@echo "[repo] Frontend build"
	@npm --prefix frontend run build

check: format-check
	@echo "[repo] Project-head tooling"
	@npm run test:project-head
	@$(MAKE) lint
	@echo "[repo] Backend tests"
	@npm --prefix backend run test --if-present
	@echo "[repo] Frontend build"
	@npm --prefix frontend run build
	@echo "All checks passed."

doctor:
	@echo "Node:  $$(node -v 2>/dev/null || echo 'not found')"
	@echo "npm:   $$(npm -v 2>/dev/null || echo 'not found')"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'not found')"
	@echo "Backend deps: $$(test -d backend/node_modules && echo 'installed' || echo 'missing')"
	@echo "Frontend deps: $$(test -d frontend/node_modules && echo 'installed' || echo 'missing')"

# ------------------------------------------------------------------------------
# Backend checks
# ------------------------------------------------------------------------------
backend-lint:
	@echo "[backend] Lint"
	@npm --prefix backend run lint

backend-test:
	@echo "[backend] Test"
	@npm --prefix backend run test

backend-build:
	@echo "[backend] Build"
	@npm --prefix backend run build

backend-check: backend-lint backend-test backend-build
	@echo "[backend] Check done."

# ------------------------------------------------------------------------------
# Frontend checks
# ------------------------------------------------------------------------------
frontend-lint:
	@echo "[frontend] Lint"
	@npm --prefix frontend run lint

frontend-build:
	@echo "[frontend] Build"
	@npm --prefix frontend run build

frontend-check: frontend-lint frontend-build
	@echo "[frontend] Check done."

# ------------------------------------------------------------------------------
# Terraform / outer-loop
# ------------------------------------------------------------------------------
# Local Cursor/Docker (make dev*) is the default dev loop. Terraform workspaces dev/prod
# in infra/ are for low-cost AWS (S3 + CloudFront + attachments + IAM; dev also has Cognito).
# NAT, ALB, ECS, RDS are opt-in via create_backend_infra / create_rds in *.tfvars when cost is justified.
# Use `make plan-dev` / `make plan-prod` before apply to review destroys (e.g. RDS) — never apply blindly.
init:
	$(TF) init

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
	  gh variable set -R $(REPO) --env dev S3_BUCKET --body "$$S3"; \
	  gh variable set -R $(REPO) --env dev CF_DIST_ID --body "$$CF"; \
	  gh variable set -R $(REPO) --env dev AWS_REGION --body "$(AWS_REGION)"; \
	  echo "Synced dev env vars: S3_BUCKET=$$S3 CF_DIST_ID=$$CF AWS_REGION=$(AWS_REGION)"; \
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
	  gh variable set -R $(REPO) --env prod S3_BUCKET --body "$$S3"; \
	  gh variable set -R $(REPO) --env prod CF_DIST_ID --body "$$CF"; \
	  gh variable set -R $(REPO) --env prod AWS_REGION --body "$(AWS_REGION)"; \
	  echo "Synced prod env vars: S3_BUCKET=$$S3 CF_DIST_ID=$$CF AWS_REGION=$(AWS_REGION)"; \
	  BDR=$$($(TF) output -raw backend_deploy_role_arn 2>/dev/null); \
	  BLN=$$($(TF) output -raw backend_lambda_function_name 2>/dev/null); \
	  if [ -n "$$BDR" ] && [ -n "$$BLN" ]; then \
	    BAPI=$$($(TF) output -raw backend_api_gateway_url); \
	    gh variable set -R $(REPO) --env prod BACKEND_DEPLOY_ROLE_ARN --body "$$BDR"; \
	    gh variable set -R $(REPO) --env prod BACKEND_LAMBDA_FUNCTION_NAME --body "$$BLN"; \
	    gh variable set -R $(REPO) --env prod BACKEND_API_GATEWAY_URL --body "$$BAPI"; \
	    echo "Synced prod serverless backend deploy env vars"; \
	  elif [ -n "$$BDR" ]; then \
	    BECR=$$($(TF) output -raw backend_ecr_repo_url); \
	    BCL=$$($(TF) output -raw backend_ecs_cluster_name); \
	    BSV=$$($(TF) output -raw backend_ecs_service_name); \
	    BAPI=$$($(TF) output -raw backend_api_base_url); \
	    gh variable set -R $(REPO) --env prod BACKEND_DEPLOY_ROLE_ARN --body "$$BDR"; \
	    gh variable set -R $(REPO) --env prod BACKEND_ECR_REPO_URL --body "$$BECR"; \
	    gh variable set -R $(REPO) --env prod BACKEND_ECS_CLUSTER --body "$$BCL"; \
	    gh variable set -R $(REPO) --env prod BACKEND_ECS_SERVICE --body "$$BSV"; \
	    gh variable set -R $(REPO) --env prod BACKEND_API_BASE_URL --body "$$BAPI"; \
	    echo "Synced prod ECS backend deploy env vars"; \
	  fi; \
	  FDR=$$($(TF) output -raw frontend_deploy_role_arn 2>/dev/null); \
	  if [ -n "$$FDR" ]; then \
	    gh variable set -R $(REPO) --env prod FRONTEND_DEPLOY_ROLE_ARN --body "$$FDR"; \
	    echo "Synced prod FRONTEND_DEPLOY_ROLE_ARN"; \
	  fi; \
	  FSN=$$($(TF) output -raw frontend_server_lambda_name 2>/dev/null); \
	  if [ -n "$$FSN" ]; then \
	    FIN=$$($(TF) output -raw frontend_image_lambda_name); \
	    FAPP=$$($(TF) output -raw frontend_app_url); \
	    FDOM=$$($(TF) output -raw frontend_domain); \
	    CRED=$$($(TF) output -raw cognito_redirect_uri); \
	    CLOU=$$($(TF) output -raw cognito_logout_uri); \
	    BBU=$$($(TF) output -json github_prod_frontend_serverless_vars 2>/dev/null | jq -r '.BACKEND_BASE_URL // empty'); \
	    gh variable set -R $(REPO) --env prod FRONTEND_SERVER_LAMBDA_NAME --body "$$FSN"; \
	    gh variable set -R $(REPO) --env prod FRONTEND_IMAGE_LAMBDA_NAME --body "$$FIN"; \
	    gh variable set -R $(REPO) --env prod FRONTEND_APP_URL --body "$$FAPP"; \
	    gh variable set -R $(REPO) --env prod FRONTEND_DOMAIN --body "$$FDOM"; \
	    gh variable set -R $(REPO) --env prod COGNITO_REDIRECT_URI --body "$$CRED"; \
	    gh variable set -R $(REPO) --env prod COGNITO_LOGOUT_URI --body "$$CLOU"; \
	    if [ -n "$$BBU" ]; then \
	      gh variable set -R $(REPO) --env prod BACKEND_BASE_URL --body "$$BBU"; \
	    fi; \
	    echo "Synced prod OpenNext frontend deploy env vars"; \
	  fi

deploy-dev:
	@echo "Dev CD deploy is disabled. Use make dev for local development; CI runs tests/build only."
	@exit 1

deploy-prod:
	@command -v gh >/dev/null || (echo "Missing gh CLI"; exit 1)
	gh workflow run "Frontend Deploy (prod)" -R $(REPO)

# ------------------------------------------------------------------------------
# Database / migrations
# ------------------------------------------------------------------------------
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

dev-seed:
	@echo "Seeding dev data (domain tables + financial_events backfill)"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run seed:dev

dev-seed-verify:
	@echo "Verifying dev seed / event-backed Financials mock data"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run seed:verify

dev-reset:
	@echo "Resetting local DB (schema), migrating, and seeding (dev only)"
	@$(MAKE) dev-db-up
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" bash backend/scripts/db-reset.sh

dev-backfill-financial-events:
	@echo "Backfilling financial_events from domain tables (local dev only)"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run backfill:financial-events

dev-scenario:
ifndef SCENARIO
	$(error SCENARIO is required, e.g. make dev-scenario SCENARIO=shows-typical-week)
endif
	@echo "Loading workspace scenario: $(SCENARIO)"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run scenario:run -- $(SCENARIO)

dev-scenario-list:
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run scenario:list

dev-scenario-reset:
	@echo "Clearing workspace scenario namespace (dev only)"
	@DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" npm --prefix backend run scenario:reset

# ------------------------------------------------------------------------------
# Local dev / app run
# ------------------------------------------------------------------------------
check-cognito-env:
	@missing=""; \
	read_frontend_var() { \
	  key="$$1"; env_val="$$2"; \
	  if [ -n "$$env_val" ]; then printf '%s' "$$env_val"; return; fi; \
	  [ -f frontend/.env.local ] || return; \
	  awk -v k="$$key" ' \
	    /^[[:space:]]*#/ { next } /^[[:space:]]*$$/ { next } \
	    { line=$$0; if (line ~ "^[[:space:]]*" k "[[:space:]]*=") { \
	      sub("^[[:space:]]*" k "[[:space:]]*=[[:space:]]*", "", line); sub(/\r$$/, "", line); print line; exit } } \
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
	  if [ -f scripts/dev/print-cognito-env-help.sh ]; then sh scripts/dev/print-cognito-env-help.sh; fi; \
	  exit 1; \
	fi; \
	if [ "$$frontend_redirect_uri" != "http://localhost:3001/api/auth/callback" ]; then \
	  echo "COGNITO_REDIRECT_URI must be http://localhost:3001/api/auth/callback for make dev-cognito."; exit 1; \
	fi; \
	if [ "$$frontend_backend_base" != "http://localhost:3000/api" ]; then \
	  echo "BACKEND_BASE_URL must be http://localhost:3000/api for make dev-cognito."; exit 1; \
	fi

dev-api:
	@echo "Starting backend on http://0.0.0.0:3000 (dev_bypass)"
	@if grep -qi microsoft /proc/version 2>/dev/null; then \
	  echo "WSL detected — backend file polling enabled (nodemon --legacy-watch)"; \
	  dev_script=dev:poll; \
	else \
	  dev_script=dev; \
	fi; \
	PORT=3000 \
	 DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" \
	 AUTH_MODE="$${AUTH_MODE:-$(LOCAL_AUTH_MODE)}" \
	 AUTH_DEV_BYPASS_USER_ID="$${AUTH_DEV_BYPASS_USER_ID:-$(LOCAL_AUTH_USER_ID)}" \
	 AUTH_DEV_BYPASS_EMAIL="$${AUTH_DEV_BYPASS_EMAIL:-$(LOCAL_AUTH_EMAIL)}" \
	 AUTH_DEV_BYPASS_ROLE="$${AUTH_DEV_BYPASS_ROLE:-$(LOCAL_AUTH_ROLE)}" \
	 npm --prefix backend run $$dev_script

dev-api-cognito: check-cognito-env
	@echo "Starting backend on http://0.0.0.0:3000 (cognito)"
	@if grep -qi microsoft /proc/version 2>/dev/null; then \
	  dev_script=dev:poll; \
	else \
	  dev_script=dev; \
	fi; \
	PORT=3000 \
	 DATABASE_URL="$${DATABASE_URL:-$(LOCAL_DB_URL)}" \
	 AUTH_MODE=cognito \
	 npm --prefix backend run $$dev_script

dev-ui:
	@echo "Starting frontend on http://0.0.0.0:3001 with /api proxy to localhost:3000"
	@if grep -qi microsoft /proc/version 2>/dev/null; then \
	  echo "WSL detected — frontend file polling enabled (webpack watchOptions.poll)"; \
	fi
	@$(DEV_POLL_ENV) NEXT_DEV_PORT=3001 NEXT_PUBLIC_BACKEND_URL=/api npm --prefix frontend run dev -- -H 0.0.0.0 -p 3001

dev-tmux:
	@if ! test -t 1 || ! command -v tmux >/dev/null 2>&1; then \
	  echo "Non-interactive shell detected; starting dev services without tmux..."; \
	  $(MAKE) dev-api & api_pid=$$!; trap 'kill $$api_pid 2>/dev/null || true' EXIT INT TERM; $(MAKE) dev-ui; \
	else \
	  if tmux has-session -t fefeave-dev 2>/dev/null; then tmux attach -t fefeave-dev; \
	  else \
	    tmux new-session -d -s fefeave-dev "cd $(CURDIR) && bash -lc 'make dev-api; rc=\$$?; echo; echo \"backend exited \$$rc\"; read -n 1 -s -r -p \"press any key\"'"; \
	    tmux split-window -h -t fefeave-dev "cd $(CURDIR) && make dev-ui"; \
	    tmux attach -t fefeave-dev; \
	  fi; \
	fi

dev-tmux-cognito:
	@if tmux has-session -t fefeave-dev 2>/dev/null; then tmux attach -t fefeave-dev; \
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

dev-down:
	@node frontend/scripts/dev/kill-dev-listeners.mjs
	@if command -v tmux >/dev/null 2>&1; then tmux kill-session -t fefeave-dev 2>/dev/null || true; fi
	@echo "Dev cleanup done."

# Clears corrupted Next dev cache after `npm run build` while dev-ui was still running.
# Keeps backend (:3000) and DB intact — only resets the Next UI process + `.next`.
dev-reset-frontend:
	@KILL_DEV_PORTS=3001 node frontend/scripts/dev/kill-dev-listeners.mjs
	@rm -rf frontend/.next
	@echo "Cleared frontend/.next (backend/DB untouched)."
	@echo "Starting UI on :3001 — wait for Next 'Ready' before screenshots."
	@$(MAKE) dev-ui

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
	  && NEXT_DEV_PORT=3000 DEV_BACKEND_ORIGIN="$$DEV_BACKEND_ORIGIN" npm run dev -- -H 0.0.0.0 -p 3000

dev-backend-health:
	@echo "Checking dev backend health endpoint"
	@terraform -chdir=infra workspace select dev >/dev/null
	@curl -i "$$(terraform -chdir=infra output -raw backend_api_base_url)/api/health" | head

dev-backend-wholesalers:
	@echo "Checking dev backend wholesaler balances endpoint"
	@terraform -chdir=infra workspace select dev >/dev/null
	@curl -s -o /dev/null -w "%{http_code}\n" "$$(terraform -chdir=infra output -raw backend_api_base_url)/api/wholesalers/balances"

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

dev:
	@$(MAKE) dev-db-up
	@$(MAKE) dev-migrate
	@$(MAKE) dev-tmux

dev-cognito:
	@$(MAKE) dev-db-up
	@$(MAKE) dev-migrate
	@$(MAKE) dev-tmux-cognito
