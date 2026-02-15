#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "Error: powershell.exe not found. This script requires PowerShell (Windows) to copy to clipboard." >&2
  echo "  On WSL, ensure Windows PowerShell is on PATH (e.g. /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe)" >&2
  exit 1
fi

"$SCRIPT_DIR/project-head.sh" "$@" | powershell.exe -NoProfile -Command "Set-Clipboard"
echo "PROJECT HEAD snapshot copied to Windows clipboard." >&2
