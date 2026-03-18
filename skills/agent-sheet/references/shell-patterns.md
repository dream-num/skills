# Shell Patterns Reference

Use these patterns when the task is fundamentally a stream transform, large-data extraction, or review-table build.

## TSV pipeline for filter/project/writeback

```bash
agent-sheet read range --entry-id <entry-id> --range "Claims!A1:H200000" --to-stdout --format tsv --no-index \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || $5=="P1"{print $1,$2,$5}' \
  | agent-sheet write range --entry-id <entry-id> --range "ClaimsP1Review!A1:C200000" --input-format tsv
```

## Text normalization in stream

```bash
agent-sheet read range --entry-id <entry-id> --range "Raw!A1:C80000" --to-stdout --format tsv --no-index \
  | sed 's/[[:space:]]\+/ /g' \
  | agent-sheet write range --entry-id <entry-id> --range "RawNormalized!A1:C80000" --input-format tsv
```

## Python one-liner for richer transforms

```bash
agent-sheet read range --entry-id <entry-id> --range "Sales!A1:F120000" --to-stdout --format csv --no-index \
  | python -c 'import csv,sys; r=csv.reader(sys.stdin); w=csv.writer(sys.stdout); h=next(r); w.writerow(h+["amount_with_tax"]); [w.writerow(row+[str(round(float(row[4])*1.06,2))]) for row in r if row and row[4]]' \
  | agent-sheet write range --entry-id <entry-id> --range "SalesEnriched!A1:G120000" --input-format csv
```

## Search-driven review table

```bash
agent-sheet read search --entry-id <entry-id> --query "review" --format tsv --to-stdout \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || $7=="review"{print $1,$2,$5,$7}' \
  | agent-sheet write table --entry-id <entry-id> --sheet "ReviewHits" --input-format tsv
```

## Raw-row projection into anchored range

```bash
agent-sheet read range --entry-id <entry-id> --range "Sales!A2:C2000" --type rawValue --format tsv --to-stdout --no-index --no-header \
  | awk -F'\t' 'BEGIN{OFS="\t"} {print $1,$3}' \
  | agent-sheet write range --entry-id <entry-id> --sheet "Projected" --start-cell A2 --input-format tsv
```

## Reusable file artifact

```bash
agent-sheet read range --entry-id <entry-id> --range "Claims!A1:H200000" --to-file --output ./artifacts/claims.tsv --format tsv --no-index
awk -F'\t' 'NR==1 || $5=="P1"{print $0}' ./artifacts/claims.tsv > ./artifacts/claims_p1.tsv
```

## Notes

- prefer TSV over CSV when `awk` or `sed` are the next consumer
- keep `--to-stdout` explicit; do not rely on implicit stream behavior
- `read range --format tsv --to-stdout` includes a synthetic row index unless you add `--no-index`; when piping into `write table` or `write range`, choose that shape intentionally instead of forwarding it blindly
- for raw-row writeback into an anchored destination below an existing header, suppress both synthetic index and source header with `--no-index --no-header`
- use `write table --sheet <name>` when the destination is conceptually a review table anchored at `A1`
