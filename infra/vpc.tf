# --- VPC and networking for backend (ALB + ECS + RDS) ---
# Created only when create_backend_infra is true. Frontend (S3/CloudFront) is unchanged.

data "aws_availability_zones" "available" {
  count = var.create_backend_infra ? 1 : 0
  state = "available"
}

locals {
  azs = var.create_backend_infra ? slice(data.aws_availability_zones.available[0].names, 0, 2) : []
}

resource "aws_vpc" "backend" {
  count                = var.create_backend_infra ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.tags, {
    Name = "fefeave-backend-${var.env}"
  })
}

resource "aws_internet_gateway" "backend" {
  count  = var.create_backend_infra ? 1 : 0
  vpc_id = aws_vpc.backend[0].id
  tags   = merge(local.tags, { Name = "fefeave-backend-${var.env}-igw" })
}

# Public subnets (ALB + NAT gateway)
resource "aws_subnet" "public" {
  count                   = var.create_backend_infra ? length(local.azs) : 0
  vpc_id                  = aws_vpc.backend[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.tags, {
    Name = "fefeave-backend-${var.env}-public-${local.azs[count.index]}"
    Type = "public"
  })
}

# Private subnets (ECS tasks, RDS)
resource "aws_subnet" "private" {
  count             = var.create_backend_infra ? length(local.azs) : 0
  vpc_id            = aws_vpc.backend[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 10)
  availability_zone = local.azs[count.index]
  tags = merge(local.tags, {
    Name = "fefeave-backend-${var.env}-private-${local.azs[count.index]}"
    Type = "private"
  })
}

resource "aws_route_table" "public" {
  count  = var.create_backend_infra ? 1 : 0
  vpc_id = aws_vpc.backend[0].id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.backend[0].id
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-public-rt" })
}

resource "aws_route_table_association" "public" {
  count          = var.create_backend_infra ? length(aws_subnet.public) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# NAT gateway (one per env for DEV cost; use one AZ)
resource "aws_eip" "nat" {
  count  = var.create_backend_infra ? 1 : 0
  domain = "vpc"
  tags   = merge(local.tags, { Name = "fefeave-backend-${var.env}-nat-eip" })
}

resource "aws_nat_gateway" "backend" {
  count         = var.create_backend_infra ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
  tags          = merge(local.tags, { Name = "fefeave-backend-${var.env}-nat" })
}

resource "aws_route_table" "private" {
  count  = var.create_backend_infra ? 1 : 0
  vpc_id = aws_vpc.backend[0].id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.backend[0].id
  }
  tags = merge(local.tags, { Name = "fefeave-backend-${var.env}-private-rt" })
}

resource "aws_route_table_association" "private" {
  count          = var.create_backend_infra ? length(aws_subnet.private) : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}
