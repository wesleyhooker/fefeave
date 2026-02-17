output "s3_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "attachments_bucket_name" {
  value = aws_s3_bucket.attachments.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.cdn.id
}

output "backend_role_name" {
  value = aws_iam_role.backend.name
}

output "github_actions_role_arn" {
  value = try(aws_iam_role.gh_deploy[0].arn, null)
}

output "backend_deploy_role_arn" {
  description = "OIDC role ARN for GitHub Actions backend deploy (ECR push + ECS update)"
  value       = (var.create_github_deploy_role && var.create_backend_infra) ? aws_iam_role.gh_backend_deploy[0].arn : null
}

# --- Backend (ECS / ALB / ECR / RDS) ---
output "backend_api_base_url" {
  description = "Backend API base URL (ALB DNS name); use http://<this>/api"
  value       = var.create_backend_infra ? "http://${aws_lb.backend[0].dns_name}" : null
}

output "backend_ecr_repo_url" {
  description = "ECR repository URL for backend images"
  value       = var.create_backend_infra ? aws_ecr_repository.backend[0].repository_url : null
}

output "backend_ecr_repository_arn" {
  description = "ECR repository ARN (for IAM/policies)"
  value       = var.create_backend_infra ? aws_ecr_repository.backend[0].arn : null
}

output "backend_ecs_cluster_name" {
  description = "ECS cluster name for backend (GitHub Actions / CLI)"
  value       = var.create_backend_infra ? aws_ecs_cluster.backend[0].name : null
}

output "backend_ecs_service_name" {
  description = "ECS service name for backend (GitHub Actions / CLI)"
  value       = var.create_backend_infra ? aws_ecs_service.backend[0].name : null
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = (var.create_backend_infra && var.create_rds) ? aws_db_instance.backend[0].endpoint : null
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN for DATABASE_URL (used by ECS task definition)"
  value       = (var.create_backend_infra && var.create_rds) ? aws_secretsmanager_secret.db_url[0].arn : null
}
