/*
  Terraform module: dev environment
  Files:
    - providers.tf    → AWS provider (us-west-2). us-east-1 provider will be added later for ACM/CloudFront.
    - s3.tf           → S3 bucket + website config
    - cloudfront.tf   → CloudFront distribution + OAC
    - s3_policy.tf    → Bucket policy
    - iam_gh_oidc.tf  → GitHub OIDC IAM role + trust
    - outputs.tf      → Exposed outputs for CI/CD
*/
