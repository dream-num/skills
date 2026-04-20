# Example: Imported Template with Non-English Sheet Name

Use this when the task starts from an imported workbook template and you need to verify anchor cells on a quoted worksheet name.

## Goal

Confirm the imported template worksheet still exists and a few anchor cells survived import.

## Flow

1. Import the workbook.
2. Inspect workbook structure and confirm the expected worksheet exists.
3. Read a small quoted range from the non-English worksheet.
4. Validate exact anchor cells and one non-empty cell.

## Example

```bash
echo "[agent-sheet] importing template workbook" >&2
agent-sheet file import ./partner-template.xlsx --json
echo "[agent-sheet] inspecting workbook structure" >&2
agent-sheet inspect workbook --entry-id <entry-id>

echo "[agent-sheet] reading quoted anchor range" >&2
agent-sheet pipe out --entry-id <entry-id> --range '工作表1!A1:J3' --format csv \
  > ./artifacts/template_anchor.csv

python3 <skill-dir>/scripts/check_csv_cells.py ./artifacts/template_anchor.csv \
  --expect A1=bold \
  --expect B3='border line' \
  --expect G3=univer \
  --non-empty J3
```

## Reusable shell skeleton

Copy this shape and replace the placeholders:

```bash
set -euo pipefail

: "${ENTRY_ID:?set ENTRY_ID}"
: "${RANGE:=工作表1!A1:J3}"
: "${ARTIFACTS_DIR:=./artifacts}"

mkdir -p "$ARTIFACTS_DIR"

echo "[agent-sheet] inspecting workbook structure for imported template" >&2
agent-sheet inspect workbook --entry-id "$ENTRY_ID" > "$ARTIFACTS_DIR/workbook.txt"

echo "[agent-sheet] reading anchor range $RANGE" >&2
agent-sheet pipe out --entry-id "$ENTRY_ID" --range "$RANGE" --format csv \
  > "$ARTIFACTS_DIR/template_anchor.csv"

python3 <skill-dir>/scripts/check_csv_cells.py "$ARTIFACTS_DIR/template_anchor.csv" \
  --expect A1=bold \
  --expect B3='border line' \
  --expect G3=univer \
  --non-empty J3
```

## Why this shape

- quoted range strings avoid shell parsing mistakes on non-English worksheet names
- anchor-cell checks are more stable than broad visual claims
- a small `pipe out` snippet is enough to prove the imported template is usable
- `<skill-dir>` means the local `agent-sheet` skill directory that contains `scripts/check_csv_cells.py`
