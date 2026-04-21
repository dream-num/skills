# Run API Ranges Reference

This page groups cell and range operations for ordinary `run` tasks.

## Reading From `FRange`

Get a range from `sheet.getRange(...)`, then use these reads:

- `getValue() -> any`
- `getRawValue() -> any`
- `getValues() -> any[][]`
- `getRawValues() -> any[][]`
- `getFormulas() -> string[][]`
- `getA1Notation(withSheet?) -> string`
- `forEach(callback) -> void`
- `isMerged() -> boolean`
- `isPartOfMerge() -> boolean`

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

- `setValue(value) -> FRange`
- `setValues(values) -> FRange`
- `setFormula(formula) -> void`

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
- `onCalculationResultApplied() -> Promise<void>`

## Merge And Unmerge

Merge APIs:

- `merge(options?) -> void`
- `breakApart() -> void`
- `mergeAcross() -> void`
- `mergeVertically() -> void`

Typical uses:

- `merge()` for one combined block
- `mergeAcross()` to merge each row across the selected columns
- `mergeVertically()` to merge each column down the selected rows
- `breakApart()` to remove merges

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

- `clearContent() -> void`
- `clearFormat() -> void`

Cell shift APIs:

- `insertCells(dimension) -> void`
- `deleteCells(dimension) -> void`

Dimension constants:

- `univerAPI.Enum.Dimension.ROWS`
- `univerAPI.Enum.Dimension.COLUMNS`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Queue');
    if (!sheet) return { success: false, error: 'Sheet "Queue" not found' };

    sheet.getRange('B2:C3').clearContent();
    sheet.getRange('D2:D10').insertCells(univerAPI.Enum.Dimension.ROWS);

    return { success: true };
}
```

## AutoFill

Use `autoFill()` when a correct seed pattern already exists and the workbook should propagate it.

- `autoFill(destRange, fillType?) -> Promise<void>`

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
