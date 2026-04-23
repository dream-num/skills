# Run API

Use this only for `univer run` tasks where `inspect`, `search`, `fill`, or `pipe` is not enough.

## Entry point

Start from the active workbook:

```javascript
const workbook = univerAPI.getActiveWorkbook();
```

Common top-level APIs:

- `univerAPI.getActiveWorkbook() -> FWorkbook`
- `univerAPI.getFormula() -> FFormula`
- `univerAPI.Enum.Dimension.ROWS`
- `univerAPI.Enum.Dimension.COLUMNS`

## Workbook and worksheet access

- `workbook.getSheetByName(name) -> FWorksheet | null`
- `workbook.getSheets() -> FWorksheet[]`
- `workbook.create(name, rows, cols) -> FWorksheet`
- `workbook.deleteSheet(sheetId) -> boolean`
- `sheet.getSheetName() -> string`
- `sheet.getSheetId() -> number`
- `sheet.getLastRow() -> number`
- `sheet.getLastColumn() -> number`

Prefer `getSheetByName(...)` so the worksheet boundary stays explicit and reviewable.

## Range access

Supported `getRange` forms:

- `sheet.getRange('A1')`
- `sheet.getRange('A1:C10')`
- `sheet.getRange(row, col)`
- `sheet.getRange(row, col, rowCount, colCount)`

Numeric coordinates are 0-based. `getRange(0, 0)` is `A1`; `getRange(0, 0, 2, 2)` is `A1:B2`.

Common range operations:

- `range.getValues()`
- `range.getValue()`
- `range.setValues(values)`
- `range.setValue(value)`
- `range.setFormula(formula)`
- `range.setFormulas(formulas)`
- `range.clearContent()`
- `range.autoFill(destRange, fillType?)`

## Pattern

Return a small structured result that can be checked after the command:

```javascript
() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName('Summary');
  if (!sheet) return { success: false, error: 'Sheet "Summary" not found' };

  sheet.getRange('A1:B2').setValues([
    ['Metric', 'Value'],
    ['Rows', sheet.getLastRow() + 1],
  ]);

  return {
    success: true,
    sheetName: sheet.getSheetName(),
    preview: sheet.getRange('A1:B2').getValues(),
  };
}
```

After `run`, verify with `inspect range` or `pipe out` on the smallest range that proves the change.
