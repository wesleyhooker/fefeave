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
  type        = string
  default     = "wesleyhooker/fefeave"
}

variable "github_branch" {
  type        = string
  default     = "main"
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

variable "vpc_cidr" {
  type        = string
  description = "CIDR for backend VPC (used when create_backend_infra is true)."
  default     = "10.0.0.0/16"
}

# --- RDS (DEV) ---
variable "create_rds" {
  type        = bool
  description = "Create RDS Postgres and Secrets Manager secret for DATABASE_URL."
  default     = false
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
