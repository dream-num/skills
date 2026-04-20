# Example: Shell Roundtrip to Review Rectangle

Use this when workbook data must flow through `awk` and return as a bounded review region.

## Goal

Build a review queue from workbook data, send it through `awk`, write it back with `pipe in`, then verify more than row count.

## Flow

1. Export the source range to a staged artifact with `pipe out`.
2. Transform it with `awk`.
3. Inspect the transformed head before writeback.
4. Write it back with `pipe in`.
5. Read back the destination preview.
6. Compare header, first sample rows, and a key column.
7. Check total row count separately.

## Example

```bash
mkdir -p ./artifacts

echo "[agent-sheet] exporting source range" >&2

agent-sheet pipe out --entry-id <entry-id> --range 'Claims!A1:N2701' --format csv \
  > ./artifacts/claims_source.csv

echo "[agent-sheet] transforming staged source with awk" >&2

awk -f ./build_approval_queue.awk ./artifacts/claims_source.csv \
  > ./artifacts/approval_queue.csv

head -n 5 ./artifacts/approval_queue.csv > ./artifacts/approval_queue_head.csv

echo "[agent-sheet] saved transformed head preview to ./artifacts/approval_queue_head.csv" >&2
cat ./artifacts/approval_queue_head.csv

echo "[agent-sheet] writing transformed rectangle to ApprovalQueue!A1:G2517" >&2
cat ./artifacts/approval_queue.csv \
  | agent-sheet pipe in --entry-id <entry-id> --range 'ApprovalQueue!A1:G2517' --input-format csv

echo "[agent-sheet] reading destination preview from ApprovalQueue!A1:G5" >&2

agent-sheet pipe out --entry-id <entry-id> --range 'ApprovalQueue!A1:G5' --format csv \
  > ./artifacts/approval_queue_actual_head.csv

python3 <skill-dir>/scripts/verify_csv_preview.py \
  --expected ./artifacts/approval_queue.csv \
  --actual ./artifacts/approval_queue_actual_head.csv \
  --rows 4 \
  --key-column claim_id

agent-sheet pipe out --entry-id <entry-id> --range 'ApprovalQueue!A2:A2517' --format csv \
  | awk -F ',' '{v=$1; gsub(/^"|"$/, "", v); if (v != "") c++} END {print c + 0}'
```

## Reusable shell skeleton

Copy this shape and replace the placeholders:

```bash
set -euo pipefail

: "${ENTRY_ID:?set ENTRY_ID}"
: "${SOURCE_RANGE:?set SOURCE_RANGE}"
: "${DEST_RANGE:?set DEST_RANGE}"
: "${DEST_PREVIEW_RANGE:?set DEST_PREVIEW_RANGE}"
: "${KEY_COLUMN:?set KEY_COLUMN}"
: "${TRANSFORM_AWK:?set TRANSFORM_AWK}"
: "${ARTIFACTS_DIR:=./artifacts}"

mkdir -p "$ARTIFACTS_DIR"

echo "[agent-sheet] exporting source range" >&2
agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$SOURCE_RANGE" --format csv \
  > "$ARTIFACTS_DIR/source.csv"

echo "[agent-sheet] transforming staged source with $TRANSFORM_AWK" >&2
awk -f "$TRANSFORM_AWK" "$ARTIFACTS_DIR/source.csv" \
  > "$ARTIFACTS_DIR/roundtrip.csv"

head -n 5 "$ARTIFACTS_DIR/roundtrip.csv" > "$ARTIFACTS_DIR/roundtrip_head.csv"
echo "[agent-sheet] saved transformed head preview to $ARTIFACTS_DIR/roundtrip_head.csv" >&2

echo "[agent-sheet] writing transformed rectangle to $DEST_RANGE" >&2
cat "$ARTIFACTS_DIR/roundtrip.csv" \
  | agent-sheet pipe in --entry-id "$ENTRY_ID" --range "$DEST_RANGE" --input-format csv

echo "[agent-sheet] reading destination preview from $DEST_PREVIEW_RANGE" >&2
agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$DEST_PREVIEW_RANGE" --format csv \
  > "$ARTIFACTS_DIR/actual_preview.csv"

python3 <skill-dir>/scripts/verify_csv_preview.py \
  --expected "$ARTIFACTS_DIR/roundtrip.csv" \
  --actual "$ARTIFACTS_DIR/actual_preview.csv" \
  --rows 4 \
  --key-column "$KEY_COLUMN"
```

## Why this shape

- staging the source extract makes header boundaries visible
- `pipe out` / `pipe in` make the shell data plane explicit
- preview comparison catches off-by-one and header drift that a count check would miss
- `<skill-dir>` means the local `agent-sheet` skill directory that contains `scripts/verify_csv_preview.py`
