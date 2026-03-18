#!/usr/bin/env bash
set -euo pipefail

ENTRY_ID="${1:?Usage: $0 <entry-id> <target-range> <data-json> [verify-range]}"
TARGET_RANGE="${2:?Usage: $0 <entry-id> <target-range> <data-json> [verify-range]}"
DATA_JSON="${3:?Usage: $0 <entry-id> <target-range> <data-json> [verify-range]}"
VERIFY_RANGE="${4:-$TARGET_RANGE}"

agent-sheet write range --entry-id "$ENTRY_ID" --range "$TARGET_RANGE" --data-json "$DATA_JSON" --input-format json
agent-sheet read range --entry-id "$ENTRY_ID" --range "$VERIFY_RANGE"
