# --- ECS Fargate cluster, task definition, and service for backend ---

resource "aws_ecs_cluster" "backend" {
  count = var.create_backend_infra ? 1 : 0
  name  = "fefeave-backend-${var.env}"
  tags  = local.tags
}

resource "aws_cloudwatch_log_group" "backend" {
  count             = var.create_backend_infra ? 1 : 0
  name              = "/ecs/fefeave-backend-${var.env}"
  retention_in_days  = 14
  tags              = local.tags
}

# Task execution role: ECR pull + CloudWatch Logs (used by ECS agent, not the app)
resource "aws_iam_role" "backend_execution" {
  count              = var.create_backend_infra ? 1 : 0
  name               = "fefeave-backend-${var.env}-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
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
  count  = var.create_backend_infra ? 1 : 0
  name   = "fefeave-backend-${var.env}-execution-logs"
  role   = aws_iam_role.backend_execution[0].id
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
  count  = var.create_backend_infra && var.create_rds ? 1 : 0
  name   = "fefeave-backend-${var.env}-execution-secrets"
  role   = aws_iam_role.backend_execution[0].id
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
    environment = [
      { name = "PORT", value = "3000" },
      { name = "AUTH_MODE", value = "off" },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "NODE_ENV", value = "production" },
      { name = "S3_ATTACHMENTS_BUCKET", value = aws_s3_bucket.attachments.bucket }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend[0].name
        "awslogs-region"         = var.aws_region
        "awslogs-stream-prefix"  = "ecs"
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
