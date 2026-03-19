# JS API Minimal Reference

Use this reference when `agent-sheet script js` is necessary.

`script js` is not the default path for ordinary spreadsheet edits, but it remains an important escape hatch for tasks that built-in commands cannot express cleanly, especially:

- workbook styling and presentation
- row/column sizing, visibility, and freeze panes
- merge / unmerge flows
- advanced formula orchestration
- bounded structural edits that need direct Univer API access

## Positioning

Use built-in commands first:

- `read range`
- `read search`
- `inspect sheet`
- `inspect workbook`
- `write cells`
- `write range`
- `write fill`
- `sheet create|rename|copy|delete`

Switch to `script js` when you can clearly explain the gap, for example:

- "I need borders, fonts, colors, alignment, or number formats."
- "I need to freeze rows/columns or adjust row height/column width."
- "I need merge/unmerge behavior."
- "I need a bounded API workflow that is awkward or impossible with current `read.*` / `write.*` / `sheet.*`."

**Related**: [../playbooks/40-script-fallback.md](../playbooks/40-script-fallback.md)

## Description

The `script js` command provides powerful programmatic access to read and manipulate spreadsheet data through JavaScript execution.

**Execution Environment:**
- Code submitted to `script js` runs inside the Univer Spreadsheet Engine's JavaScript runtime.
- Only use Univer API methods documented below - guessing method names is DANGEROUS

## Usage Notes

**Core Requirements:**
- All eval_js code MUST be wrapped in an arrow function: `() => { ... }`, `async () => { ... }`
- Always return an object with results: `return { success: true, ... }`
- ONLY use methods explicitly documented in the API Reference below
- DO NOT invent, assume, or guess method names

# 🎯 Quick Reference

## Object Hierarchy Diagram
```
univerAPI (Global Entry Point)
    └── getActiveWorkbook() → FWorkbook (Workbook Object)
        ├── getSheetByName(name) → FWorksheet | null (✅ RECOMMENDED - explicit sheet access)
        │   └── getRange() → FRange (Cell Range Object)
        ├── getSheets() → FWorksheet[] (get all worksheets)
        ├── create() → FWorksheet
        └── deleteSheet() → boolean
```

## Core Access Pattern
```javascript
() => {
    // Standard access flow - ALWAYS use explicit sheet name
    const workbook = univerAPI.getActiveWorkbook()
    const sheet = workbook.getSheetByName('Sheet1')  // ✅ Explicit sheet name
    if (!sheet) {
        return { success: false, error: 'Sheet "Sheet1" not found' }
    }
    const range = sheet.getRange('A1')

    // Manipulate data
    const value = range.getValue()
    range.setValue(value * 2)

    return { success: true, original: value, result: value * 2 }
}
```

## Key Constraint Reminders
- **Strictly use documented methods** - Do not guess or invent method names
- **Arrow function wrapper** - All code must be wrapped in `() => { ... }`
- **Return result object** - Must return `{ success: true, ... }`
- **0-based indexing** - getRange() uses 0-based indexing (0,0 = A1)
- **A1 notation** - Can use 'A1:B10' format for clarity

## ⚠️ CRITICAL: Formula Calculation is Asynchronous

When you set a formula (via `setFormula()` OR `setValue()` with a formula string starting with `=`), the Univer engine calculates the result **asynchronously**.
If you read the cell value immediately after setting a formula, you may get a stale or incorrect value.

**Use `await univerAPI.getFormula().onCalculationResultApplied()` when you need to read formula results.**

```javascript
// ✅ CORRECT - Wait for calculation to complete
async () => {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook.getSheetByName('Sales');
    if (!sheet) return { success: false, error: 'Sheet "Sales" not found' };
    sheet.getRange('A1').setFormula('=SUM(B1:B10)');
    await univerAPI.getFormula().onCalculationResultApplied();  // Wait for calculation
    const value = sheet.getRange('A1').getValue();  // Now correct!
    return { success: true, value };
}
```


# 📚 Complete API Reference

**⚠️ CRITICAL: Only use methods explicitly listed below. DO NOT invent or assume methods exist.**

## univerAPI (Global Entry Point Object)

