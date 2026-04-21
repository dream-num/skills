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
: "${DEST_COUNT_RANGE:?set DEST_COUNT_RANGE}" # key/data column only, no header row

mkdir -p ./artifacts

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$SOURCE_RANGE" --format tsv \
  > ./artifacts/source.tsv

awk -F '\t' 'BEGIN{OFS="\t"} NR==1 || $5=="P1" {print $1,$2,$5}' \
  ./artifacts/source.tsv > ./artifacts/roundtrip.tsv
head -n 5 ./artifacts/roundtrip.tsv > ./artifacts/expected_preview.tsv

cat ./artifacts/roundtrip.tsv \
  | agent-sheet pipe in --entry-id "$ENTRY_ID" --range "$DEST_RANGE" --input-format tsv

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$DEST_PREVIEW_RANGE" --format tsv \
  > ./artifacts/actual_preview.tsv

python3 - <<'PY'
with open("./artifacts/expected_preview.tsv", newline="", encoding="utf-8") as f:
    expected = [line.rstrip("\n").split("\t") for line in f]
with open("./artifacts/actual_preview.tsv", newline="", encoding="utf-8") as f:
    actual = [line.rstrip("\n").split("\t") for line in f]

assert actual == expected, "preview mismatch"
print("preview verified")
PY

agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$DEST_COUNT_RANGE" --format tsv \
  | awk -F '\t' '{if ($1 != "") c++} END {print c + 0}'
```

## What to verify

- staged output has the expected header before writeback
- destination preview matches the expected header and first sample rows exactly
- one key column still looks correct in the preview
- row count is checked separately on a key/data column range that starts below the header row

## Why it matters

- shell roundtrips can preserve row count while drifting headers or keys
- staging the transformed file makes the review boundary explicit
- an inline transform keeps the example self-contained and easy to copy
- an inline preview assertion keeps the example self-contained and avoids helper-script dependencies
