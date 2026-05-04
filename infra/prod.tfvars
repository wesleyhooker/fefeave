# AWS "prod" workspace — static hosting + attachments + IAM only until traffic justifies ECS/RDS.
# Build and run the app locally; use this stack for low-cost S3 + CloudFront (+ attachments).

env                       = "prod"
project_name              = "fefeave-frontend"
aws_region                = "us-west-2"
create_github_deploy_role = true

create_backend_infra = false
create_rds           = false

# If you later enable ECS in prod, set image tags / counts as needed.
frontend_image_tag               = "prod-latest"
frontend_desired_count           = 1
frontend_next_public_backend_url = "/api"
