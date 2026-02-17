# --- GitHub Actions OIDC deploy role for BACKEND (ECR push + ECS deploy) ---
# Mirrors frontend deploy role trust pattern; scoped to backend ECR + ECS only.
# Created only when both GitHub OIDC provider and backend infra exist.

resource "aws_iam_role" "gh_backend_deploy" {
  count              = (var.create_github_deploy_role && var.create_backend_infra) ? 1 : 0
  name               = "fefeave-backend-deploy-${var.env}"
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

resource "aws_iam_role_policy" "gh_backend_deploy_inline" {
  count  = (var.create_github_deploy_role && var.create_backend_infra) ? 1 : 0
  name   = "fefeave-backend-deploy-${var.env}-inline"
  role   = aws_iam_role.gh_backend_deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # A) ECR: GetAuthorizationToken is account-level (no resource)
      {
        Sid      = "ECRAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      # A) ECR: push/describe only the backend ECR repo
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
        Resource = [aws_ecr_repository.backend[0].arn]
      },
      # B) ECS: describe/update backend service only (long ARN: service/cluster-name/service-name)
      {
        Sid    = "ECSDescribeUpdate"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService"
        ]
        Resource = ["arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.backend[0].name}/${aws_ecs_service.backend[0].name}"]
      },
      # B) ECS: task definition - Describe scoped to backend family; RegisterTaskDefinition has no resource scope in IAM
      {
        Sid      = "ECSTaskDefDescribe"
        Effect   = "Allow"
        Action   = ["ecs:DescribeTaskDefinition"]
        Resource = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/fefeave-backend-${var.env}:*"
      },
      {
        Sid      = "ECSTaskDefRegister"
        Effect   = "Allow"
        Action   = ["ecs:RegisterTaskDefinition"]
        Resource = "*"
      },
      # C) IAM: PassRole only for the backend task EXECUTION role (so ECS can run tasks)
      {
        Sid      = "PassRoleExecution"
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.backend_execution[0].arn]
        Condition = {
          StringEquals = { "iam:PassedToService" = "ecs-tasks.amazonaws.com" }
        }
      }
    ]
  })
}
