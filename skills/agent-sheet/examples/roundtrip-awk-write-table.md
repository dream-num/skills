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

agent-sheet read range --entry-id <entry-id> --range 'Claims!A1:N2701' --format csv --to-stdout \
  > ./artifacts/claims_source.csv

awk -f ./build_approval_queue.awk ./artifacts/claims_source.csv \
  > ./artifacts/approval_queue.csv

head -n 5 ./artifacts/approval_queue.csv

agent-sheet write table --entry-id <entry-id> --sheet 'ApprovalQueue' ./artifacts/approval_queue.csv --input-format csv

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

## Why this shape

- staging the source extract makes header boundaries visible
- `write table` matches an A1-anchored review sheet better than `write range`
- preview comparison catches off-by-one and header drift that a count check would miss
- `<skill-dir>` means the local `agent-sheet` skill directory that contains `scripts/verify_csv_preview.py`
