# Example: Imported Template with Non-English Sheet Name

Use this when the task starts from an imported workbook template and you need to verify anchor cells on a quoted sheet name.

## Goal

Confirm the imported template sheet still exists and a few anchor cells survived import.

## Flow

1. Import the workbook.
2. List sheets and confirm the expected sheet name exists.
3. Read a small quoted range from the non-English sheet.
4. Validate exact anchor cells and one non-empty cell.

## Example

```bash
agent-sheet file import ./partner-template.xlsx --json
agent-sheet sheet list --entry-id <entry-id> --json

agent-sheet read range --entry-id <entry-id> --range '工作表1!A1:J3' --format csv --to-stdout \
  > ./artifacts/template_anchor.csv

python3 <skill-dir>/scripts/check_csv_cells.py ./artifacts/template_anchor.csv \
  --expect A1=bold \
  --expect B3='border line' \
  --expect G3=univer \
  --non-empty J3
```

## Why this shape

- quoted range strings avoid shell parsing mistakes on non-English sheet names
- anchor-cell checks are more stable than broad visual claims
- a small readback snippet is enough to prove the imported template is usable
- `<skill-dir>` means the local `agent-sheet` skill directory that contains `scripts/check_csv_cells.py`
