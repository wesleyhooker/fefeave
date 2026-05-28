# Prod cost/error guardrails (SNS + CloudWatch alarms). Gated by enable_cost_alerts && env == "prod".

locals {
  monitoring_enabled = var.enable_cost_alerts && var.env == "prod"
}

resource "aws_sns_topic" "alerts" {
  count = local.monitoring_enabled ? 1 : 0
  name  = "fefeave-alerts-${var.env}"
  tags  = local.tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = local.monitoring_enabled ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "backend_lambda_errors" {
  count = local.monitoring_enabled && var.create_serverless_backend ? 1 : 0

  alarm_name          = "fefeave-backend-${var.env}-lambda-errors"
  alarm_description   = "Backend Lambda reported one or more errors in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.backend[0].function_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "frontend_server_lambda_errors" {
  count = local.monitoring_enabled && var.create_serverless_frontend ? 1 : 0

  alarm_name          = "fefeave-frontend-server-${var.env}-lambda-errors"
  alarm_description   = "Frontend server Lambda reported one or more errors in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.frontend_server[0].function_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "backend_lambda_throttles" {
  count = local.monitoring_enabled && var.create_serverless_backend ? 1 : 0

  alarm_name          = "fefeave-backend-${var.env}-lambda-throttles"
  alarm_description   = "Backend Lambda reported one or more throttles in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.backend[0].function_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "backend_apigw_5xx" {
  count = local.monitoring_enabled && var.create_serverless_backend ? 1 : 0

  alarm_name          = "fefeave-backend-${var.env}-apigw-5xx"
  alarm_description   = "Backend API Gateway reported one or more 5xx responses in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = aws_apigatewayv2_api.backend[0].id
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
  ok_actions    = [aws_sns_topic.alerts[0].arn]

  tags = local.tags
}
