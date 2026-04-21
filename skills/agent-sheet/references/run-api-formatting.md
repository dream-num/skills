# Run API Formatting Reference

This page groups the formatting APIs commonly used in `run`.

## Font Formatting

Available font APIs:

- `setFontWeight(weight) -> FRange`
- `setFontLine(line) -> FRange`
- `setFontFamily(family) -> FRange`
- `setFontSize(size) -> FRange`
- `setFontColor(color) -> FRange`
- `setFontStyle(style) -> FRange`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Report');
    if (!sheet) return { success: false, error: 'Sheet "Report" not found' };

    sheet.getRange('A1:D1')
        .setFontWeight('bold')
        .setFontSize(14)
        .setFontFamily('Arial')
        .setFontColor('#1F1F1F');

    return { success: true };
}
```

## Background Fill

Available background API:

- `setBackgroundColor(color) -> FRange`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Report');
    if (!sheet) return { success: false, error: 'Sheet "Report" not found' };

    sheet.getRange('A1:D1').setBackgroundColor('#F2F2F2');
    return { success: true };
}
```

## Alignment

Available alignment APIs:

- `setHorizontalAlignment(alignment) -> FRange`
- `setVerticalAlignment(alignment) -> FRange`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Report');
    if (!sheet) return { success: false, error: 'Sheet "Report" not found' };

    sheet.getRange('A1:D10')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');

    return { success: true };
}
```

## Borders

Border API:

- `setBorder(type, style, color?) -> FRange`

Border type constants:

- `univerAPI.Enum.BorderType.TOP`
- `univerAPI.Enum.BorderType.BOTTOM`
- `univerAPI.Enum.BorderType.LEFT`
- `univerAPI.Enum.BorderType.RIGHT`
- `univerAPI.Enum.BorderType.ALL`
- `univerAPI.Enum.BorderType.OUTSIDE`
- `univerAPI.Enum.BorderType.INSIDE`
- `univerAPI.Enum.BorderType.NONE`

Border style constants:

- `univerAPI.Enum.BorderStyleTypes.THIN`
- `univerAPI.Enum.BorderStyleTypes.HAIR`
- `univerAPI.Enum.BorderStyleTypes.MEDIUM`
- `univerAPI.Enum.BorderStyleTypes.THICK`
- `univerAPI.Enum.BorderStyleTypes.DASHED`
- `univerAPI.Enum.BorderStyleTypes.DOUBLE`

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Report');
    if (!sheet) return { success: false, error: 'Sheet "Report" not found' };

    sheet.getRange('A1:D10').setBorder(
        univerAPI.Enum.BorderType.OUTSIDE,
        univerAPI.Enum.BorderStyleTypes.THIN,
        '#808080'
    );

    return { success: true };
}
```

## Number Formats

Number format API:

- `setNumberFormats(patterns) -> FRange`

`patterns` is a 2D array aligned to the target range, similar to `setValues()`.

Example:

```javascript
() => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Finance');
    if (!sheet) return { success: false, error: 'Sheet "Finance" not found' };

    sheet.getRange('B2:C3').setNumberFormats([
        ['$#,##0.00', '0.00%'],
        ['$#,##0.00', '0.00%'],
    ]);

    return { success: true };
}
```

## Clearing Format

Use `clearFormat()` to remove formatting from a range without deleting its content:

- `clearFormat() -> void`
