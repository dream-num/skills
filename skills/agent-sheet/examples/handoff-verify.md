# Example: Export, Import, and Handoff Verification

Use this when a workbook must be exported, re-imported, and continued in a new local entry.

## Goal

Prove the handoff file exists, the imported workbook is really local/imported metadata, and the workbook structure survived the roundtrip.

## Flow

1. Export the source workbook to an explicit path.
2. Check the output file exists.
3. Import the file and capture the returned `entryId`.
4. Use `file info` for metadata only.
5. Use `inspect workbook` for structure.
6. Inspect a formula-heavy range if formulas matter for handoff.

## Example

```bash
echo "[agent-sheet] exporting source workbook" >&2
agent-sheet file export --entry-id <source-entry-id> --output ./artifacts/handoff.xlsx
test -s ./artifacts/handoff.xlsx

echo "[agent-sheet] importing handoff file" >&2
agent-sheet file import ./artifacts/handoff.xlsx --json

echo "[agent-sheet] checking imported metadata and structure" >&2
agent-sheet file info --entry-id <imported-entry-id> --json
agent-sheet inspect workbook --entry-id <imported-entry-id>
agent-sheet inspect formulas --entry-id <imported-entry-id> --range 'Renewals!L1:O20'
```

## Reusable shell skeleton

Copy this shape and replace the placeholders:

```bash
set -euo pipefail

: "${SOURCE_ENTRY_ID:?set SOURCE_ENTRY_ID}"
: "${EXPORT_XLSX:?set EXPORT_XLSX}"
: "${FORMULA_RANGE:=}"

echo "[agent-sheet] exporting source workbook" >&2
agent-sheet file export --entry-id "$SOURCE_ENTRY_ID" --output "$EXPORT_XLSX"
test -s "$EXPORT_XLSX"

echo "[agent-sheet] importing handoff file" >&2
agent-sheet file import "$EXPORT_XLSX" --json > ./artifacts/import.json

IMPORTED_ENTRY_ID=$(python3 - <<'PY'
import json
with open("./artifacts/import.json", encoding="utf-8") as f:
    print(json.load(f)["entryId"])
PY
)

echo "[agent-sheet] checking imported metadata and structure" >&2
agent-sheet file info --entry-id "$IMPORTED_ENTRY_ID" --json > ./artifacts/info.json
agent-sheet inspect workbook --entry-id "$IMPORTED_ENTRY_ID" > ./artifacts/workbook.txt

python3 - <<'PY'
import json

with open("./artifacts/info.json", encoding="utf-8") as f:
    info = json.load(f)

assert info["data"]["mode"] == "local"
assert info["data"]["origin"]["kind"] == "import"
print("mode/local and origin/import verified")
PY

if [[ -n "$FORMULA_RANGE" ]]; then
  agent-sheet inspect formulas --entry-id "$IMPORTED_ENTRY_ID" --range "$FORMULA_RANGE"
fi
```

## What to assert

- export file exists and is non-empty
- imported entry is still `mode=local`
- imported entry reports `origin.kind=import`
- workbook structure is visible through `inspect workbook`
- formula structure still reads correctly where handoff depends on formulas

## Do not do

- do not treat `file info` as proof of worksheet count or worksheet names
- do not switch targeting from `entryId` to `unitId` mid-flow
