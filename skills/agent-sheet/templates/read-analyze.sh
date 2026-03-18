#!/usr/bin/env bash
set -euo pipefail

ENTRY_ID="${1:?Usage: $0 <entry-id> <range-a1> [sheet-name] [mode: human|stream|export] [output-path-for-export]}"
RANGE_A1="${2:?Usage: $0 <entry-id> <range-a1> [sheet-name] [mode: human|stream|export] [output-path-for-export]}"
SHEET_NAME="${3:-}"
MODE="${4:-human}"
OUTPUT_PATH="${5:-}"

agent-sheet inspect workbook --entry-id "$ENTRY_ID"
if [[ -n "$SHEET_NAME" ]]; then
  agent-sheet inspect sheet --entry-id "$ENTRY_ID" --sheet "$SHEET_NAME"
fi
agent-sheet inspect range --entry-id "$ENTRY_ID" --range "$RANGE_A1"

case "$MODE" in
  human)
    agent-sheet read range --entry-id "$ENTRY_ID" --range "$RANGE_A1"
    ;;
  stream)
    agent-sheet read range --entry-id "$ENTRY_ID" --range "$RANGE_A1" --to-stdout --format tsv --no-index
    ;;
  export)
    if [[ -z "$OUTPUT_PATH" ]]; then
      echo "output path is required for export mode" >&2
      exit 1
    fi
    agent-sheet read range --entry-id "$ENTRY_ID" --range "$RANGE_A1" --to-file --output "$OUTPUT_PATH" --format tsv --no-index
    ;;
  *)
    echo "invalid mode: $MODE (expected: human|stream|export)" >&2
    exit 1
    ;;
esac
