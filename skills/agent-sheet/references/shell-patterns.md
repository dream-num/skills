# Shell Patterns Reference

Use these only when the task is fundamentally a shell roundtrip. Do not repeat a playbook when a small pattern is enough.

## TSV pipeline for filter/project/writeback

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Claims!A1:H200000" --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || $5=="P1"{print $1,$2,$5}' \
  | agent-sheet pipe in --entry-id <entry-id> --range "ClaimsP1Review!A1:C200000" --input-format tsv
```

Use this when simple projection/filter logic fits in one pipeline and the destination is a bounded review rectangle.

## Raw-value export for exact comparisons

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Claims!A1:H200000" --type rawValue --format tsv \
  | awk -F'\t' 'BEGIN{OFS="\t"} NR==1 || ($1 ~ /^00/ && $6 > 1000) {print $1,$3,$6}'
```

Use `--type rawValue` when formatted display text is not safe enough for downstream logic.

## Inline preview assertion after writeback

```bash
agent-sheet pipe out --entry-id <entry-id> --range 'ApprovalQueue!A1:G5' --format csv \
  > ./artifacts/actual_preview.csv

python3 - <<'PY'
import csv

with open("./artifacts/expected_preview.csv", newline="", encoding="utf-8") as f:
    expected = list(csv.reader(f))
with open("./artifacts/actual_preview.csv", newline="", encoding="utf-8") as f:
    actual = list(csv.reader(f))

assert actual[:5] == expected[:5], "preview mismatch"
print("preview verified")
PY
```

Use a tiny inline assertion when you only need to compare a short preview and do not want a shipped helper script.

## Quoted range for imported templates

```bash
agent-sheet pipe out --entry-id <entry-id> --range '工作表1!A1:J3' --format csv \
  > ./artifacts/template_anchor.csv
```

Use a quoted full A1 range string when the worksheet name is non-English or otherwise shell-sensitive.

## Notes

- prefer TSV when `awk` is the next consumer
- keep `pipe in` destination ranges explicit
- stage an artifact first if the transform or verification needs a stable preview
- after writeback, verify header, first rows, one key column, and row count together
