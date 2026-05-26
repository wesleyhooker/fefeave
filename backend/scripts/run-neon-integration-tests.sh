#!/usr/bin/env bash
# Run backend integration tests against an external Postgres (e.g. Neon branch).
# Does not start Docker. Requires DATABASE_URL with TLS (e.g. sslmode=require).
#
# Usage:
#   export DATABASE_URL='postgresql://...?sslmode=require'
#   ./scripts/run-neon-integration-tests.sh
#
# Use a dedicated Neon branch — never production. See docs/deployment/neon-phase1.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set." >&2
  echo "Create a Neon branch and export its connection string (with sslmode=require)." >&2
  echo "See docs/deployment/neon-phase1.md" >&2
  exit 1
fi

case "$DATABASE_URL" in
  *sslmode=*|*ssl=true*|*ssl=1*)
    ;;
  *)
    echo "warning: DATABASE_URL has no sslmode/ssl param; Neon usually requires TLS." >&2
    echo "         Append ?sslmode=require (or use the Neon dashboard connection string)." >&2
    ;;
esac

if [[ "$DATABASE_URL" == *"-pooler."* ]]; then
  echo "error: Use Neon's direct connection string for integration tests (host must not contain -pooler)." >&2
  echo "       Pooler rejects PGOPTIONS search_path=test. See docs/deployment/neon-phase1.md." >&2
  exit 1
fi

if [ "${NEON_INTEGRATION_CONFIRM:-}" != "1" ]; then
  echo "Neon integration tests use schema 'test' only (DROP/CREATE test)."
  echo "Confirm this DATABASE_URL is a throwaway Neon branch, not production."
  echo "Set NEON_INTEGRATION_CONFIRM=1 to proceed."
  exit 1
fi

cd "$BACKEND_DIR"
exec env DATABASE_URL="$DATABASE_URL" npm run test:integration
