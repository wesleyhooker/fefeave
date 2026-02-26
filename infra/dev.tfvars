env                       = "dev"
project_name              = "fefeave-frontend"
aws_region                = "us-west-2"
create_github_deploy_role = true

# Backend (ECS Fargate + RDS) for DEV
create_backend_infra  = true
backend_image_tag     = "dev-latest"
backend_desired_count = 1
frontend_image_tag    = "dev-latest"
frontend_desired_count = 1
frontend_next_public_backend_url = "/api"
create_rds            = true
db_name               = "fefeave"
db_username           = "fefeave"
