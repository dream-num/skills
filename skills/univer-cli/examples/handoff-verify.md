# Example: Export, Import, and Handoff Verification

## When to use

Use this when a workbook must be exported to disk, re-imported as a `.univer` package, and verified before further edits or handoff.

## Minimal command sequence

```bash
set -euo pipefail

: "${SOURCE_UNIVER:?set SOURCE_UNIVER}"
: "${EXPORT_XLSX:=./artifacts/handoff.xlsx}"
: "${IMPORTED_UNIVER:=./artifacts/handoff.univer}"
: "${FORMULA_RANGE:=}"

mkdir -p ./artifacts

univer inspect workbook "$SOURCE_UNIVER"
univer export "$SOURCE_UNIVER" "$EXPORT_XLSX"
test -s "$EXPORT_XLSX"

univer import "$EXPORT_XLSX" "$IMPORTED_UNIVER" --json > ./artifacts/import.json
univer inspect workbook "$IMPORTED_UNIVER"

if [[ -n "$FORMULA_RANGE" ]]; then
  univer inspect formulas "$IMPORTED_UNIVER" --range "$FORMULA_RANGE"
fi
```

## What to verify

- exported file exists and is non-empty
- imported workbook is addressed by the expected `.univer` path
- `inspect workbook` shows the expected workbook-visible structure
- if formulas matter, `inspect formulas` still reads the expected range

## Why it matters

- handoff success is not proven by a file on disk alone
- package metadata proves less than workbook-visible inspection
- an explicit workbook path avoids internal-id targeting mistakes
