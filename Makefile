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

.DEFAULT_GOAL := help

.PHONY: help init ws-dev ws-prod plan-dev apply-dev plan-prod apply-prod output-dev output-prod gh-sync-dev gh-sync-prod deploy-dev deploy-prod dev-plan dev-apply ui-aws dev-backend-health dev-backend-wholesalers dev-migrate test

help:
	@echo "Available targets:"
	@echo "  dev-plan                 Terraform plan for dev workspace"
	@echo "  dev-apply                Terraform apply for dev workspace"
	@echo "  ui-aws                   Run frontend dev against AWS backend via /api proxy"
	@echo "  dev-migrate              Run backend DB migrations in AWS dev (ECS one-off task)"
	@echo "  dev-backend-health       Curl /api/health on dev backend ALB"
	@echo "  dev-backend-wholesalers  Check /api/wholesalers/balances status code"
	@echo "  test                     Run backend tests and frontend build"
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

dev-migrate:
	@echo "Running dev DB migrations via ECS one-off task"
	@if command -v gh >/dev/null 2>&1; then \
	  echo "Triggering GitHub workflow: Run Migrations (dev)"; \
	  gh workflow run "Run Migrations (dev)" -R $(REPO) --ref main; \
	  run_id=$$(gh run list -R $(REPO) --workflow "Run Migrations (dev)" --limit 1 --json databaseId --jq '.[0].databaseId'); \
	  echo "Watching workflow run $$run_id"; \
	  gh run watch $$run_id -R $(REPO) --exit-status; \
	else \
	  echo "gh CLI not found; running migration task locally with AWS CLI"; \
	  cluster=$$(terraform -chdir=infra workspace select dev >/dev/null 2>&1; terraform -chdir=infra output -raw backend_ecs_cluster_name); \
	  service=$$(terraform -chdir=infra output -raw backend_ecs_service_name); \
	  task_def_arn=$$(aws ecs describe-services --region $(AWS_REGION) --cluster "$$cluster" --services "$$service" --query 'services[0].taskDefinition' --output text); \
	  subnets=$$(aws ecs describe-services --region $(AWS_REGION) --cluster "$$cluster" --services "$$service" --query 'services[0].networkConfiguration.awsvpcConfiguration.subnets' --output text | tr '\t' ','); \
	  sgs=$$(aws ecs describe-services --region $(AWS_REGION) --cluster "$$cluster" --services "$$service" --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups' --output text | tr '\t' ','); \
	  assign_public_ip=$$(aws ecs describe-services --region $(AWS_REGION) --cluster "$$cluster" --services "$$service" --query 'services[0].networkConfiguration.awsvpcConfiguration.assignPublicIp' --output text); \
	  task_arn=$$(aws ecs run-task --region $(AWS_REGION) --cluster "$$cluster" --launch-type FARGATE --task-definition "$$task_def_arn" --network-configuration "awsvpcConfiguration={subnets=[$$subnets],securityGroups=[$$sgs],assignPublicIp=$$assign_public_ip}" --overrides '{"containerOverrides":[{"name":"backend","command":["npm","run","migrate:up"]}]}' --query 'tasks[0].taskArn' --output text); \
	  echo "Started task $$task_arn"; \
	  aws ecs wait tasks-stopped --region $(AWS_REGION) --cluster "$$cluster" --tasks "$$task_arn"; \
	  exit_code=$$(aws ecs describe-tasks --region $(AWS_REGION) --cluster "$$cluster" --tasks "$$task_arn" --query 'tasks[0].containers[0].exitCode' --output text); \
	  echo "Migration task exit code: $$exit_code"; \
	  test "$$exit_code" = "0"; \
	fi

test:
	@echo "Running backend tests"
	@cd backend && npm test
	@echo "Running frontend build"
	@cd frontend && npm run build
