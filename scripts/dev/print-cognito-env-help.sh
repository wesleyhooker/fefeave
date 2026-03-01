#!/bin/sh
set -eu

ENV_FILE="frontend/.env.local"

read_frontend_var() {
  key="$1"
  env_val="${2:-}"
  if [ -n "$env_val" ]; then
    printf "%s" "$env_val"
    return
  fi
  if [ ! -f "$ENV_FILE" ]; then
    return
  fi
  awk -v k="$key" '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    {
      line=$0
      if (line ~ "^[[:space:]]*" k "[[:space:]]*=") {
        sub("^[[:space:]]*" k "[[:space:]]*=[[:space:]]*", "", line)
        sub(/\r$/, "", line)
        print line
        exit
      }
    }
  ' "$ENV_FILE"
}

missing=""

frontend_auth_secret="$(read_frontend_var AUTH_SESSION_SECRET "${AUTH_SESSION_SECRET:-}")"
frontend_domain="$(read_frontend_var COGNITO_DOMAIN "${COGNITO_DOMAIN:-}")"
frontend_client_id="$(read_frontend_var COGNITO_CLIENT_ID "${COGNITO_CLIENT_ID:-}")"
frontend_client_secret="$(read_frontend_var COGNITO_CLIENT_SECRET "${COGNITO_CLIENT_SECRET:-}")"
frontend_redirect_uri="$(read_frontend_var COGNITO_REDIRECT_URI "${COGNITO_REDIRECT_URI:-}")"
frontend_backend_base="$(read_frontend_var BACKEND_BASE_URL "${BACKEND_BASE_URL:-}")"

[ -n "${COGNITO_REGION:-}" ] || missing="$missing COGNITO_REGION"
[ -n "${COGNITO_USER_POOL_ID:-}" ] || missing="$missing COGNITO_USER_POOL_ID"
[ -n "${COGNITO_APP_CLIENT_ID:-}" ] || missing="$missing COGNITO_APP_CLIENT_ID"

[ -n "$frontend_auth_secret" ] || missing="$missing AUTH_SESSION_SECRET"
[ -n "$frontend_domain" ] || missing="$missing COGNITO_DOMAIN"
[ -n "$frontend_client_id" ] || missing="$missing COGNITO_CLIENT_ID"
[ -n "$frontend_client_secret" ] || missing="$missing COGNITO_CLIENT_SECRET"
[ -n "$frontend_redirect_uri" ] || missing="$missing COGNITO_REDIRECT_URI"
[ -n "$frontend_backend_base" ] || missing="$missing BACKEND_BASE_URL"

if [ -n "$missing" ]; then
  echo "Missing required Cognito env vars:$missing"
else
  echo "All required local Cognito env vars are set."
fi
echo "Cognito callback allowlist must include: http://localhost:3001/api/auth/callback"
