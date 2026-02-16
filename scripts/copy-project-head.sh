#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Prefer clip.exe (most reliable for WSL -> Windows clipboard)
if command -v clip.exe >/dev/null 2>&1; then
  "$SCRIPT_DIR/project-head.sh" "$@" | clip.exe
  echo "PROJECT HEAD snapshot copied to Windows clipboard." >&2
  exit 0
fi

# Fallback to PowerShell if clip.exe isn't available
if command -v powershell.exe >/dev/null 2>&1; then
  "$SCRIPT_DIR/project-head.sh" "$@" | powershell.exe -NoProfile -Command "Set-Clipboard"
  echo "PROJECT HEAD snapshot copied to Windows clipboard." >&2
  exit 0
fi

echo "Error: Neither clip.exe nor powershell.exe found. Cannot copy to clipboard." >&2
echo "Tip: Run ./scripts/project-head.sh and copy manually." >&2
exit 1
