# JS API Minimal Reference

Use this reference when `agent-sheet run` is necessary.

`run` is the default programmable workbook surface. It is not the first choice for ordinary reconnaissance, hit localization, propagation, or bulk transfer, but it remains the right path when those smaller primitives cannot express the task cleanly, especially for:

- workbook styling and presentation
- row/column sizing, visibility, and freeze panes
- merge / unmerge flows
- advanced formula orchestration
- bounded structural edits that need direct Univer API access

## Positioning

Use built-in primitives first:

- `inspect range`
- `inspect sheet`
- `inspect workbook`
- `inspect formulas`
- `search`
- `fill`
- `pipe out`
- `pipe in`

Switch to `run` when you can clearly explain the gap, for example:

- "I need borders, fonts, colors, alignment, or number formats."
- "I need to freeze rows/columns or adjust row height/column width."
- "I need merge/unmerge behavior."
- "I need a bounded API workflow that is awkward or impossible with the smaller primitives."

**Related**: [../playbooks/02-common-workflows.md](../playbooks/02-common-workflows.md)

## Description

The `run` command provides programmable access to read and manipulate spreadsheet data through JavaScript execution.

**Execution environment:**

- code submitted to `run` executes inside the Univer spreadsheet engine JavaScript runtime
- only use Univer API methods documented below; guessing method names is dangerous

## Usage notes

**Core requirements:**

- all code must be wrapped in an arrow function: `() => { ... }`, `async () => { ... }`
- always return an object with results: `return { success: true, ... }`
- only use methods explicitly documented in the API reference below
- do not invent, assume, or guess method names

# Quick reference

## Object hierarchy diagram

```text
univerAPI (Global Entry Point)
    └── getActiveWorkbook() → FWorkbook (Workbook Object)
        ├── getSheetByName(name) → FWorksheet | null (recommended)
        │   └── getRange() → FRange (Cell Range Object)
        ├── getSheets() → FWorksheet[] (get all worksheets)
        ├── create() → FWorksheet
        └── deleteSheet() → boolean
```

