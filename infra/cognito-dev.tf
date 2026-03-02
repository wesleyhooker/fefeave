locals {
  create_cognito_dev = var.env == "dev"
}

resource "random_string" "cognito_domain_suffix" {
  count   = local.create_cognito_dev ? 1 : 0
  length  = 6
  upper   = false
  special = false
}

resource "aws_cognito_user_pool" "dev" {
  count = local.create_cognito_dev ? 1 : 0
  name  = "fefeave-dev"
}

resource "aws_cognito_user_pool_client" "dev" {
  count        = local.create_cognito_dev ? 1 : 0
  name         = "fefeave-dev-client"
  user_pool_id = aws_cognito_user_pool.dev[0].id

  generate_secret = true

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = ["http://localhost:3001/api/auth/callback"]
  logout_urls   = ["http://localhost:3001/login"]
}

resource "aws_cognito_user_pool_domain" "dev" {
  count        = local.create_cognito_dev ? 1 : 0
  domain       = "fefeave-dev-${random_string.cognito_domain_suffix[0].result}"
  user_pool_id = aws_cognito_user_pool.dev[0].id
}
