# Fastify backend on Lambda (Phase 2 handler: dist/lambda.handler).
#
# Ownership: Terraform = function shell (IAM, memory, timeout, log group, API wiring).
# Code = Backend Deploy (prod) workflow (aws lambda update-function-code).
# Runtime secrets = operator CLI / scripts (see docs/deployment/prod-secrets.md).

locals {
  lambda_zip_path = "${path.module}/../backend/lambda.zip"
}

resource "aws_cloudwatch_log_group" "lambda_backend" {
  count             = var.create_serverless_backend ? 1 : 0
  name              = "/aws/lambda/fefeave-backend-${var.env}"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_lambda_function" "backend" {
  count = var.create_serverless_backend ? 1 : 0

  function_name = "fefeave-backend-${var.env}"
  role          = aws_iam_role.lambda_backend[0].arn
  handler       = "dist/lambda.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  filename         = local.lambda_zip_path
  source_code_hash = filebase64sha256(local.lambda_zip_path)

  environment {
    variables = {
      NODE_ENV              = "production"
      AUTH_MODE             = "cognito"
      API_PREFIX            = var.api_prefix
      S3_ATTACHMENTS_BUCKET = aws_s3_bucket.attachments.bucket
      COGNITO_REGION        = var.cognito_region
      COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
      COGNITO_APP_CLIENT_ID = var.cognito_app_client_id
    }
  }

  # DATABASE_URL: store in neon_database_url Secrets Manager secret, then inject
  # into Lambda env via get-secret-value + update-function-configuration (merge).
  # There is no --secrets flag on the Lambda CLI. See docs/deployment/lambda-phase3.md

  depends_on = [
    aws_iam_role_policy_attachment.lambda_backend_basic,
    aws_iam_role_policy.lambda_backend_logs,
    aws_iam_role_policy.lambda_backend_neon_secret,
    aws_iam_role_policy.lambda_backend_attachments,
  ]

  # Code + env are updated outside Terraform (deploy workflow + operator scripts).
  lifecycle {
    ignore_changes = [
      environment,
      filename,
      source_code_hash,
      s3_bucket,
      s3_key,
    ]
  }

  tags = local.tags
}
