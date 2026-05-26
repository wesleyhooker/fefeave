# HTTP API in front of backend Lambda (/api/* matches Fastify API_PREFIX).

resource "aws_apigatewayv2_api" "backend" {
  count         = var.create_serverless_backend ? 1 : 0
  name          = "fefeave-backend-${var.env}"
  protocol_type = "HTTP"
  tags          = local.tags
}

resource "aws_apigatewayv2_integration" "backend_lambda" {
  count                  = var.create_serverless_backend ? 1 : 0
  api_id                 = aws_apigatewayv2_api.backend[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_proxy" {
  count     = var.create_serverless_backend ? 1 : 0
  api_id    = aws_apigatewayv2_api.backend[0].id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_lambda[0].id}"
}

resource "aws_apigatewayv2_route" "api_root" {
  count     = var.create_serverless_backend ? 1 : 0
  api_id    = aws_apigatewayv2_api.backend[0].id
  route_key = "ANY /api"
  target    = "integrations/${aws_apigatewayv2_integration.backend_lambda[0].id}"
}

resource "aws_apigatewayv2_stage" "default" {
  count       = var.create_serverless_backend ? 1 : 0
  api_id      = aws_apigatewayv2_api.backend[0].id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags
}

resource "aws_lambda_permission" "apigw_invoke" {
  count         = var.create_serverless_backend ? 1 : 0
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend[0].execution_arn}/*/*"
}
