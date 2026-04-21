# Gotchas Reference

Use this when the task looks straightforward but `agent-sheet` behavior has a non-obvious edge.

## `entryId` vs `unitId`

- for local workbooks and imports, the stable working handle is `entryId`
- `file import` can return a `unitId`, while a later `file info` on the same local entry may report `unitId: null`
- do not switch targeting strategy mid-task; keep using `--entry-id`

## `file info` boundary

- `file info` is useful for metadata such as `mode`, `origin`, `name`, and timestamps
- it is not sufficient for worksheet count, worksheet names, formula state, or handoff structure
- use `inspect workbook` for workbook-visible structure

## Workbook-visible verification beats metadata

- if workbook-visible output disagrees with metadata, trust the workbook-visible surface first
- verify shape with `inspect workbook`, formulas with `inspect formulas` or `pipe out --type formula`, and data writeback with a readback range
- count-only checks are not enough for shell roundtrips; verify header, first rows, and one key column too

## Imported templates and non-English worksheet names

- imported workbooks can contain non-English worksheet names and still work normally
- quote the full range string in the shell, for example `--range '工作表1!A1:J3'`
- verify imported templates by reading a small anchor range and checking a few exact cells plus one non-empty cell

## `run` API gotchas

- all `run` code must be wrapped in an arrow function: `() => { ... }` or `async () => { ... }`
- always return an object such as `{ success: true, ... }`; do not rely on implicit return values
- only use methods explicitly documented in the `run-api*.md` references; do not guess method names or overloads
- prefer `getSheetByName(...)` so the worksheet boundary stays explicit and reviewable
- numeric coordinate overloads are 0-based, so `getRange(0, 0)` is `A1`
- if `setValue('=...')` or `setFormula('=...')` writes a formula, wait for `await univerAPI.getFormula().onCalculationResultApplied()` before reading the computed result
- `setValues()` requires a rectangular 2D array whose shape exactly matches the target range; `getRange(row, col)` without size only targets one cell
