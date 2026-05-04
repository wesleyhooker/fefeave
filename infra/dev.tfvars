# AWS "dev" workspace — low-cost shared resources only.
# Day-to-day development is local (Docker / Cursor): use `make dev`, `make dev-db-up`, etc.
# This file intentionally does NOT provision NAT, ALB, ECS, or RDS. Turn those on only
# when you need AWS-hosted runtime again (traffic/cost tradeoff).

env                       = "dev"
project_name              = "fefeave-frontend"
aws_region                = "us-west-2"
create_github_deploy_role = true

create_backend_infra = false
create_rds           = false

# --- Opt-in later: AWS-hosted backend (VPC, NAT, ALB, ECS, ECR) + optional RDS ---
# create_backend_infra             = true
# create_rds                       = true
# backend_image_tag                = "dev-latest"
# backend_desired_count            = 1
# frontend_image_tag               = "dev-latest"
# frontend_desired_count           = 1
# frontend_next_public_backend_url = "/api"
# db_name                          = "fefeave"
# db_username                      = "fefeave"
# alb_ingress_cidrs                = ["YOUR.PUBLIC.IP/32"]  # required when env=dev and ALB exists
