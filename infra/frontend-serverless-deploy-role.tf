# GitHub OIDC deploy role for OpenNext frontend (S3 assets + Lambda code + CF invalidation).

resource "aws_iam_role" "gh_frontend_serverless_deploy" {
  count = (var.create_github_deploy_role && var.create_serverless_frontend) ? 1 : 0
  name  = "fefeave-frontend-deploy-${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github[0].arn
        }
        Condition = {
          StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
          StringLike   = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/${var.github_branch}" }
        }
      },
      {
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github[0].arn
        }
        Condition = {
          StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
          StringLike   = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:environment:${var.env}" }
        }
      }
    ]
  })
  tags = local.tags
}

resource "aws_iam_role_policy" "gh_frontend_serverless_deploy_inline" {
  count = (var.create_github_deploy_role && var.create_serverless_frontend) ? 1 : 0
  name  = "fefeave-frontend-deploy-${var.env}-opennext-inline"
  role  = aws_iam_role.gh_frontend_serverless_deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Assets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.site.arn,
          "${aws_s3_bucket.site.arn}/*"
        ]
      },
      {
        Sid    = "LambdaUpdate"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:PublishVersion"
        ]
        Resource = [
          aws_lambda_function.frontend_server[0].arn,
          aws_lambda_function.frontend_image[0].arn
        ]
      },
      {
        Sid      = "CloudFrontInvalidate"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = aws_cloudfront_distribution.opennext[0].arn
      }
    ]
  })
}
