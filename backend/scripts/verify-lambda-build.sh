#!/usr/bin/env bash
# Verify Lambda handler compiles and exports `handler` (no AWS invoke).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

if [[ ! -f dist/lambda.js ]]; then
  echo "error: dist/lambda.js not found. Run: npm run build" >&2
  exit 1
fi

node <<'EOF'
const path = require('path');
const lambdaPath = path.join(process.cwd(), 'dist', 'lambda.js');
const mod = require(lambdaPath);
if (typeof mod.handler !== 'function') {
  console.error('error: dist/lambda.js must export handler');
  process.exit(1);
}
console.log('Lambda handler export OK:', lambdaPath);
EOF
