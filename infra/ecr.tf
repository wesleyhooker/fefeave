# --- ECR repository for backend container images ---

resource "aws_ecr_repository" "backend" {
  count                = var.create_backend_infra ? 1 : 0
  name                 = "fefeave-backend-${var.env}"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.tags
}
