# AWS "prod" workspace — low-traffic full app on ECS + RDS behind ALB.
# Plan/apply manually; prod deploy workflows are workflow_dispatch only.
#
# Cognito is NOT created by Terraform in prod (see cognito-dev.tf; env == "dev" only).
# After apply, create a prod User Pool (console or future cognito-prod.tf) and inject
# COGNITO_* / AUTH_SESSION_SECRET into ECS task definitions — see docs/deployment/prod-release.md.
#
# RDS: instance_class is db.t3.micro in rds.tf (smallest practical Postgres 16, ~20 GiB).
# ALB: prod HTTP ingress is 0.0.0.0/0 (alb.tf); alb_ingress_cidrs applies only when env=dev.

env                       = "prod"
project_name              = "fefeave-frontend"
aws_region                = "us-west-2"
create_github_deploy_role = true

create_backend_infra = true
create_rds           = true

backend_image_tag                = "prod-latest"
backend_desired_count            = 1
frontend_image_tag               = "prod-latest"
frontend_desired_count           = 1
frontend_next_public_backend_url = "/api"

db_name     = "fefeave"
db_username = "fefeave"
