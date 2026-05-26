# GitHub OIDC deploy role for serverless backend (Lambda code update only).

resource "aws_iam_role" "gh_backend_serverless_deploy" {
  count = (var.create_github_deploy_role && var.create_serverless_backend) ? 1 : 0
  name  = "fefeave-backend-deploy-${var.env}"
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

resource "aws_iam_role_policy" "gh_backend_serverless_deploy_inline" {
  count = (var.create_github_deploy_role && var.create_serverless_backend) ? 1 : 0
  name  = "fefeave-backend-deploy-${var.env}-lambda-inline"
  role  = aws_iam_role.gh_backend_serverless_deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "LambdaUpdate"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:PublishVersion"
        ]
        Resource = [aws_lambda_function.backend[0].arn]
      }
    ]
  })
}