### Core Methods
- `getActiveWorkbook() → FWorkbook` - Get current active workbook
- `getFormula() → FFormula` - Get formula engine instance (for calculation synchronization)

**Enum.Dimension Constants**:
- `univerAPI.Enum.Dimension.ROWS` - Row dimension constant (for insertCells/deleteCells)
- `univerAPI.Enum.Dimension.COLUMNS` - Column dimension constant (for insertCells/deleteCells)

**Enum.BorderType Constants**:
- `univerAPI.Enum.BorderType.TOP` - Top border only
- `univerAPI.Enum.BorderType.BOTTOM` - Bottom border only
- `univerAPI.Enum.BorderType.LEFT` - Left border only
- `univerAPI.Enum.BorderType.RIGHT` - Right border only
- `univerAPI.Enum.BorderType.ALL` - All borders (outer + inner grid lines)
- `univerAPI.Enum.BorderType.OUTSIDE` - Outside borders only (no inner lines)
- `univerAPI.Enum.BorderType.INSIDE` - Inside borders only (inner grid lines)
- `univerAPI.Enum.BorderType.NONE` - Clear/remove borders from range

**Enum.BorderStyleTypes Constants**:
- `univerAPI.Enum.BorderStyleTypes.THIN` - Thin line (most common)
- `univerAPI.Enum.BorderStyleTypes.HAIR` - Hair line
- `univerAPI.Enum.BorderStyleTypes.MEDIUM` - Medium line
- `univerAPI.Enum.BorderStyleTypes.THICK` - Thick line
- `univerAPI.Enum.BorderStyleTypes.DASHED` - Dashed line
- `univerAPI.Enum.BorderStyleTypes.DOUBLE` - Double line

---

## FWorkbook (Workbook Object)
**How to get**: `univerAPI.getActiveWorkbook()`

- `getSheetByName(name) → FWorksheet | null` - Get worksheet by name (RECOMMENDED - explicit, safe)
- `getSheets() → FWorksheet[]` - Get all worksheets (useful to list available sheet names)
- `create(name, rows, cols) → FWorksheet` - Create new worksheet
- `deleteSheet(sheetId) → boolean` - Delete specified worksheet


---

## FFormula (Formula Engine Object)
**How to get**: `univerAPI.getFormula()`

- `onCalculationResultApplied() → Promise<void>` - Waits for formula-calculation results to be applied. Required after setting formulas before reading results.
  - **Note**: If a real calculation runs → resolves when calculation results are applied. If no calculation starts within 500ms → resolves automatically. Global 30s timeout → rejects if something goes wrong.


---

## FWorksheet (Worksheet Object)
**How to get**: Use `fWorkbook.getSheetByName('SheetName')` (✅ recommended) or `create()`.

### Basic Information
- `getSheetId() → number` - Get worksheet ID
- `getSheetName() → string` - Get worksheet name
- `getLastRow() → number` - Get 0-based index of last row with data. Returns 15 if data extends to row 16. Iterate: for(i=0; i<=getLastRow(); i++)
- `getLastColumn() → number` - Get 0-based index of last column with data. Returns 4 if data extends to column E. Iterate: for(j=0; j<=getLastColumn(); j++)
- `getRange(row, col) | (row, col, rowCount, colCount) | (notation) → FRange` - Get range using coordinates or A1 notation (e.g., 'A1:B10', 'A:A', '1:1')
- `hasHiddenGridLines() → boolean` - Check if the gridlines are hidden

