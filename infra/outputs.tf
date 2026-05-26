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

output "backend_deploy_role_arn" {
  description = "OIDC role ARN for GitHub Actions backend deploy (ECR push + ECS update)"
  value       = (var.create_github_deploy_role && var.create_backend_infra) ? aws_iam_role.gh_backend_deploy[0].arn : null
}

output "frontend_deploy_role_arn" {
  description = "OIDC role ARN for GitHub Actions frontend deploy (ECR push + ECS update)"
  value       = (var.create_github_deploy_role && var.create_backend_infra) ? aws_iam_role.gh_frontend_deploy[0].arn : null
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

output "frontend_app_base_url" {
  description = "Frontend app URL (ALB DNS root)"
  value       = var.create_backend_infra ? "http://${aws_lb.backend[0].dns_name}" : null
}

output "frontend_ecr_repo_url" {
  description = "ECR repository URL for frontend images"
  value       = var.create_backend_infra ? aws_ecr_repository.frontend[0].repository_url : null
}

output "frontend_ecs_cluster_name" {
  description = "ECS cluster name for frontend (GitHub Actions / CLI)"
  value       = var.create_backend_infra ? aws_ecs_cluster.backend[0].name : null
}

output "frontend_ecs_service_name" {
  description = "ECS service name for frontend (GitHub Actions / CLI)"
  value       = var.create_backend_infra ? aws_ecs_service.frontend[0].name : null
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = (var.create_backend_infra && var.create_rds) ? aws_db_instance.backend[0].endpoint : null
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN for DATABASE_URL (used by ECS task definition)"
  value       = (var.create_backend_infra && var.create_rds) ? aws_secretsmanager_secret.db_url[0].arn : null
}

# --- Serverless backend (Lambda + API Gateway) ---
output "backend_lambda_function_name" {
  description = "Backend Lambda function name"
  value       = var.create_serverless_backend ? aws_lambda_function.backend[0].function_name : null
}

output "backend_lambda_function_arn" {
  description = "Backend Lambda function ARN"
  value       = var.create_serverless_backend ? aws_lambda_function.backend[0].arn : null
}

output "backend_lambda_execution_role_arn" {
  description = "IAM execution role ARN for backend Lambda"
  value       = var.create_serverless_backend ? aws_iam_role.lambda_backend[0].arn : null
}

output "backend_api_gateway_url" {
  description = "API Gateway HTTP API invoke URL (append /api/... paths)"
  value       = var.create_serverless_backend ? aws_apigatewayv2_api.backend[0].api_endpoint : null
}

output "neon_database_url_secret_name" {
  description = "Secrets Manager secret name for Neon DATABASE_URL (populate after apply)"
  value       = var.create_serverless_backend ? aws_secretsmanager_secret.neon_database_url[0].name : null
}

output "neon_database_url_secret_arn" {
  description = "Secrets Manager ARN for Neon DATABASE_URL (populate after apply)"
  value       = var.create_serverless_backend ? aws_secretsmanager_secret.neon_database_url[0].arn : null
}

output "github_prod_backend_serverless_vars" {
  description = "Suggested GitHub prod environment variables for Phase 4/5 Lambda deploy workflows (non-secret)"
  value = var.create_serverless_backend ? {
    AWS_REGION                    = var.aws_region
    BACKEND_LAMBDA_FUNCTION_NAME  = aws_lambda_function.backend[0].function_name
    BACKEND_API_GATEWAY_URL       = aws_apigatewayv2_api.backend[0].api_endpoint
    NEON_DATABASE_URL_SECRET_NAME = aws_secretsmanager_secret.neon_database_url[0].name
    S3_ATTACHMENTS_BUCKET         = aws_s3_bucket.attachments.bucket
  } : null
}

# --- Cognito (DEV) ---
output "user_pool_id" {
  description = "Cognito User Pool ID for dev auth."
  value       = var.env == "dev" ? aws_cognito_user_pool.dev[0].id : null
}

output "app_client_id" {
  description = "Cognito App Client ID for dev auth."
  value       = var.env == "dev" ? aws_cognito_user_pool_client.dev[0].id : null
}

output "app_client_secret" {
  description = "Cognito App Client Secret for dev auth."
  value       = var.env == "dev" ? aws_cognito_user_pool_client.dev[0].client_secret : null
  sensitive   = true
}

output "cognito_domain" {
  description = "Full Cognito Hosted UI domain for dev auth."
  value       = var.env == "dev" ? "${aws_cognito_user_pool_domain.dev[0].domain}.auth.${var.aws_region}.amazoncognito.com" : null
}
