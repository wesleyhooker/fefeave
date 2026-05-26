#!/usr/bin/env bash
# Stage lambda.zip via Node (archiver). No system zip required.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/package-lambda.mjs"
