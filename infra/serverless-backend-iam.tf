# Lambda execution role (separate from ECS task role in main.tf).

resource "aws_iam_role" "lambda_backend" {
  count = var.create_serverless_backend ? 1 : 0
  name  = "fefeave-backend-lambda-${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_backend_basic" {
  count      = var.create_serverless_backend ? 1 : 0
  role       = aws_iam_role.lambda_backend[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_backend_logs" {
  count = var.create_serverless_backend ? 1 : 0
  name  = "fefeave-backend-lambda-${var.env}-logs"
  role  = aws_iam_role.lambda_backend[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.lambda_backend[0].arn}:*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_backend_neon_secret" {
  count = var.create_serverless_backend ? 1 : 0
  name  = "fefeave-backend-lambda-${var.env}-neon-secret"
  role  = aws_iam_role.lambda_backend[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.neon_database_url[0].arn]
    }]
  })
}

# Mirror ECS backend task role S3 attachments access (main.tf backend_attachments).
resource "aws_iam_role_policy" "lambda_backend_attachments" {
  count = var.create_serverless_backend ? 1 : 0
  name  = "fefeave-backend-lambda-${var.env}-attachments"
  role  = aws_iam_role.lambda_backend[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "S3List"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.attachments.arn]
      },
      {
        Sid      = "S3Objects"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.attachments.arn}/*"]
      }
    ]
  })
}
