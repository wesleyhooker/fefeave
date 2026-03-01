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
POSTGRES_WAS_RUNNING=false

reset_test_schema() {
  DATABASE_URL="$DATABASE_URL" node <<'EOF'
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS test CASCADE');
  await client.query('CREATE SCHEMA test');
  await client.end();
}

main().catch((err) => {
  console.error('Failed to reset test schema:', err.message);
  process.exit(1);
});
EOF
}

teardown() {
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "Cleaning up test schema..."
    reset_test_schema || true
  fi

  # Only stop Postgres if we started it (it was not running before)
  if [ "$USE_DOCKER" = true ] && [ "$POSTGRES_WAS_RUNNING" != true ]; then
    echo "Stopping Postgres..."
    docker compose -f "$COMPOSE_FILE" down
  fi
}

trap teardown EXIT

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

echo "Resetting integration test schema..."
reset_test_schema

echo "Running integration tests..."
cd "$BACKEND_DIR"
set +e
DATABASE_URL="$DATABASE_URL" npx jest --runInBand --testPathPattern="(db-smoke|shows-integration|wholesalers-integration|owed-line-items-integration|settlement-ledger-integration)"
EXIT_CODE=$?
set -e

exit $EXIT_CODE
