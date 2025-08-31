resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "gha_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # Restrict to your repo's main branch
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:wesleyhooker/fefeave:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  name               = "fefeave-frontend-deploy"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
  description        = "GitHub Actions role for S3 deploy + CloudFront invalidation (dev)"
}

data "aws_iam_policy_document" "gha_permissions" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.frontend_dev.arn]
  }

  statement {
    actions = [
      "s3:PutObject", "s3:PutObjectAcl", "s3:DeleteObject",
      "s3:AbortMultipartUpload", "s3:ListBucketMultipartUploads"
    ]
    resources = ["${aws_s3_bucket.frontend_dev.arn}/*"]
  }

  statement {
    actions   = ["cloudfront:CreateInvalidation"]
    resources = ["arn:aws:cloudfront::*:distribution/${aws_cloudfront_distribution.frontend_dev.id}"]
  }
}

resource "aws_iam_policy" "gha_deploy_policy" {
  name        = "fefeave-frontend-deploy-policy"
  description = "S3 deploy + CloudFront invalidation (dev)"
  policy      = data.aws_iam_policy_document.gha_permissions.json
}

resource "aws_iam_role_policy_attachment" "gha_attach" {
  role       = aws_iam_role.gha_deploy.name
  policy_arn = aws_iam_policy.gha_deploy_policy.arn
}
