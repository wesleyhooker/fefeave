#!/usr/bin/env bash
set -euo pipefail

# Reset local Postgres schema, re-run migrations, then seed dev data.
# Requires: psql on PATH, DATABASE_URL (defaults to local docker-compose URL).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATABASE_URL="${DATABASE_URL:-postgres://fefeave:fefeave@localhost:5432/fefeave}"

echo "db:reset using DATABASE_URL=${DATABASE_URL}"
export DATABASE_URL

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
SQL

npm run migrate:up
npm run seed:dev

echo "db:reset complete."
