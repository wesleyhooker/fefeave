# OpenNext multi-origin CloudFront (no global SPA fallback on /api).

resource "aws_cloudfront_origin_access_control" "lambda_server" {
  count                             = var.create_serverless_frontend ? 1 : 0
  name                              = "fefeave-frontend-server-${var.env}"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "lambda_image" {
  count                             = var.create_serverless_frontend ? 1 : 0
  name                              = "fefeave-frontend-image-${var.env}"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  frontend_www_aliases = var.frontend_www_domain != null && var.frontend_www_domain != "" ? [var.frontend_www_domain] : []
  cloudfront_aliases = var.create_serverless_frontend && var.enable_frontend_custom_domain ? concat(
    [var.frontend_domain],
    local.frontend_www_aliases,
    var.frontend_domain_aliases
  ) : []
}

resource "aws_cloudfront_distribution" "opennext" {
  count               = var.create_serverless_frontend ? 1 : 0
  enabled             = true
  comment             = "${local.cf_comment}-opennext"
  default_root_object = ""
  aliases             = local.cloudfront_aliases
  price_class         = "PriceClass_100"

  origin {
    domain_name              = local.frontend_server_origin_domain
    origin_id                = "lambda-server"
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda_server[0].id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name              = local.frontend_image_origin_domain
    origin_id                = "lambda-image"
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda_image[0].id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-assets"
    origin_path              = "/_assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Default: OpenNext server (SSR, /api, /admin, /portal, /login). No SPA index.html fallback.
  default_cache_behavior {
    target_origin_id       = "lambda-server"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "lambda-server"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  ordered_cache_behavior {
    path_pattern           = "/_next/image*"
    target_origin_id       = "lambda-image"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
  }

  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  }

  ordered_cache_behavior {
    path_pattern           = "/_next/*"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  ordered_cache_behavior {
    path_pattern           = "/BUILD_ID"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  ordered_cache_behavior {
    path_pattern           = "/images/*"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  ordered_cache_behavior {
    path_pattern           = "/icons/*"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  ordered_cache_behavior {
    path_pattern           = "/fefe-ave-logo.png"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  ordered_cache_behavior {
    path_pattern           = "/fefe-bird-icon.png"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  dynamic "viewer_certificate" {
    for_each = var.enable_frontend_custom_domain ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.enable_frontend_custom_domain ? [] : [1]
    content {
      cloudfront_default_certificate = true
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = local.tags
}

resource "aws_lambda_permission" "cloudfront_frontend_server" {
  count = var.create_serverless_frontend ? 1 : 0

  statement_id           = "AllowCloudFrontInvokeUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.frontend_server[0].function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.opennext[0].arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "cloudfront_frontend_server_invoke" {
  count = var.create_serverless_frontend ? 1 : 0

  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.frontend_server[0].function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.opennext[0].arn
}

resource "aws_lambda_permission" "cloudfront_frontend_image" {
  count = var.create_serverless_frontend ? 1 : 0

  statement_id           = "AllowCloudFrontInvokeUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.frontend_image[0].function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.opennext[0].arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "cloudfront_frontend_image_invoke" {
  count = var.create_serverless_frontend ? 1 : 0

  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.frontend_image[0].function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.opennext[0].arn
}
