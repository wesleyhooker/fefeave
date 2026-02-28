# --- ECS Fargate cluster, task definition, and service for backend ---

resource "aws_ecs_cluster" "backend" {
  count = var.create_backend_infra ? 1 : 0
  name  = "fefeave-backend-${var.env}"
  tags  = local.tags
}

resource "aws_cloudwatch_log_group" "backend" {
  count             = var.create_backend_infra ? 1 : 0
  name              = "/ecs/fefeave-backend-${var.env}"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  count             = var.create_backend_infra ? 1 : 0
  name              = "/ecs/fefeave-frontend-${var.env}"
  retention_in_days = 14
  tags              = local.tags
}

# Task execution role: ECR pull + CloudWatch Logs (used by ECS agent, not the app)
resource "aws_iam_role" "backend_execution" {
  count = var.create_backend_infra ? 1 : 0
  name  = "fefeave-backend-${var.env}-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "backend_execution_ecr" {
  count      = var.create_backend_infra ? 1 : 0
  role       = aws_iam_role.backend_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Extra policy so execution role can write to our log group (ECSTaskExecutionRolePolicy already includes basic logs)
resource "aws_iam_role_policy" "backend_execution_logs" {
  count = var.create_backend_infra ? 1 : 0
  name  = "fefeave-backend-${var.env}-execution-logs"
  role  = aws_iam_role.backend_execution[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.backend[0].arn}:*"
    }]
  })
}

# Execution role must read Secrets Manager for DATABASE_URL injection into container
resource "aws_iam_role_policy" "backend_execution_secrets" {
  count = var.create_backend_infra && var.create_rds ? 1 : 0
  name  = "fefeave-backend-${var.env}-execution-secrets"
  role  = aws_iam_role.backend_execution[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.db_url[0].arn]
    }]
  })
}

# ECS tasks accept traffic only from ALB
resource "aws_security_group" "ecs" {
  count       = var.create_backend_infra ? 1 : 0
  name_prefix = "fefeave-backend-${var.env}-ecs-"
  vpc_id      = aws_vpc.backend[0].id
  description = "ECS backend tasks; allow 3000 from ALB only"
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[0].id]
    description     = "From ALB"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-ecs-sg" })
}

resource "aws_ecs_task_definition" "backend" {
  count                    = var.create_backend_infra ? 1 : 0
  family                   = "fefeave-backend-${var.env}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.backend_execution[0].arn
  task_role_arn            = aws_iam_role.backend.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.backend[0].repository_url}:${var.backend_image_tag}"
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    essential = true
    environment = concat(
      [
        { name = "PORT", value = "3000" },
        { name = "AUTH_MODE", value = var.env == "dev" ? "dev_bypass" : "off" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "NODE_ENV", value = "production" },
        { name = "S3_ATTACHMENTS_BUCKET", value = aws_s3_bucket.attachments.bucket }
      ],
      var.env == "dev" ? [
        { name = "AUTH_DEV_BYPASS_USER_ID", value = "dev-user" },
        { name = "AUTH_DEV_BYPASS_EMAIL", value = "dev@fefeave.local" },
        { name = "AUTH_DEV_BYPASS_ROLE", value = "ADMIN" }
      ] : []
    )
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    secrets = var.create_rds ? [
      {
        name      = "DATABASE_URL"
        valueFrom = aws_secretsmanager_secret.db_url[0].arn
      }
    ] : []
  }])
  tags = local.tags
}

resource "aws_ecs_service" "backend" {
  count           = var.create_backend_infra ? 1 : 0
  name            = "fefeave-backend-${var.env}"
  cluster         = aws_ecs_cluster.backend[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs[0].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = 3000
  }
}

# Dev-only helper: force a fresh backend rollout after task/env changes so new
# container environment values are picked up immediately after terraform apply.
resource "terraform_data" "backend_force_new_deployment_dev" {
  count = (var.create_backend_infra && var.env == "dev") ? 1 : 0

  triggers_replace = [
    aws_ecs_task_definition.backend[0].arn,
    var.create_rds ? aws_secretsmanager_secret_version.db_url[0].version_id : "no-rds",
    "AUTH_MODE=dev_bypass",
    "AUTH_DEV_BYPASS_USER_ID=dev-user",
    "AUTH_DEV_BYPASS_EMAIL=dev@fefeave.local",
    "AUTH_DEV_BYPASS_ROLE=ADMIN",
  ]

  provisioner "local-exec" {
    interpreter = ["/usr/bin/env", "bash", "-lc"]
    command     = <<-EOT
      set -euo pipefail
      aws ecs update-service \
        --region ${var.aws_region} \
        --cluster ${aws_ecs_cluster.backend[0].name} \
        --service ${aws_ecs_service.backend[0].name} \
        --force-new-deployment
      aws ecs wait services-stable \
        --region ${var.aws_region} \
        --cluster ${aws_ecs_cluster.backend[0].name} \
        --services ${aws_ecs_service.backend[0].name}
    EOT
  }

  depends_on = [aws_ecs_service.backend]
}

resource "aws_ecs_task_definition" "frontend" {
  count                    = var.create_backend_infra ? 1 : 0
  family                   = "fefeave-frontend-${var.env}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_container_cpu
  memory                   = var.frontend_container_memory
  execution_role_arn       = aws_iam_role.backend_execution[0].arn
  task_role_arn            = aws_iam_role.backend.arn

  container_definitions = jsonencode([{
    name  = "frontend"
    image = "${aws_ecr_repository.frontend[0].repository_url}:${var.frontend_image_tag}"
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    essential = true
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" },
      { name = "NEXT_PUBLIC_BACKEND_URL", value = var.frontend_next_public_backend_url }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
  tags = local.tags
}

resource "aws_ecs_service" "frontend" {
  count           = var.create_backend_infra ? 1 : 0
  name            = "fefeave-frontend-${var.env}"
  cluster         = aws_ecs_cluster.backend[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs[0].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = 3000
  }
}
