output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend_dev.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend_dev.bucket
}

output "github_actions_role_arn" {
  value = aws_iam_role.gha_deploy.arn
}

# infra/dev/outputs.tf
output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend_dev.domain_name
}
