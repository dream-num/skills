#!/usr/bin/env bash
set -euo pipefail

ENTRY_ID="${1:-}"

if ! command -v agent-sheet >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
  export PATH="$REPO_ROOT/scripts:$PATH"
fi

echo "[preflight] checking runtime"
agent-sheet doctor --json

if [[ -n "$ENTRY_ID" ]]; then
  echo "[preflight] checking workbook access entry_id=$ENTRY_ID"
  agent-sheet inspect workbook --entry-id "$ENTRY_ID" >/dev/null
else
  echo "[preflight] no entry-id provided"
fi
