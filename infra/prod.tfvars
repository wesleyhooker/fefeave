# AWS "prod" workspace — serverless backend (Lambda + API Gateway + Neon secret container).
# Plan/apply manually. Do not commit Neon URLs or secret values.
#
# Before first apply: cd backend && npm run package:lambda
# After apply: populate Neon DATABASE_URL (see docs/deployment/lambda-phase3.md)
# Cognito prod is NOT in Terraform — set cognito_* placeholders after manual pool setup.

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
enable_frontend_custom_domain = false # true only after ACM (us-east-1) is ISSUED
# acm_certificate_arn     = "arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
# route53_zone_id omitted — create apex/www CNAMEs in Cloudflare to cloudfront_distribution_domain

# Backend Cognito placeholders (update Lambda env or tfvars before auth works).
cognito_region        = "us-west-2"
cognito_user_pool_id  = "REPLACE_ME"
cognito_app_client_id = "REPLACE_ME"
