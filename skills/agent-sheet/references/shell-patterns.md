# Shell Patterns Reference

Use these patterns when the task is fundamentally a stream transform, large-data extraction, or review-table build.

These companion tools are optional. If they are unavailable, stay on built-in commands or write an intermediate artifact first.

## TSV pipeline for filter/project/writeback

```bash
agent-sheet read range --entry-id <entry-id> --range "Claims!A1:H200000" --to-stdout --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || $5=="P1"{print $1,$2,$5}' \
  | agent-sheet write range --entry-id <entry-id> --range "ClaimsP1Review!A1:C200000" --input-format tsv
```

## Exact-value pipeline for ID/amount logic

```bash
agent-sheet read range --entry-id <entry-id> --range "Claims!A1:H200000" --type rawValue --to-stdout --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || ($1 ~ /^00/ && $6 > 1000) {print $1,$3,$6}' \
  | agent-sheet write table --entry-id <entry-id> --sheet "ClaimsExactReview" --input-format tsv
```

## Python one-liner for richer transforms

```bash
agent-sheet read range --entry-id <entry-id> --range "Sales!A1:F120000" --type rawValue --to-stdout --format csv \
  | python -c 'import csv,sys; r=csv.reader(sys.stdin); w=csv.writer(sys.stdout); h=next(r); w.writerow(h+["amount_with_tax"]); [w.writerow(row+[str(round(float(row[4])*1.06,2))]) for row in r if row and row[4]]' \
  | agent-sheet write range --entry-id <entry-id> --range "SalesEnriched!A1:G120000" --input-format csv
```

## Reusable file artifact

```bash
agent-sheet read range --entry-id <entry-id> --range "Claims!A1:H200000" --to-file --output ./artifacts/claims.tsv --format tsv
awk -F'\t' 'NR==1 || $5=="P1"{print $0}' ./artifacts/claims.tsv > ./artifacts/claims_p1.tsv
```

## Notes

- prefer TSV over CSV when `awk` or `sed` are the next consumer
- keep `--to-stdout` explicit; do not rely on implicit stream behavior
- `read range --to-stdout` already emits real workbook data shape; if you need to skip a real source header row, do it in the transform step
- use `--type rawValue` when the next step depends on exact typed values rather than formatted display values
- use `write table --sheet <name>` when the destination is conceptually a review table anchored at `A1`
- if you need external processing, start from `agent-sheet read` output rather than reopening the workbook with a local workbook library
- if `awk`, `sed`, or `python` are unnecessary, prefer the direct `agent-sheet` command path
- after writeback, verify header row, first sample rows, key columns, and row count together; count-only verification is not enough
- for a reusable skeleton, start from [../examples/roundtrip-awk-write-table.md](../examples/roundtrip-awk-write-table.md) and [../scripts/verify_csv_preview.py](../scripts/verify_csv_preview.py)
