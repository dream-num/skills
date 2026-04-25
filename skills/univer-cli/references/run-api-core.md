# Run API Core Reference

This page groups the workbook, worksheet, and structural APIs used in normal `run` tasks.

## Entry Point

Start from the active workbook:

```javascript
const workbook = univerAPI.getActiveWorkbook();
```

Related top-level APIs:

- `univerAPI.getActiveWorkbook() -> FWorkbook` - get the current active workbook
- `univerAPI.getFormula() -> FFormula` - get the formula engine instance used for calculation synchronization

Dimension constants used by range cell-shift operations:

- `univerAPI.Enum.Dimension.ROWS` - row dimension constant for `insertCells()` and `deleteCells()`
- `univerAPI.Enum.Dimension.COLUMNS` - column dimension constant for `insertCells()` and `deleteCells()`

## Workbook Access

Use the workbook object to locate, list, create, and delete sheets.

- `getSheetByName(name) -> FWorksheet | null` - recommended explicit lookup by sheet name
- `getSheets() -> FWorksheet[]` - list all worksheets; useful when the task first needs sheet names
- `create(name, rows, cols) -> FWorksheet` - create a new worksheet with an initial shape
- `deleteSheet(sheetId) -> boolean` - delete the specified worksheet by sheet id

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const existing = workbook.getSheetByName('Summary');
    if (existing) {
        return { success: true, sheetName: existing.getSheetName() };
    }

    const sheet = workbook.create('Summary', 100, 20);
    return { success: true, sheetName: sheet.getSheetName() };
}
```

## Worksheet Access

Important worksheet reads:

- `getSheetId() -> number` - worksheet id
- `getSheetName() -> string` - worksheet name
- `getLastRow() -> number` - 0-based index of the last row with data; returns `15` if data extends to spreadsheet row 16
- `getLastColumn() -> number` - 0-based index of the last column with data; returns `4` if data extends to column `E`
- `hasHiddenGridLines() -> boolean` - check whether gridlines are hidden

Important worksheet writes:

- `setName(name) -> void` - rename the worksheet
- `insertRows(rowIndex, numRows) -> FWorksheet` - insert rows at a 0-based starting index
- `deleteRows(rowIndex, numRows) -> FWorksheet` - delete rows at a 0-based starting index
- `insertColumns(columnIndex, numColumns) -> FWorksheet` - insert columns at a 0-based starting index
- `deleteColumns(columnIndex, numColumns) -> FWorksheet` - delete columns at a 0-based starting index
- `setFrozenRows(rows)` or `setFrozenRows(startRow, endRow) -> FWorksheet` - freeze the first `rows` rows, or freeze a row range
- `setFrozenColumns(columns)` or `setFrozenColumns(startColumn, endColumn) -> FWorksheet` - freeze the first `columns` columns, or freeze a column range
- `setHiddenGridlines(hidden) -> FWorksheet` - show or hide sheet gridlines
- `setGridLinesColor(color) -> FWorksheet` - set gridline color; `undefined` or `null` resets to default

Also available for row and column presentation work:

- `setRowHeight(rowIndex, height) -> FWorksheet` - set one row height in pixels
- `setRowHeights(startRow, numRows, height) -> FWorksheet` - set multiple row heights
- `showRows(rowIndex, numRows) -> FWorksheet` - show hidden rows
- `hideRows(rowIndex, numRows) -> FWorksheet` - hide rows
- `autoResizeRows(startRow, numRows) -> FWorksheet` - auto-size row heights to content
- `setColumnWidth(columnIndex, width) -> FWorksheet` - set one column width in pixels
- `setColumnWidths(startColumn, numColumns, width) -> FWorksheet` - set multiple column widths
- `showColumns(columnIndex, numColumns) -> FWorksheet` - show hidden columns
- `hideColumns(columnIndex, numColumns) -> FWorksheet` - hide columns
- `autoResizeColumns(startColumn, numColumns) -> FWorksheet` - auto-size column widths to content

Formula wait API:

- `onCalculationResultApplied() -> Promise<void>` - wait until formula-calculation results are applied before reading computed values
- note: if a real calculation runs, it resolves when results are applied; if no calculation starts quickly, it can resolve automatically instead of hanging forever

## `getRange()`

`getRange()` is the standard bridge from a worksheet to cell-level work.

Supported forms:

- `getRange('A1')`
- `getRange('A1:C10')`
- `getRange('A:A')`
- `getRange('1:1')`
- `getRange(row, col)`
- `getRange(row, col, rowCount, colCount)`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sales');
    if (!sheet) return { success: false, error: 'Sheet "Sales" not found' };

    const header = sheet.getRange('A1:C1').getValues();
    const firstCell = sheet.getRange(0, 0).getValue();

    return { success: true, header, firstCell };
}
```

## Coordinate Model

Numeric coordinates are 0-based:

- `getRange(0, 0)` is `A1`
- `getRange(1, 2)` is `C2`
- `getRange(0, 0, 2, 2)` is `A1:B2`
- `insertRows(4, 3)` inserts 3 rows starting at spreadsheet row 5
- `insertColumns(1, 2)` inserts 2 columns starting at spreadsheet column B

Use numeric coordinates for loops or generated positions. Use A1 notation when the target range is fixed and readability matters more.

## A1 Notation

Prefer A1 notation for explicit workbook-facing locations:

- `'A1'`
- `'A1:B10'`
- `'A:A'`
- `'1:1'`

A1 notation is usually easier to review and less error-prone than numeric coordinates.

## Sheet Structure Examples

Insert rows and freeze the header:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Ops');
    if (!sheet) return { success: false, error: 'Sheet "Ops" not found' };

    sheet.insertRows(1, 2);
    sheet.setFrozenRows(1);

    return { success: true, lastRow: sheet.getLastRow() };
}
```

Hide gridlines and set their color:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Dashboard');
    if (!sheet) return { success: false, error: 'Sheet "Dashboard" not found' };

    sheet.setHiddenGridlines(true);
    sheet.setGridLinesColor('#D9D9D9');

    return { success: true, hidden: sheet.hasHiddenGridLines() };
}
```
