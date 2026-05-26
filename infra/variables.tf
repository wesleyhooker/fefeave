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

variable "create_serverless_frontend" {
  type        = bool
  description = "Create OpenNext frontend (Lambda + multi-origin CloudFront). Replaces static-only CDN."
  default     = false
}

variable "frontend_domain" {
  type        = string
  description = "Production apex domain for CloudFront aliases and Cognito URLs (e.g. fefeave.com)."
  default     = "fefeave.com"
}

variable "frontend_www_domain" {
  type        = string
  description = "Optional www alias for CloudFront (e.g. www.fefeave.com). Set empty string to omit."
  default     = "www.fefeave.com"
}

variable "frontend_domain_aliases" {
  type        = list(string)
  description = "Additional CloudFront aliases beyond apex and www (usually empty)."
  default     = []
}

variable "cognito_redirect_uri" {
  type        = string
  description = "Cognito app client callback URL (must match Hosted UI config exactly)."
  default     = "https://fefeave.com/api/auth/callback"
}

variable "cognito_logout_uri" {
  type        = string
  description = "Cognito app client sign-out URL (must match Hosted UI config exactly)."
  default     = "https://fefeave.com/login"
}

variable "enable_frontend_custom_domain" {
  type        = bool
  description = "Attach ACM cert + CloudFront aliases. Requires validated acm_certificate_arn (us-east-1)."
  default     = false
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 for CloudFront. Set after DNS validation; leave null until cutover."
  default     = null
}

variable "frontend_server_lambda_memory" {
  type        = number
  description = "Memory (MiB) for OpenNext server Lambda."
  default     = 1024
}

variable "frontend_server_lambda_timeout" {
  type        = number
  description = "Timeout (seconds) for OpenNext server Lambda."
  default     = 30
}

variable "frontend_image_lambda_memory" {
  type        = number
  description = "Memory (MiB) for OpenNext image optimization Lambda."
  default     = 512
}

variable "frontend_image_lambda_timeout" {
  type        = number
  description = "Timeout (seconds) for OpenNext image optimization Lambda."
  default     = 30
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

check "frontend_serverless_needs_backend" {
  assert {
    condition     = !var.create_serverless_frontend || var.create_serverless_backend
    error_message = "create_serverless_frontend requires create_serverless_backend for BACKEND_BASE_URL / API Gateway."
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
