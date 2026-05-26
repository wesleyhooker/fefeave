# Optional Route53 aliases when route53_zone_id is set. Current launch uses Cloudflare DNS instead.
#
# ACM for CloudFront MUST be in us-east-1. After ACM is ISSUED:
#   enable_frontend_custom_domain = true
#   acm_certificate_arn           = "arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
#   route53_zone_id               = null  # omit — add CNAME @ and www in Cloudflare
#
# See docs/deployment/route53-acm-cutover.md (Cloudflare DNS + ACM runbook)

resource "aws_route53_record" "frontend_apex" {
  count = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null) ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_apex_ipv6" {
  count = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null) ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  count = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null && var.frontend_www_domain != null && var.frontend_www_domain != "") ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_www_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www_ipv6" {
  count = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null && var.frontend_www_domain != null && var.frontend_www_domain != "") ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_www_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_extra_aliases" {
  for_each = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null) ? toset(var.frontend_domain_aliases) : toset([])

  zone_id = var.route53_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_extra_aliases_ipv6" {
  for_each = (var.create_serverless_frontend && var.enable_frontend_custom_domain && var.route53_zone_id != null) ? toset(var.frontend_domain_aliases) : toset([])

  zone_id = var.route53_zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.opennext[0].domain_name
    zone_id                = aws_cloudfront_distribution.opennext[0].hosted_zone_id
    evaluate_target_health = false
  }
}
