# Example: Shell Roundtrip to Review Table

Use this when workbook data must flow through `awk` and return as a review sheet.

## Goal

Build a review queue from workbook data, write it back with `write table`, then verify more than row count.

## Flow

1. Export the source range to a staged artifact.
2. Transform it with `awk`.
3. Inspect the transformed head before writeback.
4. Write it back with `write table`.
5. Read back the destination preview.
6. Compare header, first sample rows, and a key column.
7. Check total row count separately.

## Example

```bash
mkdir -p ./artifacts

echo "[agent-sheet] exporting source range" >&2

agent-sheet read range --entry-id <entry-id> --range 'Claims!A1:N2701' --format csv --to-stdout \
  > ./artifacts/claims_source.csv

echo "[agent-sheet] transforming staged source with awk" >&2

awk -f ./build_approval_queue.awk ./artifacts/claims_source.csv \
  > ./artifacts/approval_queue.csv

head -n 5 ./artifacts/approval_queue.csv > ./artifacts/approval_queue_head.csv

echo "[agent-sheet] saved transformed head preview to ./artifacts/approval_queue_head.csv" >&2
cat ./artifacts/approval_queue_head.csv

echo "[agent-sheet] writing transformed table to ApprovalQueue" >&2
agent-sheet write table --entry-id <entry-id> --sheet 'ApprovalQueue' ./artifacts/approval_queue.csv --input-format csv
 
echo "[agent-sheet] reading destination preview from ApprovalQueue!A1:G5" >&2

agent-sheet read range --entry-id <entry-id> --range 'ApprovalQueue!A1:G5' --format csv --to-stdout \
  > ./artifacts/approval_queue_actual_head.csv

python3 <skill-dir>/scripts/verify_csv_preview.py \
  --expected ./artifacts/approval_queue.csv \
  --actual ./artifacts/approval_queue_actual_head.csv \
  --rows 4 \
  --key-column claim_id

agent-sheet read range --entry-id <entry-id> --range 'ApprovalQueue!A2:A2517' --format csv --to-stdout \
  | awk -F ',' '{v=$1; gsub(/^"|"$/, "", v); if (v != "") c++} END {print c + 0}'
```

## Reusable shell skeleton

Copy this shape and replace the placeholders:

```bash
set -euo pipefail

: "${ENTRY_ID:?set ENTRY_ID}"
: "${SOURCE_RANGE:?set SOURCE_RANGE}"
: "${DEST_SHEET:?set DEST_SHEET}"
: "${DEST_PREVIEW_RANGE:?set DEST_PREVIEW_RANGE}"
: "${KEY_COLUMN:?set KEY_COLUMN}"
: "${TRANSFORM_AWK:?set TRANSFORM_AWK}"
: "${ARTIFACTS_DIR:=./artifacts}"

mkdir -p "$ARTIFACTS_DIR"

echo "[agent-sheet] exporting source range" >&2
agent-sheet read range --entry-id "$ENTRY_ID" --range "$SOURCE_RANGE" --format csv --to-stdout \
  > "$ARTIFACTS_DIR/source.csv"

echo "[agent-sheet] transforming staged source with $TRANSFORM_AWK" >&2
awk -f "$TRANSFORM_AWK" "$ARTIFACTS_DIR/source.csv" \
  > "$ARTIFACTS_DIR/roundtrip.csv"

head -n 5 "$ARTIFACTS_DIR/roundtrip.csv" > "$ARTIFACTS_DIR/roundtrip_head.csv"
echo "[agent-sheet] saved transformed head preview to $ARTIFACTS_DIR/roundtrip_head.csv" >&2

echo "[agent-sheet] writing transformed table to $DEST_SHEET" >&2
agent-sheet write table --entry-id "$ENTRY_ID" --sheet "$DEST_SHEET" "$ARTIFACTS_DIR/roundtrip.csv" --input-format csv

echo "[agent-sheet] reading destination preview from $DEST_PREVIEW_RANGE" >&2
agent-sheet read range --entry-id "$ENTRY_ID" --range "$DEST_PREVIEW_RANGE" --format csv --to-stdout \
  > "$ARTIFACTS_DIR/actual_preview.csv"

python3 <skill-dir>/scripts/verify_csv_preview.py \
  --expected "$ARTIFACTS_DIR/roundtrip.csv" \
  --actual "$ARTIFACTS_DIR/actual_preview.csv" \
  --rows 4 \
  --key-column "$KEY_COLUMN"
```

## Why this shape

- staging the source extract makes header boundaries visible
- `write table` matches an A1-anchored review sheet better than `write range`
- preview comparison catches off-by-one and header drift that a count check would miss
- `<skill-dir>` means the local `agent-sheet` skill directory that contains `scripts/verify_csv_preview.py`
