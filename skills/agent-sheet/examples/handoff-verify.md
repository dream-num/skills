# Example: Export, Import, and Handoff Verification

Use this when a workbook must be exported, re-imported, and continued in a new local entry.

## Goal

Prove the handoff file exists, the imported workbook is really local/imported metadata, and the workbook structure survived the roundtrip.

## Flow

1. Export the source workbook to an explicit path.
2. Check the output file exists.
3. Import the file and capture the returned `entryId`.
4. Use `file info` for metadata only.
5. Use `sheet list` or `inspect workbook` for structure.
6. Inspect a formula-heavy range if formulas matter for handoff.

## Example

```bash
agent-sheet file export --entry-id <source-entry-id> --output ./artifacts/handoff.xlsx
test -s ./artifacts/handoff.xlsx

agent-sheet file import ./artifacts/handoff.xlsx --json

agent-sheet file info --entry-id <imported-entry-id> --json
agent-sheet sheet list --entry-id <imported-entry-id> --json
agent-sheet inspect range --entry-id <imported-entry-id> --range 'Renewals!L1:O20'
```

## What to assert

- export file exists and is non-empty
- imported entry is still `mode=local`
- imported entry reports `origin.kind=import`
- required sheets exist in `sheet list`
- formula structure still reads correctly where handoff depends on formulas

## Do not do

- do not treat `file info` as proof of sheet count or sheet names
- do not switch targeting from `entryId` to `unitId` mid-flow
