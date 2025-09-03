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
