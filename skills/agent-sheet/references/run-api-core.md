# Run API Core Reference

This page groups the workbook, worksheet, and structural APIs used in normal `run` tasks.

## Entry Point

Start from the active workbook:

```javascript
const workbook = univerAPI.getActiveWorkbook();
```

Related top-level APIs:

- `univerAPI.getActiveWorkbook() -> FWorkbook`
- `univerAPI.getFormula() -> FFormula`

## Workbook Access

Use the workbook object to locate, list, create, and delete sheets.

- `getSheetByName(name) -> FWorksheet | null`
- `getSheets() -> FWorksheet[]`
- `create(name, rows, cols) -> FWorksheet`
- `deleteSheet(sheetId) -> boolean`

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

- `getSheetId() -> number`
- `getSheetName() -> string`
- `getLastRow() -> number`
- `getLastColumn() -> number`
- `hasHiddenGridLines() -> boolean`

Important worksheet writes:

- `setName(name) -> void`
- `insertRows(rowIndex, numRows) -> FWorksheet`
- `deleteRows(rowIndex, numRows) -> FWorksheet`
- `insertColumns(columnIndex, numColumns) -> FWorksheet`
- `deleteColumns(columnIndex, numColumns) -> FWorksheet`
- `setFrozenRows(rows)` or `setFrozenRows(startRow, endRow) -> FWorksheet`
- `setFrozenColumns(columns)` or `setFrozenColumns(startColumn, endColumn) -> FWorksheet`
- `setHiddenGridlines(hidden) -> FWorksheet`
- `setGridLinesColor(color) -> FWorksheet`

Also available for row and column presentation work:

- `setRowHeight(rowIndex, height) -> FWorksheet`
- `setRowHeights(startRow, numRows, height) -> FWorksheet`
- `showRows(rowIndex, numRows) -> FWorksheet`
- `hideRows(rowIndex, numRows) -> FWorksheet`
- `autoResizeRows(startRow, numRows) -> FWorksheet`
- `setColumnWidth(columnIndex, width) -> FWorksheet`
- `setColumnWidths(startColumn, numColumns, width) -> FWorksheet`
- `showColumns(columnIndex, numColumns) -> FWorksheet`
- `hideColumns(columnIndex, numColumns) -> FWorksheet`
- `autoResizeColumns(startColumn, numColumns) -> FWorksheet`

## `getRange()`

`getRange()` is the standard bridge from a worksheet to cell-level work.

Supported forms:

- `getRange('A1')`
- `getRange('A1:C10')`
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
