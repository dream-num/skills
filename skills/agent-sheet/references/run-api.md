# Run API Reference

`run` is the programmable workbook surface in `agent-sheet`. It executes a bounded JavaScript function inside the Univer spreadsheet engine so you can read workbook state, apply workbook-native edits, and return a structured result.

Use `run` when the work is workbook-local logic that is clearer or more reliable in API form, especially for:

- styling and presentation
- row or column structure changes
- freeze panes, gridline settings, and sheet-level display settings
- merge or unmerge flows
- formula orchestration that needs workbook-native recalculation
- bounded read/compute/write logic inside one workbook

Do not use `run` when a smaller surface already expresses the job cleanly:

- `inspect` for reconnaissance and workbook-visible verification
- `search` to locate rows, columns, sheets, and formula matches
- `fill` when a correct seed already exists and you want spreadsheet-style propagation
- `pipe out` / `pipe in` for bulk rectangular data roundtrips through shell tools

`run` is the standard programmable surface for bounded workbook logic.

## Execution Environment

- code runs inside the Univer spreadsheet engine JavaScript runtime
- write the code as an arrow function: `() => {}` or `async () => {}`
- return a plain object so the caller gets explicit structured results
- use only APIs documented in this reference family
- do not guess method names or undocumented overloads

## Hard Rules

- always wrap the program in an arrow function
- always return an object
- prefer A1 notation for fixed ranges
- remember that coordinate overloads are 0-based
- check for missing sheets before writing
- keep the operation bounded to the workbook task at hand
- verify the result with workbook-visible reads after the command

## Formula Warning

Formula calculation is asynchronous. If you set a formula with `setFormula()` or by writing a string starting with `=`, do not read the computed result immediately. Wait for calculation to finish:

```javascript
await univerAPI.getFormula().onCalculationResultApplied();
```

Without that wait, readback can be stale.

## Minimal Standard Example

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sheet1');
    if (!sheet) {
        return { success: false, error: 'Sheet "Sheet1" not found' };
    }

    const range = sheet.getRange('A1');
    const original = range.getValue();
    const next = Number(original ?? 0) + 1;
    range.setValue(next);

    return { success: true, original, next };
}
```

## Read Next

- [run-api-core.md](run-api-core.md): workbook, sheet, structure, coordinates, and `getRange()`
- [run-api-ranges.md](run-api-ranges.md): range reads and writes, formulas, merges, clear, cell insertion and deletion, autofill
- [run-api-formatting.md](run-api-formatting.md): fonts, fills, alignment, borders, and number formats
- [run-api-advanced.md](run-api-advanced.md): current boundary for advanced spreadsheet features