### Modification Methods
- `setName(name) → void` - Set worksheet name
- `insertRows(rowIndex, numRows) → FWorksheet` - Insert rows (0-based starting index)
- `deleteRows(rowIndex, numRows) → FWorksheet` - Delete rows (0-based starting index)
- `setRowHeight(rowIndex, height) → FWorksheet` - Set single row height (in pixels)
- `setRowHeights(startRow, numRows, height) → FWorksheet` - Set multiple row heights
- `showRows(rowIndex, numRows) → FWorksheet` - Show hidden rows
- `hideRows(rowIndex, numRows) → FWorksheet` - Hide rows
- `autoResizeRows(startRow, numRows) → FWorksheet` - Auto-resize row heights
- `setFrozenRows(rows) | (startRow, endRow) → FWorksheet` - Set frozen rows. e.g., setFrozenRows(3) freezes first 3 rows; setFrozenRows(2, 3) freezes row range 2-3
- `insertColumns(columnIndex, numColumns) → FWorksheet` - Insert columns (0-based starting index)
- `deleteColumns(columnIndex, numColumns) → FWorksheet` - Delete columns (0-based starting index)
- `setColumnWidth(columnIndex, width) → FWorksheet` - Set single column width (in pixels)
- `setColumnWidths(startColumn, numColumns, width) → FWorksheet` - Set multiple column widths
- `showColumns(columnIndex, numColumns) → FWorksheet` - Show hidden columns
- `hideColumns(columnIndex, numColumns) → FWorksheet` - Hide columns
- `autoResizeColumns(startColumn, numColumns) → FWorksheet` - Auto-resize column widths
- `setFrozenColumns(columns) | (startColumn, endColumn) → FWorksheet` - Set frozen columns. e.g., setFrozenColumns(3) freezes first 3 columns; setFrozenColumns(2, 3) freezes column range 2-3
- `setHiddenGridlines(hidden) → FWorksheet` - Set whether to show gridlines. e.g., setHiddenGridlines(true) hides gridlines
- `setGridLinesColor(color) → FWorksheet` - Set the color of the gridlines. Undefined or null resets to default


---

## FRange (Cell Range Object)
**How to get**: From FWorksheet's getRange() method

### Data Reading
- `getValue() → any` - Get top-left cell value (standard display value)
- `getRawValue() → any` - Get top-left cell raw value (underlying value)
- `getValues() → any[][]` - Get all cell values in range (2D array)
- `getRawValues() → any[][]` - Get all raw values in range (2D array) - underlying unformatted data
- `getFormulas() → string[][]` - Get formulas (A1 notation)
- `getA1Notation(withSheet?) → string` - Get A1 notation (withSheet=true includes sheet name)
- `forEach(callback) → void` - Iterate cells in range, callback: (row, col, cell) => void
- `isMerged() → boolean` - Check if range is merged
- `isPartOfMerge() → boolean` - Check if range is part of merged cell

### Data Writing & Styling
- `setValue(value) → FRange` - Set single value to entire range (can also set formulas if value starts with '=')
  - **Note**: If setting a formula via setValue('=...'), calculation is asynchronous! Use await univerAPI.getFormula().onCalculationResultApplied() to read the result.
- `setValues(values) → FRange` - Batch set values (2D array matching range dimensions)
  - **Note**: Range dimensions MUST match the 2D array dimensions. Use getRange('A1:C10') or getRange(0, 0, 10, 3) to specify the correct range size. Using getRange(row, col) without size will only update a single cell!
- `setFormula(formula) → void` - Set formula (must be A1 notation, e.g., '=SUM(A1:B10)')
  - **Note**: Formula calculation is asynchronous! If you need to read the calculated result, use await univerAPI.getFormula().onCalculationResultApplied() after setting the formula.
- `setFontWeight(weight) → FRange` - Set font weight ('bold' or null to clear)
- `setFontLine(line) → FRange` - Set text decoration ('underline', 'line-through', 'none', null to reset)
- `setFontFamily(family) → FRange` - Set font family (Arial, Times New Roman, Tahoma, Verdana, Microsoft YaHei, SimSun, SimHei, Kaiti, NSimSun)
- `setFontSize(size) → FRange` - Set font size (number)
- `setFontColor(color) → FRange` - Set font color (CSS notation, e.g., '#ffffff' or 'white', null to reset)
- `setFontStyle(style) → FRange` - Set font style ('italic', 'normal', null to reset)
- `setBackgroundColor(color) → FRange` - Set background color (CSS notation)
- `setHorizontalAlignment(alignment) → FRange` - Set horizontal alignment ('left', 'center', 'normal'). Note: 'normal' means right alignment
- `setVerticalAlignment(alignment) → FRange` - Set vertical alignment ('top', 'middle', 'bottom')
- `setBorder(type, style, color?) → FRange` - Set border for range. type: BorderType (e.g., univerAPI.Enum.BorderType.ALL), style: BorderStyleTypes (e.g., univerAPI.Enum.BorderStyleTypes.THIN), color: optional CSS string
  - **Note**: Use BorderType.NONE to clear/remove borders
