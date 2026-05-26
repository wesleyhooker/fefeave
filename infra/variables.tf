variable "project_name" {
  type        = string
  description = "Base project name."
  default     = "fefeave-frontend"
}

variable "env" {
  type        = string
  description = "Environment name (dev, prod, etc.)"
}

variable "aws_region" {
  type        = string
  description = "AWS region for S3/CF."
  default     = "us-west-2"
}

variable "github_repo" {
  type    = string
  default = "wesleyhooker/fefeave"
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "create_github_deploy_role" {
  type    = bool
  default = true
}

# --- Backend (ECS Fargate) ---
variable "create_backend_infra" {
  type        = bool
  description = "Create VPC, ECR, ALB, ECS, and (if create_rds) RDS for backend."
  default     = false
}

variable "create_serverless_backend" {
  type        = bool
  description = "Create Lambda + API Gateway HTTP API + Neon DATABASE_URL secret container for backend."
  default     = false
}

variable "lambda_memory_size" {
  type        = number
  description = "Lambda memory (MiB) for serverless backend."
  default     = 512
}

variable "lambda_timeout" {
  type        = number
  description = "Lambda timeout (seconds) for serverless backend."
  default     = 30
}

variable "api_prefix" {
  type        = string
  description = "Fastify API route prefix (must match API Gateway routes)."
  default     = "/api"
}

variable "cognito_region" {
  type        = string
  description = "Placeholder until prod Cognito exists; required when AUTH_MODE=cognito on Lambda."
  default     = "us-west-2"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Placeholder until prod Cognito User Pool ID is set on Lambda."
  default     = "REPLACE_ME"
}

variable "cognito_app_client_id" {
  type        = string
  description = "Placeholder until prod Cognito app client ID is set on Lambda."
  default     = "REPLACE_ME"
}

variable "backend_image_tag" {
  type        = string
  description = "Docker image tag for backend task definition (e.g. latest or git sha)."
  default     = "latest"
}

variable "backend_desired_count" {
  type        = number
  description = "Desired count for ECS backend service."
  default     = 1
}

variable "frontend_image_tag" {
  type        = string
  description = "Docker image tag for frontend task definition (e.g. dev-latest/prod-latest)."
  default     = "latest"
}

variable "frontend_desired_count" {
  type        = number
  description = "Desired count for ECS frontend service."
  default     = 1
}

variable "frontend_container_cpu" {
  type        = string
  description = "CPU units for frontend ECS task definition."
  default     = "256"
}

variable "frontend_container_memory" {
  type        = string
  description = "Memory (MiB) for frontend ECS task definition."
  default     = "512"
}

variable "frontend_next_public_backend_url" {
  type        = string
  description = "NEXT_PUBLIC_BACKEND_URL for frontend runtime."
  default     = "/api"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR for backend VPC (used when create_backend_infra is true)."
  default     = "10.0.0.0/16"
}

variable "alb_ingress_cidrs" {
  type        = list(string)
  description = "Allowed IPv4 CIDRs for backend ALB HTTP ingress when env=dev. Prod uses 0.0.0.0/0 in alb.tf (ignored for prod)."
  default     = []

  validation {
    condition     = var.env != "dev" || !var.create_backend_infra || length(var.alb_ingress_cidrs) > 0
    error_message = "For dev, set alb_ingress_cidrs to at least one explicit CIDR (for example [\"X.X.X.X/32\"])."
  }
}

# --- RDS (DEV) ---
variable "create_rds" {
  type        = bool
  description = "Create RDS Postgres and Secrets Manager secret for DATABASE_URL."
  default     = false
}

# --- Validations ---

check "backend_hosting_exclusive" {
  assert {
    condition     = !(var.create_backend_infra && var.create_serverless_backend)
    error_message = "create_backend_infra and create_serverless_backend are mutually exclusive."
  }
}

check "rds_requires_ecs_backend" {
  assert {
    condition     = !var.create_rds || var.create_backend_infra
    error_message = "create_rds requires create_backend_infra (RDS is not used with serverless backend)."
  }
}

variable "db_name" {
  type        = string
  description = "Postgres database name."
  default     = "fefeave"
}

variable "db_username" {
  type        = string
  description = "Postgres master username."
  default     = "fefeave"
  sensitive   = true
}