## Core access pattern

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sheet1');
    if (!sheet) {
        return { success: false, error: 'Sheet "Sheet1" not found' };
    }
    const range = sheet.getRange('A1');

    const value = range.getValue();
    range.setValue(value * 2);

    return { success: true, original: value, result: value * 2 };
}
```

## Key constraint reminders

- strictly use documented methods; do not guess or invent method names
- wrap all code in an arrow function
- return a result object
- `getRange()` coordinate overloads use 0-based indexing
- A1 notation is usually clearer than numeric coordinates

## Critical: formula calculation is asynchronous

When you set a formula via `setFormula()` or `setValue()` with a formula string starting with `=`, the Univer engine calculates the result asynchronously.
If you read the cell value immediately after setting a formula, you may get a stale or incorrect value.

Use `await univerAPI.getFormula().onCalculationResultApplied()` when you need to read formula results.

```javascript
async () => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sales');
    if (!sheet) return { success: false, error: 'Sheet "Sales" not found' };
    sheet.getRange('A1').setFormula('=SUM(B1:B10)');
    await univerAPI.getFormula().onCalculationResultApplied();
    const value = sheet.getRange('A1').getValue();
    return { success: true, value };
}
```

# Complete API Reference

Only use methods explicitly listed below.

## univerAPI

### Core methods

- `getActiveWorkbook() → FWorkbook`
- `getFormula() → FFormula`

**Enum.Dimension constants:**

- `univerAPI.Enum.Dimension.ROWS`
- `univerAPI.Enum.Dimension.COLUMNS`

**Enum.BorderType constants:**

- `univerAPI.Enum.BorderType.TOP`
- `univerAPI.Enum.BorderType.BOTTOM`
- `univerAPI.Enum.BorderType.LEFT`
- `univerAPI.Enum.BorderType.RIGHT`
- `univerAPI.Enum.BorderType.ALL`
- `univerAPI.Enum.BorderType.OUTSIDE`
- `univerAPI.Enum.BorderType.INSIDE`
- `univerAPI.Enum.BorderType.NONE`

**Enum.BorderStyleTypes constants:**

- `univerAPI.Enum.BorderStyleTypes.THIN`
- `univerAPI.Enum.BorderStyleTypes.HAIR`
- `univerAPI.Enum.BorderStyleTypes.MEDIUM`
- `univerAPI.Enum.BorderStyleTypes.THICK`
- `univerAPI.Enum.BorderStyleTypes.DASHED`
- `univerAPI.Enum.BorderStyleTypes.DOUBLE`

## FWorkbook

**How to get**: `univerAPI.getActiveWorkbook()`

- `getSheetByName(name) → FWorksheet | null`
- `getSheets() → FWorksheet[]`
- `create(name, rows, cols) → FWorksheet`
- `deleteSheet(sheetId) → boolean`

## FFormula

**How to get**: `univerAPI.getFormula()`

- `onCalculationResultApplied() → Promise<void>`

## FWorksheet

**How to get**: `fWorkbook.getSheetByName('SheetName')`

### Basic information

- `getSheetId() → number`
- `getSheetName() → string`
- `getLastRow() → number`
- `getLastColumn() → number`
- `getRange(row, col) | (row, col, rowCount, colCount) | (notation) → FRange`
- `hasHiddenGridLines() → boolean`

### Modification methods

- `setName(name) → void`
- `insertRows(rowIndex, numRows) → FWorksheet`
- `deleteRows(rowIndex, numRows) → FWorksheet`
- `setRowHeight(rowIndex, height) → FWorksheet`
- `setRowHeights(startRow, numRows, height) → FWorksheet`
- `showRows(rowIndex, numRows) → FWorksheet`
- `hideRows(rowIndex, numRows) → FWorksheet`
- `autoResizeRows(startRow, numRows) → FWorksheet`
- `setFrozenRows(rows) | (startRow, endRow) → FWorksheet`
- `insertColumns(columnIndex, numColumns) → FWorksheet`
- `deleteColumns(columnIndex, numColumns) → FWorksheet`
- `setColumnWidth(columnIndex, width) → FWorksheet`
- `setColumnWidths(startColumn, numColumns, width) → FWorksheet`
- `showColumns(columnIndex, numColumns) → FWorksheet`
- `hideColumns(columnIndex, numColumns) → FWorksheet`
- `autoResizeColumns(startColumn, numColumns) → FWorksheet`
- `setFrozenColumns(columns) | (startColumn, endColumn) → FWorksheet`
- `setHiddenGridlines(hidden) → FWorksheet`
- `setGridLinesColor(color) → FWorksheet`

## FRange

**How to get**: from `FWorksheet.getRange()`

### Data reading

- `getValue() → any`
- `getRawValue() → any`
- `getValues() → any[][]`
- `getRawValues() → any[][]`
- `getFormulas() → string[][]`
- `getA1Notation(withSheet?) → string`
- `forEach(callback) → void`
- `isMerged() → boolean`
- `isPartOfMerge() → boolean`

### Data writing and styling

- `setValue(value) → FRange`
- `setValues(values) → FRange`
- `setFormula(formula) → void`
- `setFontWeight(weight) → FRange`
- `setFontLine(line) → FRange`
- `setFontFamily(family) → FRange`
- `setFontSize(size) → FRange`
- `setFontColor(color) → FRange`
- `setFontStyle(style) → FRange`
- `setBackgroundColor(color) → FRange`
- `setHorizontalAlignment(alignment) → FRange`
- `setVerticalAlignment(alignment) → FRange`
- `setBorder(type, style, color?) → FRange`
- `setNumberFormats(patterns) → FRange`
- `clearContent() → void`
- `clearFormat() → void`
- `insertCells(dimension) → void`
- `deleteCells(dimension) → void`
- `merge(options?) → void`
- `breakApart() → void`
- `mergeAcross() → void`
- `mergeVertically() → void`
- `autoFill(destRange, fillType?) → Promise<void>`

# Core concepts

## Coordinate system: 0-based indexing

JavaScript uses 0-based indices. Convert from spreadsheet notation with `jsIndex = spreadsheetIndex - 1`.

- `getRange(0, 0)` = cell A1
- `getRange(1, 2)` = cell C2
- `getRange(0, 0, 2, 2)` = range A1:B2
- `insertRows(4, 3)` inserts 3 rows starting at spreadsheet row 5

## A1 notation vs coordinates

- use A1 notation for clarity: `getRange('A1:B10')`
- use coordinates for dynamic access inside loops
- A1 notation supports `'A1'`, `'A1:B10'`, `'A:A'`, and `'1:1'`
