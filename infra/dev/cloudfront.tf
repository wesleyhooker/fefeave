resource "aws_cloudfront_origin_access_control" "frontend_dev" {
  name                              = "fefeave-frontend-dev-oac"
  description                       = "OAC for fefeave frontend dev"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend_dev" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend_dev.bucket_regional_domain_name
    origin_id                = "fefeaveFrontendS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_dev.id
  }

  default_cache_behavior {
    target_origin_id       = "fefeaveFrontendS3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }

  tags = {
    Project     = "fefeave"
    Environment = "dev"
    Owner       = "wesley"
  }
}
