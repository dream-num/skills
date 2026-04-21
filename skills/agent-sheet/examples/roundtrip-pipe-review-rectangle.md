# Example: Pipe Roundtrip to Review Rectangle

## When to use

Use this when workbook data must pass through shell tools such as `awk` and return as a bounded review rectangle.

## Minimal command sequence

```bash
set -euo pipefail

: "${ENTRY_ID:?set ENTRY_ID}"
: "${SOURCE_RANGE:?set SOURCE_RANGE}"
: "${DEST_RANGE:?set DEST_RANGE}"
: "${DEST_PREVIEW_RANGE:?set DEST_PREVIEW_RANGE}"
: "${DEST_COUNT_RANGE:?set DEST_COUNT_RANGE}"

mkdir -p ./artifacts

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$SOURCE_RANGE" --format csv \
  > ./artifacts/source.csv

awk -F ',' 'BEGIN{OFS=","} NR==1 || $5=="P1" {print $1,$2,$5}' \
  ./artifacts/source.csv > ./artifacts/roundtrip.csv
head -n 5 ./artifacts/roundtrip.csv > ./artifacts/expected_preview.csv

cat ./artifacts/roundtrip.csv \
  | agent-sheet pipe in --entry-id "$ENTRY_ID" --range "$DEST_RANGE" --input-format csv

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$DEST_PREVIEW_RANGE" --format csv \
  > ./artifacts/actual_preview.csv

python3 - <<'PY'
import csv

with open("./artifacts/expected_preview.csv", newline="", encoding="utf-8") as f:
    expected = list(csv.reader(f))
with open("./artifacts/actual_preview.csv", newline="", encoding="utf-8") as f:
    actual = list(csv.reader(f))

assert actual == expected, "preview mismatch"
print("preview verified")
PY

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$DEST_COUNT_RANGE" --format csv \
  | awk -F ',' '{v=$1; gsub(/^"|"$/, "", v); if (v != "") c++} END {print c + 0}'
```

## What to verify

- staged output has the expected header before writeback
- destination preview matches the expected header and first sample rows exactly
- one key column still looks correct in the preview
- row count is checked separately instead of replacing preview verification

## Why it matters

- shell roundtrips can preserve row count while drifting headers or keys
- staging the transformed file makes the review boundary explicit
- an inline transform keeps the example self-contained and easy to copy
- an inline preview assertion keeps the example self-contained and avoids helper-script dependencies
