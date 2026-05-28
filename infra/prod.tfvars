# AWS "prod" workspace — serverless backend (Lambda + API Gateway + Neon secret container).
# Plan/apply manually. Do not commit Neon URLs or secret values.
#
# Before first apply: cd backend && npm run package:lambda
# After apply: populate Neon DATABASE_URL (see docs/deployment/lambda-phase3.md)
# Cognito prod is NOT in Terraform — set cognito_* after pool setup (groups ADMIN/OPERATOR/WHOLESALER; see docs/deployment/cognito-prod-bootstrap.md).

env                       = "prod"
project_name              = "fefeave-frontend"
aws_region                = "us-west-2"
create_github_deploy_role = true

create_backend_infra       = false
create_rds                 = false
create_serverless_backend  = true
create_serverless_frontend = true

# Custom domain (Cognito + final URLs). DNS: Cloudflare (not Route53). See docs/deployment/route53-acm-cutover.md
frontend_domain               = "fefeave.com"
frontend_www_domain           = "www.fefeave.com"
frontend_domain_aliases       = []
cognito_redirect_uri          = "https://fefeave.com/api/auth/callback"
cognito_logout_uri            = "https://fefeave.com/login"
enable_frontend_custom_domain = true
acm_certificate_arn           = "arn:aws:acm:us-east-1:356892335988:certificate/8e668416-b1ed-453c-a383-a33ae0ad8d18"
# route53_zone_id omitted — create apex/www CNAMEs in Cloudflare to cloudfront_distribution_domain

# Backend Cognito placeholders (update Lambda env or tfvars before auth works).
cognito_region        = "us-west-2"
cognito_user_pool_id  = "us-west-2_pGDWIC7xK"
cognito_app_client_id = "14s9ol7f8mpcbjd7dhls1ecttk"

# Cost guardrails (prod only; see monitoring.tf + budgets.tf)
enable_cost_alerts = true
alert_email        = "wesleyhooker@outlook.com"
monthly_budget_usd = 20
