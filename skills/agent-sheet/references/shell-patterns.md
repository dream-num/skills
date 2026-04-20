# Shell Patterns Reference

Use these patterns when the task is fundamentally a stream transform, large-data extraction, or rectangular review build.

These companion tools are optional. If they are unavailable, stay on built-in commands or write an intermediate artifact first.

## TSV pipeline for filter/project/writeback

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Claims!A1:H200000" --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || $5=="P1"{print $1,$2,$5}' \
  | agent-sheet pipe in --entry-id <entry-id> --range "ClaimsP1Review!A1:C200000" --input-format tsv
```

## Exact-value pipeline for ID/amount logic

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Claims!A1:H200000" --type rawValue --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || ($1 ~ /^00/ && $6 > 1000) {print $1,$3,$6}' \
  | agent-sheet pipe in --entry-id <entry-id> --range "ClaimsExactReview!A1:C200000" --input-format tsv
```

## Python one-liner for richer transforms

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Sales!A1:F120000" --type rawValue --format csv \
  | python -c 'import csv,sys; r=csv.reader(sys.stdin); w=csv.writer(sys.stdout); h=next(r); w.writerow(h+["amount_with_tax"]); [w.writerow(row+[str(round(float(row[4])*1.06,2))]) for row in r if row and row[4]]' \
  | agent-sheet pipe in --entry-id <entry-id> --range "SalesEnriched!A1:G120000" --input-format csv
```

## Reusable file artifact

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Claims!A1:H200000" --format tsv \
  > ./artifacts/claims.tsv
awk -F'\t' 'NR==1 || $5=="P1"{print $0}' ./artifacts/claims.tsv > ./artifacts/claims_p1.tsv
```

## Notes

- prefer TSV over CSV when `awk` or `sed` are the next consumer
- `pipe out` already expresses stdout-first stream behavior; keep redirects explicit in the shell
- `pipe out` emits real workbook data shape; if you need to skip a real source header row, do it in the transform step
- use `--type rawValue` when the next step depends on exact typed values rather than formatted display values
- use explicit destination ranges for `pipe in`
- if you need external processing, start from `agent-sheet pipe out` rather than reopening the workbook with a local workbook library
- if `awk`, `sed`, or `python` are unnecessary, prefer the direct `agent-sheet` primitive
- after writeback, verify header row, first sample rows, key columns, and row count together; count-only verification is not enough
- for a reusable skeleton, start from [../examples/roundtrip-awk-write-table.md](../examples/roundtrip-awk-write-table.md) and [../scripts/verify_csv_preview.py](../scripts/verify_csv_preview.py)
