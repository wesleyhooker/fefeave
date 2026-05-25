# --- ECR repository for backend container images ---

resource "aws_ecr_repository" "backend" {
  count                = var.create_backend_infra ? 1 : 0
  name                 = "fefeave-backend-${var.env}"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.tags
}

resource "aws_ecr_repository" "frontend" {
  count                = var.create_backend_infra ? 1 : 0
  name                 = "fefeave-frontend-${var.env}"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.tags
}
