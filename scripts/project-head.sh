#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-origin/main}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ISO timestamp
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Git identity (robust)
Branch="(unknown)"
HEAD_SHA="(unknown)"
DIRTY="no"
DELIV_N="(unknown)"
DELIV_TOPIC="(unknown)"
if git rev-parse --git-dir >/dev/null 2>&1; then
  Branch="$(git branch --show-current 2>/dev/null || echo '(detached)')"
  HEAD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo '(unknown)')"
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    DIRTY="yes"
  fi
  if [[ "$Branch" =~ ^deliverable-([0-9]+)-(.*)$ ]]; then
    DELIV_N="${BASH_REMATCH[1]}"
    DELIV_TOPIC="${BASH_REMATCH[2]}"
  fi
else
  echo "# WARNING: Not a git repository" >&2
fi

echo "# PROJECT HEAD – FefeAve"
echo "Generated: $TIMESTAMP"
echo "Hosting: AWS (deployed)"
echo ""
echo "## Git Identity"
echo "- Branch: $Branch"
echo "- HEAD: $HEAD_SHA"
echo "- Base: $BASE_REF"
echo "- Dirty: $DIRTY"
echo "- Deliverable: $DELIV_N"
echo "- Topic: $DELIV_TOPIC"
echo ""

# Working tree changes
echo "## Working Tree Changes (uncommitted)"
STATUS="$(git status --porcelain 2>/dev/null || true)"
echo "- Status:"
if [ -n "$STATUS" ]; then
  echo "$STATUS" | sed 's/^/  /'
else
  echo "  (clean)"
fi
echo ""

DIFF_STAT="$(git diff --stat 2>/dev/null || true)"
echo "- Diff (summary):"
if [ -n "$DIFF_STAT" ]; then
  echo "$DIFF_STAT" | sed 's/^/  /'
else
  echo "  (none)"
fi
echo ""

DIFF_FILES="$(git diff --name-only 2>/dev/null || true)"
echo "- Diff (files):"
if [ -n "$DIFF_FILES" ]; then
  echo "$DIFF_FILES" | sed 's/^/  /'
else
  echo "  (none)"
fi
echo ""

# Branch delta vs base (PR view)
echo "## Branch Delta vs Base (PR view)"
BRANCH_DIFF_STAT="$(git diff --stat "$BASE_REF"...HEAD 2>/dev/null || true)"
if [ $? -ne 0 ]; then
  echo "- WARNING: Could not diff vs $BASE_REF (e.g. ref not found)" >&2
  BRANCH_DIFF_STAT=""
fi
echo "- Diff (summary):"
if [ -n "$BRANCH_DIFF_STAT" ]; then
  echo "$BRANCH_DIFF_STAT" | sed 's/^/  /'
else
  echo "  (none)"
fi
echo ""

BRANCH_DIFF_FILES="$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null || true)"
echo "- Diff (files):"
if [ -n "$BRANCH_DIFF_FILES" ]; then
  echo "$BRANCH_DIFF_FILES" | sed 's/^/  /'
else
  echo "  (none)"
fi
echo ""

# Recent commits
echo "## Recent Commits"
RECENT="$(git log -n 15 --oneline --decorate 2>/dev/null || true)"
if [ -n "$RECENT" ]; then
  echo "$RECENT" | sed 's/^/  /'
else
  echo "  (none)"
fi
echo ""

# Repo structure
echo "## Repo Structure (FefeAve monorepo)"
FOLDERS=""
for d in backend frontend infra context; do
  if [ -d "$REPO_ROOT/$d" ]; then
    FOLDERS="${FOLDERS}${d}/ "
  else
    FOLDERS="${FOLDERS}${d}/ (not found) "
  fi
done
echo "- Top-level folders: $FOLDERS"
echo ""

echo "- Migrations:"
if [ -d "$REPO_ROOT/backend/migrations" ]; then
  ls -1 "$REPO_ROOT/backend/migrations" 2>/dev/null | tail -30 | sed 's/^/  /'
else
  echo "  (not found)"
fi
echo ""

echo "- Docker:"
for f in backend/Dockerfile frontend/Dockerfile docker-compose.yml; do
  if [ -f "$REPO_ROOT/$f" ]; then
    echo "  - $f exists"
  else
    echo "  - $f (not found)"
  fi
done
echo ""

echo "- Terraform:"
if [ -d "$REPO_ROOT/infra" ]; then
  TF_FILES="$(find "$REPO_ROOT/infra" -maxdepth 1 -name "*.tf" -exec basename {} \; 2>/dev/null | sort | head -30)"
  if [ -n "$TF_FILES" ]; then
    echo "$TF_FILES" | sed 's/^/  /'
  else
    echo "  (none)"
  fi
else
  echo "  (not found)"
fi
echo ""

echo "- package.json:"
for pkg in package.json backend/package.json frontend/package.json; do
  p="$REPO_ROOT/$pkg"
  if [ -f "$p" ]; then
    PKG_INFO="$(cd "$REPO_ROOT" && node -e "
      try {
        const p = require('./$pkg');
        const name = p.name || '(no name)';
        const ver = p.version || '(no version)';
        const scripts = p.scripts ? Object.keys(p.scripts).join(', ') : '(none)';
        console.log(name + ' | ' + ver + ' | ' + scripts);
      } catch (e) {
        console.log('(parse error)');
      }
    " 2>/dev/null)" || PKG_INFO="(parse error)"
    N="$(echo "$PKG_INFO" | cut -d'|' -f1 | xargs)"
    V="$(echo "$PKG_INFO" | cut -d'|' -f2 | xargs)"
    S="$(echo "$PKG_INFO" | cut -d'|' -f3 | xargs)"
    echo "  - $pkg: name=$N, version=$V, scripts: $S"
  else
    echo "  - $pkg: (not found)"
  fi
done
echo ""

# Deliverables Roadmap
echo "## Deliverables Roadmap"
if [ -f "$REPO_ROOT/context/DELIVERABLES.md" ]; then
  cat "$REPO_ROOT/context/DELIVERABLES.md"
else
  echo "(not found)"
fi
echo ""

# Milestone (auto)
if [ "$DELIV_N" != "(unknown)" ] && [ -n "$DELIV_TOPIC" ] && [ "$DELIV_TOPIC" != "(unknown)" ]; then
  MILESTONE_OBJ="Deliverable $DELIV_N: $DELIV_TOPIC"
else
  MILESTONE_OBJ="$Branch"
fi
if [ "$DIRTY" = "yes" ]; then
  MILESTONE_STATUS="in progress (uncommitted changes)"
elif [ -n "$BRANCH_DIFF_FILES" ]; then
  MILESTONE_STATUS="ready for PR/review (committed changes)"
else
  MILESTONE_STATUS="clean baseline (no delta vs base)"
fi
echo "## Milestone (auto)"
echo "- Objective: $MILESTONE_OBJ"
echo "- Status: $MILESTONE_STATUS"
echo "- Constraints:"
echo "  - Integration tests should pass (or explain local skips)"
echo "  - No breaking DB schema changes without migration"
echo "  - Keep API contracts stable (document breaking changes)"
echo "  - Follow AWS best practices for deployed components"
