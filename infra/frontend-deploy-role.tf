# --- GitHub Actions OIDC deploy role for FRONTEND (ECR push + ECS deploy) ---

resource "aws_iam_role" "gh_frontend_deploy" {
  count = (var.create_github_deploy_role && var.create_backend_infra) ? 1 : 0
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

resource "aws_iam_role_policy" "gh_frontend_deploy_inline" {
  count = (var.create_github_deploy_role && var.create_backend_infra) ? 1 : 0
  name  = "fefeave-frontend-deploy-${var.env}-inline"
  role  = aws_iam_role.gh_frontend_deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ECRAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages"
        ]
        Resource = [aws_ecr_repository.frontend[0].arn]
      },
      {
        Sid    = "ECSDescribeUpdate"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService"
        ]
        Resource = ["arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.backend[0].name}/${aws_ecs_service.frontend[0].name}"]
      },
      {
        Sid      = "ECSTaskDefDescribe"
        Effect   = "Allow"
        Action   = ["ecs:DescribeTaskDefinition"]
        Resource = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/fefeave-frontend-${var.env}:*"
      },
      {
        Sid      = "ECSTaskDefRegister"
        Effect   = "Allow"
        Action   = ["ecs:RegisterTaskDefinition"]
        Resource = "*"
      },
      {
        Sid      = "PassRoleExecution"
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.backend_execution[0].arn, aws_iam_role.backend.arn]
        Condition = {
          StringEquals = { "iam:PassedToService" = "ecs-tasks.amazonaws.com" }
        }
      }
    ]
  })
}
