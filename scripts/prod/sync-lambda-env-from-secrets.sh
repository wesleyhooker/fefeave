#!/usr/bin/env bash
# Merge Secrets Manager values into Lambda environment variables (operator-only; not CI).
# Preserves all existing env keys. Does not print secret values.
#
# Usage:
#   ./scripts/prod/sync-lambda-env-from-secrets.sh \
#     --function-name fefeave-frontend-server-prod \
#     --secret-arn "$AUTH_SESSION_SECRET_ARN" --env-key AUTH_SESSION_SECRET \
#     --secret-arn "$COGNITO_CLIENT_SECRET_ARN" --env-key COGNITO_CLIENT_SECRET
#
# ARNs: terraform -chdir=infra output -raw frontend_auth_session_secret_arn (prod workspace)

set -euo pipefail

FN=""
declare -a SECRET_ARNS=()
declare -a ENV_KEYS=()

usage() {
  echo "Usage: $0 --function-name NAME [--secret-arn ARN --env-key KEY]..." >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --function-name)
      FN="$2"
      shift 2
      ;;
    --secret-arn)
      SECRET_ARNS+=("$2")
      shift 2
      ;;
    --env-key)
      ENV_KEYS+=("$2")
      shift 2
      ;;
    -h | --help)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [[ -z "$FN" ]] || [[ ${#SECRET_ARNS[@]} -eq 0 ]] || [[ ${#SECRET_ARNS[@]} -ne ${#ENV_KEYS[@]} ]]; then
  usage
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

CURRENT="$(aws lambda get-function-configuration \
  --function-name "$FN" \
  --query 'Environment.Variables' \
  --output json)"

NEW_ENV="$CURRENT"
for i in "${!SECRET_ARNS[@]}"; do
  arn="${SECRET_ARNS[$i]}"
  key="${ENV_KEYS[$i]}"
  value="$(aws secretsmanager get-secret-value \
    --secret-id "$arn" \
    --query SecretString \
    --output text)"
  NEW_ENV="$(echo "$NEW_ENV" | jq --arg k "$key" --arg v "$value" '. + {($k): $v}')"
done

aws lambda update-function-configuration \
  --function-name "$FN" \
  --environment "Variables=${NEW_ENV}" \
  --no-cli-pager

echo "Updated Lambda env keys for $FN (values not printed):"
aws lambda get-function-configuration \
  --function-name "$FN" \
  --query 'Environment.Variables | keys(@)' \
  --output text
