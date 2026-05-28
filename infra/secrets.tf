# Secret containers only — never put secret values in Terraform. Populate with put-secret-value after apply.

resource "aws_secretsmanager_secret" "neon_database_url" {
  count       = var.create_serverless_backend ? 1 : 0
  name        = "fefeave-backend-${var.env}-neon-database-url"
  description = "Neon Postgres DATABASE_URL (pooler) for Lambda backend. Populate with put-secret-value after apply."
  tags        = local.tags
}

resource "aws_secretsmanager_secret" "frontend_auth_session" {
  count       = var.create_serverless_frontend ? 1 : 0
  name        = "fefeave-frontend-${var.env}-auth-session-secret"
  description = "AUTH_SESSION_SECRET for frontend server Lambda. Populate with put-secret-value; sync to Lambda env via scripts/prod/sync-lambda-env-from-secrets.sh."
  tags        = local.tags
}

resource "aws_secretsmanager_secret" "frontend_cognito_client" {
  count       = var.create_serverless_frontend ? 1 : 0
  name        = "fefeave-frontend-${var.env}-cognito-client-secret"
  description = "COGNITO_CLIENT_SECRET for frontend server Lambda. Populate with put-secret-value; sync to Lambda env via scripts/prod/sync-lambda-env-from-secrets.sh."
  tags        = local.tags
}
