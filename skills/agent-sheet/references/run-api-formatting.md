# Run API Formatting Reference

This page groups the formatting APIs commonly used in `run`.

## Font Formatting

Available font APIs:

- `setFontWeight(weight) -> FRange` - set font weight such as `'bold'`; `null` clears it
- `setFontLine(line) -> FRange` - set text decoration such as `'underline'`, `'line-through'`, or `'none'`
- `setFontFamily(family) -> FRange` - set font family such as `Arial`, `Verdana`, `Microsoft YaHei`, `SimSun`, or `SimHei`
- `setFontSize(size) -> FRange` - set font size as a number
- `setFontColor(color) -> FRange` - set font color with a CSS color string such as `'#ffffff'` or `'white'`; `null` resets it
- `setFontStyle(style) -> FRange` - set font style such as `'italic'` or `'normal'`; `null` resets it

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

- `setBackgroundColor(color) -> FRange` - set background fill color with a CSS color string

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

- `setHorizontalAlignment(alignment) -> FRange` - set horizontal alignment such as `'left'`, `'center'`, or `'normal'`
- `setVerticalAlignment(alignment) -> FRange` - set vertical alignment such as `'top'`, `'middle'`, or `'bottom'`

Notes:

- in this API, `'normal'` horizontal alignment means right alignment
- use alignment changes only when workbook-visible verification does not already have a smaller primitive

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

- `univerAPI.Enum.BorderType.TOP` - top border only
- `univerAPI.Enum.BorderType.BOTTOM` - bottom border only
- `univerAPI.Enum.BorderType.LEFT` - left border only
- `univerAPI.Enum.BorderType.RIGHT` - right border only
- `univerAPI.Enum.BorderType.ALL` - all borders, including outer and inner grid lines
- `univerAPI.Enum.BorderType.OUTSIDE` - outside borders only
- `univerAPI.Enum.BorderType.INSIDE` - inside borders only
- `univerAPI.Enum.BorderType.NONE` - clear or remove borders from the range

Border style constants:

- `univerAPI.Enum.BorderStyleTypes.THIN` - thin line, the most common default
- `univerAPI.Enum.BorderStyleTypes.HAIR` - hair line
- `univerAPI.Enum.BorderStyleTypes.MEDIUM` - medium line
- `univerAPI.Enum.BorderStyleTypes.THICK` - thick line
- `univerAPI.Enum.BorderStyleTypes.DASHED` - dashed line
- `univerAPI.Enum.BorderStyleTypes.DOUBLE` - double line

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

- `setNumberFormats(patterns) -> FRange` - set number formats with a 2D array that matches the target range shape

`patterns` is a 2D array aligned to the target range, similar to `setValues()`.

Common patterns:

- `#,##0.00` - thousands separator with two decimals
- `0.00%` - percentage
- `yyyy-MM-DD` - date

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
