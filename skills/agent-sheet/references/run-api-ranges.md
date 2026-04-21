# Run API Ranges Reference

This page groups cell and range operations for ordinary `run` tasks.

## Reading From `FRange`

Get a range from `sheet.getRange(...)`, then use these reads:

- `getValue() -> any` - get the top-left cell value as the normal displayed value
- `getRawValue() -> any` - get the top-left cell raw underlying value
- `getValues() -> any[][]` - get all cell values in the range as a 2D array
- `getRawValues() -> any[][]` - get all underlying raw values in the range as a 2D array
- `getFormulas() -> string[][]` - get formulas in A1 notation
- `getA1Notation(withSheet?) -> string` - get the range A1 notation; `withSheet=true` includes the sheet name
- `forEach(callback) -> void` - iterate cells in the range
- `isMerged() -> boolean` - check whether the range itself is merged
- `isPartOfMerge() -> boolean` - check whether the range falls inside a merged region

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sales');
    if (!sheet) return { success: false, error: 'Sheet "Sales" not found' };

    const range = sheet.getRange('A1:C3');
    return {
        success: true,
        a1: range.getA1Notation(),
        values: range.getValues(),
        formulas: range.getFormulas(),
    };
}
```

## Writing To `FRange`

Core writes:

- `setValue(value) -> FRange` - set one value across the target range; if the value starts with `=`, it can also write a formula
- `setValues(values) -> FRange` - batch set values from a 2D array
- `setFormula(formula) -> void` - set a formula in A1 notation such as `=SUM(A1:B10)`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sheet1');
    if (!sheet) return { success: false, error: 'Sheet "Sheet1" not found' };

    sheet.getRange('A1').setValue('Total');
    sheet.getRange('B2:C3').setValues([
        [10, 20],
        [30, 40],
    ]);

    return { success: true };
}
```

## `setValues()` Shape Rules

`setValues()` expects a rectangular 2D array whose shape matches the target range:

- one row per worksheet row in the target range
- one column per worksheet column in the target range
- keep every inner array the same length
- use `getRange('A1:C10')` or `getRange(0, 0, 10, 3)` to define the full target shape
- `getRange(row, col)` without size only targets a single cell

Correct:

```javascript
sheet.getRange('A1:B2').setValues([
    ['Name', 'Score'],
    ['Ada', 95],
]);
```

Incorrect shape:

```javascript
sheet.getRange('A1:B2').setValues([
    ['Name'],
    ['Ada', 95, 'extra'],
]);
```

When writing a single cell, use `setValue()` unless the task specifically benefits from 2D shape handling.

## Formulas And Async Readback

Formula calculation is asynchronous. This applies to:

- `range.setFormula('=SUM(B1:B10)')`
- `range.setValue('=SUM(B1:B10)')`

If you need the calculated result in the same `run`, wait for formula application:

```javascript
async () => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sales');
    if (!sheet) return { success: false, error: 'Sheet "Sales" not found' };

    sheet.getRange('A1').setFormula('=SUM(B1:B10)');
    await univerAPI.getFormula().onCalculationResultApplied();

    return {
        success: true,
        value: sheet.getRange('A1').getValue(),
    };
}
```

Available formula wait API:

- `univerAPI.getFormula() -> FFormula`
- `onCalculationResultApplied() -> Promise<void>` - wait for formula-calculation results to be applied before reading the computed value

## Merge And Unmerge

Merge APIs:

- `merge(options?) -> void` - merge cells into one block
- `breakApart() -> void` - unmerge cells
- `mergeAcross() -> void` - merge each row across the selected columns
- `mergeVertically() -> void` - merge each column down the selected rows

Typical uses:

- `merge()` for one combined block
- `mergeAcross()` to merge each row across the selected columns
- `mergeVertically()` to merge each column down the selected rows
- `breakApart()` to remove merges
- use `merge({ isForceMerge: true })` if you need to clear overlapping merges first

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Report');
    if (!sheet) return { success: false, error: 'Sheet "Report" not found' };

    sheet.getRange('A1:D1').merge();
    sheet.getRange('A3:D4').mergeAcross();

    return {
        success: true,
        titleMerged: sheet.getRange('A1').isPartOfMerge(),
    };
}
```

## Clear And Cell Shift Operations

Clear APIs:

- `clear() -> void` - clear the full range
- `clearContent() -> void` - clear only content and keep formatting
- `clearFormat() -> void` - clear only formatting and keep content

Use `clear()` when the task is to clear the full range. Use `clearContent()` or `clearFormat()` when you only want one part of that behavior.

Cell shift APIs:

- `insertCells(dimension) -> void` - insert cells and shift existing cells in the given dimension
- `deleteCells(dimension) -> void` - delete cells and shift remaining cells in the given dimension

Dimension constants:

- `univerAPI.Enum.Dimension.ROWS`
- `univerAPI.Enum.Dimension.COLUMNS`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Queue');
    if (!sheet) return { success: false, error: 'Sheet "Queue" not found' };

    sheet.getRange('B2:C3').clear();
    sheet.getRange('D2:D10').insertCells(univerAPI.Enum.Dimension.ROWS);

    return { success: true };
}
```

## AutoFill

Use `autoFill()` when a correct seed pattern already exists and the workbook should propagate it.

- `autoFill(destRange, fillType?) -> Promise<void>` - propagate from the source range into a larger destination that includes the source

Notes:

- `destRange` must include the source range
- `fillType` can be `'SERIES'` (default) or `'COPY'`
- this method is async; use `await`

Example:

```javascript
async () => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Series');
    if (!sheet) return { success: false, error: 'Sheet "Series" not found' };

    const source = sheet.getRange('A1:A2');
    const dest = sheet.getRange('A1:A10');
    await source.autoFill(dest);

    return { success: true, values: dest.getValues() };
}
```
