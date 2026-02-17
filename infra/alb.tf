# --- Application Load Balancer for backend (HTTP 80 → ECS) ---

resource "aws_security_group" "alb" {
  count       = var.create_backend_infra ? 1 : 0
  name_prefix = "fefeave-backend-${var.env}-alb-"
  vpc_id      = aws_vpc.backend[0].id
  description = "ALB for backend API (DEV: allow 80 from internet)"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-alb-sg" })
}

resource "aws_lb" "backend" {
  count              = var.create_backend_infra ? 1 : 0
  name               = "fefeave-backend-${var.env}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.public[*].id
  tags               = merge(local.tags, { Name = "fefeave-backend-${var.env}-alb" })
}

resource "aws_lb_target_group" "backend" {
  count                = var.create_backend_infra ? 1 : 0
  name                 = "fefeave-backend-${var.env}"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.backend[0].id
  target_type          = "ip"
  deregistration_delay = 30
  health_check {
    enabled             = true
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-tg" })
}

resource "aws_lb_listener" "backend_http" {
  count             = var.create_backend_infra ? 1 : 0
  load_balancer_arn = aws_lb.backend[0].arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }
}
