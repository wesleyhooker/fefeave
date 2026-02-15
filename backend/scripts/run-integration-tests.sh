#!/usr/bin/env bash
# Integration test runner: starts Postgres via docker compose (if needed), runs tests, tears down.
# Usage: from backend/ or repo root, run: npm run test:integration (from backend/)
# If DATABASE_URL is already set, skips docker (e.g. for CI with postgres service).
# Only stops Postgres if this script started it (leaves pre-existing instances running).
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
DEFAULT_DATABASE_URL="postgres://fefeave:fefeave@localhost:5432/fefeave"
USE_DOCKER=false

if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="$DEFAULT_DATABASE_URL"
  USE_DOCKER=true
fi

if [ "$USE_DOCKER" = true ]; then
  # Detect if postgres was already running (container_name from docker-compose.yml)
  if docker ps -q --filter "name=fefeave-postgres" 2>/dev/null | grep -q .; then
    POSTGRES_WAS_RUNNING=true
  else
    POSTGRES_WAS_RUNNING=false
  fi

  echo "Starting Postgres..."
  docker compose -f "$COMPOSE_FILE" up -d postgres

  echo "Waiting for Postgres to be ready..."
  until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U fefeave 2>/dev/null; do
    sleep 1
  done
fi

echo "Running integration tests..."
cd "$BACKEND_DIR"
DATABASE_URL="$DATABASE_URL" npx jest --testPathPattern="(db-smoke|shows-integration|wholesalers-integration)" --forceExit
EXIT_CODE=$?

# Only stop Postgres if we started it (it was not running before)
if [ "$USE_DOCKER" = true ] && [ "$POSTGRES_WAS_RUNNING" != true ]; then
  echo "Stopping Postgres..."
  docker compose -f "$COMPOSE_FILE" down
fi

exit $EXIT_CODE
