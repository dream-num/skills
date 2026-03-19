#!/usr/bin/env bash
set -euo pipefail

ENTRY_ID="${1:-}"

if ! command -v agent-sheet >/dev/null 2>&1; then
  echo "[preflight] agent-sheet not found in PATH; install it first with: npm install -g agent-sheet" >&2
  exit 1
fi

echo "[preflight] checking runtime"
command -v agent-sheet >/dev/null

if [[ -n "$ENTRY_ID" ]]; then
  echo "[preflight] checking workbook access entry_id=$ENTRY_ID"
  agent-sheet inspect workbook --entry-id "$ENTRY_ID" >/dev/null
else
  echo "[preflight] no entry-id provided"
fi
