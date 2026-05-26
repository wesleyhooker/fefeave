# Neon DATABASE_URL secret container (no value in Terraform — populate after apply).

resource "aws_secretsmanager_secret" "neon_database_url" {
  count       = var.create_serverless_backend ? 1 : 0
  name        = "fefeave-backend-${var.env}-neon-database-url"
  description = "Neon Postgres DATABASE_URL (pooler) for Lambda backend. Populate with put-secret-value after apply."
  tags        = local.tags
}
