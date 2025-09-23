data "aws_caller_identity" "current" {}

locals {
  bucket_name = "${var.project_name}-${var.env}"
  cf_comment  = "${var.project_name}-${var.env}"
  tags = {
    Project     = var.project_name
    Environment = var.env
    Owner       = "wesley"
  }
}

# --- S3 bucket ---
resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- CloudFront OAC ---
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${local.cf_comment}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  comment             = local.cf_comment
  default_root_object = "index.html"

  origin {
    domain_name              = "${aws_s3_bucket.site.bucket}.s3.${var.aws_region}.amazonaws.com"
    origin_id                = "s3-${aws_s3_bucket.site.bucket}"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
  geo_restriction {
    restriction_type = "none"
  }
}
  viewer_certificate { cloudfront_default_certificate = true }
  tags = local.tags
}

# --- Bucket policy (OAC SourceArn) ---
data "aws_iam_policy_document" "site_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals {
  type        = "Service"
  identifiers = ["cloudfront.amazonaws.com"]
}
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.cdn.id}"]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_policy.json
}

# --- GitHub OIDC Provider (data source) ---
data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_deploy_role ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

# --- GitHub OIDC deploy role ---
resource "aws_iam_role" "gh_deploy" {
  count              = var.create_github_deploy_role ? 1 : 0
  name               = "${var.project_name}-deploy-${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = data.aws_iam_openid_connect_provider.github[0].arn
      }
      Condition = {
        StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
        StringLike   = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/${var.github_branch}" }
      }
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy" "gh_inline" {
  count  = var.create_github_deploy_role ? 1 : 0
  name   = "${var.project_name}-deploy-${var.env}-inline"
  role   = aws_iam_role.gh_deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Sid = "S3List", Action = ["s3:ListBucket"], Effect = "Allow", Resource = [aws_s3_bucket.site.arn] },
      { Sid = "S3RW",   Action = ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:PutObjectAcl"], Effect = "Allow", Resource = ["${aws_s3_bucket.site.arn}/*"] },
      { Sid = "CFInvalidate", Action = ["cloudfront:CreateInvalidation"], Effect = "Allow",
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.cdn.id}" }
    ]
  })
}
