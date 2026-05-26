# OpenNext frontend Lambdas (server + image optimizer).

locals {
  frontend_server_zip = "${path.module}/../frontend/opennext-server.zip"
  frontend_image_zip  = "${path.module}/../frontend/opennext-image.zip"
  frontend_app_url    = "https://${var.frontend_domain}"
  backend_base_url    = var.create_serverless_backend ? "${trimsuffix(aws_apigatewayv2_api.backend[0].api_endpoint, "/")}${var.api_prefix}" : ""
}

resource "aws_cloudwatch_log_group" "frontend_server" {
  count             = var.create_serverless_frontend ? 1 : 0
  name              = "/aws/lambda/fefeave-frontend-server-${var.env}"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "frontend_image" {
  count             = var.create_serverless_frontend ? 1 : 0
  name              = "/aws/lambda/fefeave-frontend-image-${var.env}"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_iam_role" "frontend_server_lambda" {
  count = var.create_serverless_frontend ? 1 : 0
  name  = "fefeave-frontend-server-lambda-${var.env}"
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

resource "aws_iam_role_policy_attachment" "frontend_server_lambda_basic" {
  count      = var.create_serverless_frontend ? 1 : 0
  role       = aws_iam_role.frontend_server_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "frontend_server_lambda_logs" {
  count = var.create_serverless_frontend ? 1 : 0
  name  = "fefeave-frontend-server-lambda-${var.env}-logs"
  role  = aws_iam_role.frontend_server_lambda[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.frontend_server[0].arn}:*"
    }]
  })
}

resource "aws_iam_role" "frontend_image_lambda" {
  count = var.create_serverless_frontend ? 1 : 0
  name  = "fefeave-frontend-image-lambda-${var.env}"
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

resource "aws_iam_role_policy_attachment" "frontend_image_lambda_basic" {
  count      = var.create_serverless_frontend ? 1 : 0
  role       = aws_iam_role.frontend_image_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "frontend_image_lambda_logs" {
  count = var.create_serverless_frontend ? 1 : 0
  name  = "fefeave-frontend-image-lambda-${var.env}-logs"
  role  = aws_iam_role.frontend_image_lambda[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.frontend_image[0].arn}:*"
    }]
  })
}

resource "aws_iam_role_policy" "frontend_image_lambda_s3_read" {
  count = var.create_serverless_frontend ? 1 : 0
  name  = "fefeave-frontend-image-lambda-${var.env}-s3-read"
  role  = aws_iam_role.frontend_image_lambda[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [aws_s3_bucket.site.arn, "${aws_s3_bucket.site.arn}/*"]
      }
    ]
  })
}

resource "aws_lambda_function" "frontend_server" {
  count = var.create_serverless_frontend ? 1 : 0

  function_name = "fefeave-frontend-server-${var.env}"
  role          = aws_iam_role.frontend_server_lambda[0].arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.frontend_server_lambda_memory
  timeout       = var.frontend_server_lambda_timeout

  filename         = local.frontend_server_zip
  source_code_hash = filebase64sha256(local.frontend_server_zip)

  environment {
    variables = {
      NODE_ENV             = "production"
      AWS_REGION           = var.aws_region
      BACKEND_BASE_URL     = local.backend_base_url
      COGNITO_REDIRECT_URI = var.cognito_redirect_uri
      COGNITO_LOGOUT_URI   = var.cognito_logout_uri
      # COGNITO_DOMAIN, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, AUTH_SESSION_SECRET:
      # set via deploy workflow or console after apply (not in tfvars/state).
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.frontend_server_lambda_basic,
    aws_iam_role_policy.frontend_server_lambda_logs,
  ]

  tags = local.tags
}

resource "aws_lambda_function" "frontend_image" {
  count = var.create_serverless_frontend ? 1 : 0

  function_name = "fefeave-frontend-image-${var.env}"
  role          = aws_iam_role.frontend_image_lambda[0].arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.frontend_image_lambda_memory
  timeout       = var.frontend_image_lambda_timeout

  filename         = local.frontend_image_zip
  source_code_hash = filebase64sha256(local.frontend_image_zip)

  depends_on = [
    aws_iam_role_policy_attachment.frontend_image_lambda_basic,
    aws_iam_role_policy.frontend_image_lambda_logs,
    aws_iam_role_policy.frontend_image_lambda_s3_read,
  ]

  tags = local.tags
}

resource "aws_lambda_function_url" "frontend_server" {
  count = var.create_serverless_frontend ? 1 : 0

  function_name      = aws_lambda_function.frontend_server[0].function_name
  authorization_type = "AWS_IAM"

  cors {
    allow_origins = var.enable_frontend_custom_domain ? concat(
      ["https://${var.frontend_domain}"],
      var.frontend_www_domain != null && var.frontend_www_domain != "" ? ["https://${var.frontend_www_domain}"] : [],
      [for a in var.frontend_domain_aliases : "https://${a}"]
    ) : ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

resource "aws_lambda_function_url" "frontend_image" {
  count = var.create_serverless_frontend ? 1 : 0

  function_name      = aws_lambda_function.frontend_image[0].function_name
  authorization_type = "AWS_IAM"
}

locals {
  frontend_server_origin_domain = var.create_serverless_frontend ? trimprefix(
    trimprefix(aws_lambda_function_url.frontend_server[0].function_url, "https://"),
    "/"
  ) : null
  frontend_image_origin_domain = var.create_serverless_frontend ? trimprefix(
    trimprefix(aws_lambda_function_url.frontend_image[0].function_url, "https://"),
    "/"
  ) : null
}
