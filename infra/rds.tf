# --- RDS Postgres + Secrets Manager for DATABASE_URL (DEV) ---

resource "random_password" "db_password" {
  count   = var.create_backend_infra && var.create_rds ? 1 : 0
  length  = 24
  special = true
}

resource "aws_db_subnet_group" "backend" {
  count       = var.create_backend_infra && var.create_rds ? 1 : 0
  name        = "fefeave-backend-${var.env}"
  subnet_ids  = aws_subnet.private[*].id
  description = "Private subnets for backend RDS"
  tags        = merge(local.tags, { Name = "fefeave-backend-${var.env}-db-subnet" })
}

resource "aws_security_group" "rds" {
  count       = var.create_backend_infra && var.create_rds ? 1 : 0
  name_prefix = "fefeave-backend-${var.env}-rds-"
  vpc_id      = aws_vpc.backend[0].id
  description = "RDS Postgres; allow 5432 from ECS only"
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs[0].id]
    description     = "From ECS backend"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-rds-sg" })
}

resource "aws_db_instance" "backend" {
  count                  = var.create_backend_infra && var.create_rds ? 1 : 0
  identifier             = "fefeave-backend-${var.env}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.db_password[0].result
  vpc_security_group_ids = [aws_security_group.rds[0].id]
  db_subnet_group_name   = aws_db_subnet_group.backend[0].name
  publicly_accessible    = false
  skip_final_snapshot    = true
  tags                   = merge(local.tags, { Name = "fefeave-backend-${var.env}-db" })
}

# Secrets Manager: single secret holding full DATABASE_URL for ECS task definition
resource "aws_secretsmanager_secret" "db_url" {
  count       = var.create_backend_infra && var.create_rds ? 1 : 0
  name        = "fefeave-backend-${var.env}-database-url"
  description = "Postgres DATABASE_URL for backend ECS tasks"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "db_url" {
  count     = var.create_backend_infra && var.create_rds ? 1 : 0
  secret_id = aws_secretsmanager_secret.db_url[0].id
  secret_string = "postgres://${var.db_username}:${urlencode(random_password.db_password[0].result)}@${aws_db_instance.backend[0].address}:${aws_db_instance.backend[0].port}/${aws_db_instance.backend[0].db_name}"
}