- `setNumberFormats(patterns) → FRange` - Set number formats for range (2D array matching range dimensions). Common patterns: '#,##0.00' (thousand separator), '0.00%' (percentage), 'yyyy-MM-DD' (date)
- `clearContent() → void` - Clear only content, keep formatting
- `clearFormat() → void` - Clear only formatting, keep content
- `insertCells(dimension) → void` - Insert cells in specified dimension (use univerAPI.Enum.Dimension.ROWS or .COLUMNS)
- `deleteCells(dimension) → void` - Delete cells in specified dimension
- `merge(options?) → void` - Merge cells. Use merge({isForceMerge: true}) to force unmerge existing overlapping merged cells before merging
- `breakApart() → void` - Unmerge cells
- `mergeAcross() → void` - Merge cells horizontally
- `mergeVertically() → void` - Merge cells vertically
- `autoFill(destRange, fillType?) → Promise<void>` - Auto-fill data from source range to destination range. destRange must include source. fillType: 'SERIES' (default) or 'COPY'. Async method, use await


---

# 📚 Core Concepts

## Coordinate System: 0-Based Indexing
JavaScript uses 0-based indices. Convert from spreadsheet notation: `jsIndex = spreadsheetRowOrCol - 1`

- `getRange(0, 0)` = Cell A1 (row index 0 = spreadsheet row 1)
- `getRange(1, 2)` = Cell C2 (row index 1 = row 2, col index 2 = column C)
- `getRange(0, 0, 2, 2)` = Range A1:B2 (row=0, col=0, rowCount=2, colCount=2)
- Row/Column operations: `insertRows(4, 3)` = insert 3 rows starting at spreadsheet row 5 (index 4 + 1 = row 5)

## A1 Notation vs Coordinates:
- Use A1 notation for clarity: `getRange('A1:B10')`
- Use coordinates for dynamic access: `getRange(i, j)` in loops
- A1 notation supports: `'A1'`, `'A1:B10'`, `'A:A'` (column), `'1:1'` (row)

## Three Value Types:
- `getValue()` / `getValues()` - Standard cell values (display values)
- `getRawValue()` / `getRawValues()` - Underlying unformatted data:
    - for dates: number of days since 1900-01-01
    - for numbers: the number itself
    - for text: a string


# 📋 Practical Examples

## Example 1: Reading cell values
Get single and multiple cell values
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Yearly')
  if (!fWorksheet) return { success: false, error: 'Sheet "Yearly" not found' }

  const value = fWorksheet.getRange('A1').getValue()
  const values = fWorksheet.getRange('A1:B3').getValues()

  return { success: true, value, values }
}
```

## Example 2: Finding maximum value
Read data and find maximum value with location
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Yearly')
  if (!fWorksheet) return { success: false, error: 'Sheet "Yearly" not found' }

  const data = fWorksheet.getRange('A1:D10').getValues()
  let max = -Infinity
  let maxRow = 0, maxCol = 0

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = Number(data[r][c])
      if (!isNaN(val) && val > max) {
        max = val
        maxRow = r + 1
        maxCol = c + 1
      }
    }
  }

  return { success: true, max: max, location: `R${maxRow}C${maxCol}` }
}
```

## Example 3: Reading raw vs display values
Understand the difference between getValue and getRawValue
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Data')
  if (!fWorksheet) return { success: false, error: 'Sheet "Data" not found' }

  // Display values are formatted strings
  const displayValues = fWorksheet.getRange('A1:A2').getValues()
  // Raw values are underlying data (numbers, dates as serials)
  const rawValues = fWorksheet.getRange('A1:A2').getRawValues()

  return { success: true, display: displayValues, raw: rawValues }
}
```

## Example 4: Writing cell values
Set single and multiple cell values
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Yearly')
  if (!fWorksheet) return { success: false, error: 'Sheet "Yearly" not found' }

  fWorksheet.getRange('A1:A5').setValue(100)

  fWorksheet.getRange('A1:B2').setValues([
    ['A1', 'B1'],
    ['A2', 'B2']
  ])

  fWorksheet.getRange('C1').setValue('=SUM(A1:B1)')

  return { success: true }
}
```

