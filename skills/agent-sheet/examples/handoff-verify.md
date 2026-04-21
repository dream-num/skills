# Example: Export, Import, and Handoff Verification

## When to use

Use this when a workbook must be exported to disk, re-imported as a new local entry, and verified before further edits or handoff.

## Minimal command sequence

```bash
set -euo pipefail

: "${SOURCE_ENTRY_ID:?set SOURCE_ENTRY_ID}"
: "${EXPORT_XLSX:=./artifacts/handoff.xlsx}"
: "${FORMULA_RANGE:=}"

mkdir -p ./artifacts

agent-sheet file export --entry-id "$SOURCE_ENTRY_ID" --output "$EXPORT_XLSX"
test -s "$EXPORT_XLSX"

agent-sheet file import "$EXPORT_XLSX" --json > ./artifacts/import.json

IMPORTED_ENTRY_ID=$(python3 - <<'PY'
import json
with open("./artifacts/import.json", encoding="utf-8") as f:
    print(json.load(f)["entryId"])
PY
)

agent-sheet file info --entry-id "$IMPORTED_ENTRY_ID" --json > ./artifacts/info.json
agent-sheet inspect workbook --entry-id "$IMPORTED_ENTRY_ID"

python3 - <<'PY'
import json

with open("./artifacts/info.json", encoding="utf-8") as f:
    info = json.load(f)["data"]

assert info["mode"] == "local"
assert info["origin"]["kind"] == "import"
print("mode/local and origin/import verified")
PY

if [[ -n "$FORMULA_RANGE" ]]; then
  agent-sheet inspect formulas --entry-id "$IMPORTED_ENTRY_ID" --range "$FORMULA_RANGE"
fi
```

## What to verify

- exported file exists and is non-empty
- imported entry still targets by `entryId`
- `file info` reports `mode=local` and `origin.kind=import`
- `inspect workbook` shows the expected workbook-visible structure
- if formulas matter, `inspect formulas` still reads the expected range

## Why it matters

- handoff success is not proven by a file on disk alone
- `file info` proves metadata, while `inspect workbook` proves workbook-visible structure
- keeping `entryId` stable avoids the common imported-entry targeting mistake
