#!/usr/bin/env bash
# Integration test runner: starts Postgres via docker compose (if needed), runs tests, tears down.
# Usage: from backend/, run: npm run test:integration
# If DATABASE_URL is already set, skips docker (e.g. for CI with postgres service).
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
DEFAULT_DATABASE_URL="postgres://fefeave:fefeave@localhost:5432/fefeave"
USE_DOCKER=false

if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="$DEFAULT_DATABASE_URL"
  USE_DOCKER=true
fi

if [ "$USE_DOCKER" = true ]; then
  cd "$ROOT_DIR"
  echo "Starting Postgres..."
  docker compose up -d postgres

  echo "Waiting for Postgres to be ready..."
  until docker compose exec -T postgres pg_isready -U fefeave 2>/dev/null; do
    sleep 1
  done
fi

echo "Running integration tests..."
cd "$BACKEND_DIR"
DATABASE_URL="$DATABASE_URL" npx jest --testPathPattern="(db-smoke|shows-integration|wholesalers-integration)" --forceExit
EXIT_CODE=$?

if [ "$USE_DOCKER" = true ]; then
  cd "$ROOT_DIR"
  echo "Stopping Postgres..."
  docker compose down
fi

exit $EXIT_CODE