## Example 5: Setting formula and reading result
Async pattern for formula calculation
```javascript
async () => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Test')
  if (!fWorksheet) return { success: false, error: 'Sheet "Test" not found' }

  // Set a SUM formula
  fWorksheet.getRange('C24').setFormula('=SUM(C1:C23)')

  // IMPORTANT: Wait for calculation to complete before reading
  await univerAPI.getFormula().onCalculationResultApplied()

  // Now we can safely read the calculated value
  const calculatedValue = fWorksheet.getRange('C24').getValue()

  return { success: true, result: calculatedValue }
}
```

## Example 6: Styling cells
Apply font and alignment styles
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Sheet1')
  if (!fWorksheet) return { success: false, error: 'Sheet not found' }

  fWorksheet.getRange('A1:B10')
    .setFontWeight('bold')
    .setFontColor('red')
    .setFontSize(15)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackgroundColor('yellow')
    .setFontStyle('italic')

  return { success: true }
}
```

## Example 7: Setting borders
Apply borders to data table
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Sales')
  if (!fWorksheet) return { success: false, error: 'Sheet not found' }

  // Header with bottom border
  fWorksheet.getRange('A1:D1')
    .setFontWeight('bold')
    .setBackgroundColor('#f0f0f0')
    .setBorder(univerAPI.Enum.BorderType.BOTTOM, univerAPI.Enum.BorderStyleTypes.MEDIUM, '#000000')

  // Data area with thin grid
  fWorksheet.getRange('A2:D10')
    .setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, '#cccccc')

  // Outside border for entire table
  fWorksheet.getRange('A1:D10')
    .setBorder(univerAPI.Enum.BorderType.OUTSIDE, univerAPI.Enum.BorderStyleTypes.THICK, '#000000')

  return { success: true, formattedRange: 'A1:D10' }
}
```

## Example 8: AutoFill formulas
Auto-fill formula down a column
```javascript
async () => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Order')
  if (!fWorksheet) return { success: false, error: 'Sheet "Order" not found' }

  // Set formula in first data row
  fWorksheet.getRange('E2').setFormula('=C2*D2')

  // Auto-fill down to row 100 (SERIES mode auto-adjusts references)
  const sourceRange = fWorksheet.getRange('E2')
  const destRange = fWorksheet.getRange('E2:E100')
  await sourceRange.autoFill(destRange)

  return { success: true, filledRange: 'E2:E100' }
}
```

## Example 9: Creating worksheet
Create new worksheet with initial data
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()

  // Create new sheet with 100 rows and 20 columns
  const newSheet = fWorkbook.create('Summary', 100, 20)

  // Write data to new sheet
  newSheet.getRange('A1').setValue('Summary Report')
  newSheet.getRange('A1').setFontWeight('bold').setFontSize(16)

  return { success: true, sheetName: 'Summary' }
}
```

## Example 10: Row and column operations
Insert rows and set heights
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Revenue')
  if (!fWorksheet) return { success: false, error: 'Sheet "Revenue" not found' }

  // Insert 3 new rows starting at row 5 (0-based index = 4)
  fWorksheet.insertRows(4, 3)

  // Set height for new rows (100 pixels)
  fWorksheet.setRowHeights(4, 3, 100)

  // Add data to new rows
  fWorksheet.getRange('A5:C7').setValues([
    ['New Row 1', 100, 200],
    ['New Row 2', 150, 250],
    ['New Row 3', 200, 300]
  ])

  return { success: true, insertedRows: 3 }
}
```

