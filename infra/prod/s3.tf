resource "aws_s3_bucket" "frontend_dev" {
  bucket        = "fefeave-frontend-dev"
  force_destroy = true

  tags = {
    Project     = "fefeave"
    Environment = "dev"
    Owner       = "wesley"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_dev" {
  bucket = aws_s3_bucket.frontend_dev.id

  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}
