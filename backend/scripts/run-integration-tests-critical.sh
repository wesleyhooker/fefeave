#!/usr/bin/env bash
# Critical integration subset for CI — financial ledger paths only.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_DATABASE_URL="postgres://fefeave:fefeave@localhost:5432/fefeave"

if [ -z "${DATABASE_URL:-}" ]; then
  DATABASE_URL="$DEFAULT_DATABASE_URL"
fi

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

reset_test_schema

cd "$BACKEND_DIR"
DATABASE_URL="$DATABASE_URL" npx jest --runInBand --testPathPattern="(financial-obligation-projections-integration|wholesaler-payment-correction-integration|vendor-payment-write-trust-integration|event-derived-cash-parity-integration)"