## Example 11: Setting number formats
Set number formats for range with values
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Sales')
  if (!fWorksheet) return { success: false, error: 'Sheet not found' }

  // Set values and apply number formats
  fWorksheet.getRange('A1:B3').setValues([
    ['Revenue', 'Growth Rate'],
    [1234567.89, 0.1523],
    [9876543.21, -0.0875]
  ]).setNumberFormats([
    ['', ''],  // Headers - no format
    ['#,##0.00', '0.00%'],  // Thousand separator, percentage
    ['#,##0.00', '0.00%']
  ])

  return { success: true, formattedRange: 'A1:B3' }
}
```


# 📋 Best Practices Guide

## Code Structure:
1. **ALWAYS wrap in arrow function**: `() => { ... }` with return statement
2. **Return meaningful results**: Include `{ success: true }` plus verification data
3. **Return data for next steps**: If chaining eval_js, include needed info in return

## API Usage:
4. **ONLY use documented methods**: Every method MUST be in API Reference above
5. **Use A1 notation for clarity**: `'A1:B10'` is clearer than `getRange(0,0,10,2)`
6. **Use coordinates for loops**: `getRange(i, j)` for dynamic access
7. **No external libraries**: Only built-in JavaScript + univerAPI

## Data Handling:
8. **Validate data**: Check for null/undefined before calculations
9. **Use specific ranges**: `'A1:A100'` instead of `'A:A'` for performance
10. **Handle edge cases**: Empty cells, non-numeric values, etc.

## Row/Column Operations:
11. **Delete backwards**: When deleting multiple rows/columns, loop from end to start
12. **Use bulk methods**: `setRowHeights()` and `setColumnWidths()` for multiple rows/columns
13. **Mind the indices**: Remember 0-based indexing (row 1 = index 0, column A = index 0)


---

# ⚠️ Common Mistakes & Corrections

## ❌ WRONG - Not wrapping in arrow function:
```javascript
const fWorkbook = univerAPI.getActiveWorkbook()
// ... code without wrapper
```

## ✅ CORRECT - Proper structure:
```javascript
() => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getSheetByName('Sheet1')
  if (!fWorksheet) return { success: false, error: 'Sheet not found' }

  const value = fWorksheet.getRange('A1').getValue()
  return { success: true, value: value }
}
```

## ❌ WRONG - Using undocumented methods:
```javascript
() => {
  fWorksheet.sort()  // This method does not exist
  const rect = range.getCellRect()  // This method does not exist
}
```

## ❌ WRONG - Reading formula result immediately (may get stale value):
```javascript
() => {
  fWorksheet.getRange('A1').setFormula('=SUM(B1:B10)')
  const value = fWorksheet.getRange('A1').getValue()  // May return old/wrong value!
}
```

## ✅ CORRECT - Wait for calculation before reading formula result:
```javascript
async () => {
  fWorksheet.getRange('A1').setFormula('=SUM(B1:B10)')
  await univerAPI.getFormula().onCalculationResultApplied()  // Wait for calculation
  const value = fWorksheet.getRange('A1').getValue()  // Now correct!
  return { success: true, value }
}
```

## ❌ WRONG - Deleting rows forward (index shifts cause skips):
```javascript
// DON'T: Forward iteration causes rows to shift up
for (let i = 0; i < values.length; i++) {
  if (!values[i][0]) fWorksheet.deleteRows(i, 1)  // Wrong!
}
```

## ✅ CORRECT - Deleting rows backward (no index shifts):
```javascript
// DO: Backward iteration prevents index shift issues
for (let i = values.length - 1; i >= 0; i--) {
  if (!values[i][0]) fWorksheet.deleteRows(i, 1)  // Correct
}
```

## ❌ WRONG - setValues() with single-cell range (only updates A1, ignores rest of data):
```javascript
() => {
  const data = [['A', 'B'], ['C', 'D'], ['E', 'F']]  // 3x2 array
  // getRange(0, 0) returns ONLY cell A1 - single cell range!
  fWorksheet.getRange(0, 0).setValues(data)  // WRONG: Only A1 is updated, B1-F1 are NOT!
}
```

## ✅ CORRECT - setValues() range must match data dimensions:
```javascript
() => {
  const data = [['A', 'B'], ['C', 'D'], ['E', 'F']]  // 3 rows × 2 columns
  // Option 1: Use A1 notation with explicit range
  fWorksheet.getRange('A1:B3').setValues(data)  // ✅ Range matches 3×2 data

  // Option 2: Use coordinates with rowCount and colCount
  fWorksheet.getRange(0, 0, data.length, data[0].length).setValues(data)  // ✅ Dynamic sizing
  // getRange(startRow, startCol, rowCount, colCount) = getRange(0, 0, 3, 2) = A1:B3
}
```

---
