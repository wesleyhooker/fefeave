resource "aws_s3_bucket_policy" "frontend_dev" {
  bucket = aws_s3_bucket.frontend_dev.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipalReadOnly",
      Effect    = "Allow",
      Principal = { Service = "cloudfront.amazonaws.com" },
      Action    = ["s3:GetObject"],
      Resource  = "${aws_s3_bucket.frontend_dev.arn}/*",
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend_dev.arn
        }
      }
    }]
  })
}
