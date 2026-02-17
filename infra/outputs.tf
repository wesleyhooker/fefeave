output "s3_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "attachments_bucket_name" {
  value = aws_s3_bucket.attachments.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.cdn.id
}

output "backend_role_name" {
  value = aws_iam_role.backend.name
}

output "github_actions_role_arn" {
  value = try(aws_iam_role.gh_deploy[0].arn, null)
}
