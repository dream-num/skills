# Common Tasks

These recipes assume a browser Preset Mode setup and an initialized `univerAPI`.

## Get the current workbook, sheet, and range

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

const worksheet = workbook.getActiveSheet();
const range = worksheet.getRange('A1:D20');
```

## Persist and restore JSON

`workbook.save()` is the public snapshot API:

```ts
const snapshot = workbook.save();
localStorage.setItem('workbook', JSON.stringify(snapshot));
```

Restore by passing the parsed snapshot to `createWorkbook`:

```ts
const raw = localStorage.getItem('workbook');
if (raw) {
  univerAPI.createWorkbook(JSON.parse(raw));
}
```

Validate untrusted JSON against your own schema before passing it to Univer.

## Values, formulas, and formatting

```ts
worksheet.getRange('A1:D2').setValues([
  ['Product', 'Qty', 'Price', 'Total'],
  ['Apple', 2, 3, null],
]);

worksheet.getRange('D2').setFormula('=B2*C2');
worksheet.getRange('C2:D100').setNumberFormat('$#,##0.00');
worksheet.getRange('A1:D1')
  .setFontWeight('bold')
  .setBackground('#f3f4f6');

worksheet.setColumnWidth(0, 160);
worksheet.setRowHeight(0, 32);
```

Numeric row and column indexes are zero-based.

## Freeze panes and gridlines

```ts
worksheet.setFrozenRows(1);
worksheet.setFrozenColumns(1);
worksheet.setHiddenGridlines(false);

// Remove every freeze split.
worksheet.cancelFreeze();
```

## Sorting and filtering

With the matching presets registered:

```ts
worksheet.getRange('A2:D100').sort([
  { column: 3, ascending: false },
  { column: 0, ascending: true },
]);

const filterRange = worksheet.getRange('A1:D100');
const filter = filterRange.createFilter();
if (!filter) throw new Error('A filter already exists or the range is invalid');
```

Sort columns are relative to the sorted range. Use `filter.setColumnFilterCriteria(...)` only with criteria constructed for the current filter package version; its column argument is an absolute worksheet column index.

## Find and replace

```ts
const finder = await univerAPI.createTextFinderAsync('draft');
if (finder) {
  await finder.matchCaseAsync(false);
  const replacements = await finder.replaceAllWithAsync('final');
  console.log(`Replaced ${replacements} cells`);
}
```

## Hyperlinks and notes

```ts
const linkCell = worksheet.getRange('A1');
await linkCell.setHyperLink('https://univer.ai', 'Univer');
const links = linkCell.getHyperLinks();
linkCell.cancelHyperLink(links[0]);

const noteCell = worksheet.getRange('B2');
noteCell.createOrUpdateNote({
  note: 'Reviewed',
  width: 160,
  height: 100,
  show: true,
});
const note = noteCell.getNote();
noteCell.deleteNote();
```

Register the hyperlink and note presets first. Hyperlink writes are asynchronous.

## Data validation

```ts
const rule = univerAPI.newDataValidation()
  .requireValueInList(['Open', 'Closed'])
  .setAllowInvalid(false)
  .setHelpText('Choose a status')
  .build();

await worksheet.getRange('C2:C100').setDataValidation(rule);
```

## Conditional formatting

```ts
const range = worksheet.getRange('D2:D100');
const rule = worksheet.newConditionalFormattingRule()
  .whenNumberLessThan(0)
  .setRanges([range.getRange()])
  .setBackground('#f4cccc')
  .build();

worksheet.addConditionalFormattingRule(rule);
```

## Events and cleanup

```ts
const subscription = workbook.onSelectionChange((ranges) => {
  console.log(ranges);
});

// Component unmount or feature disposal.
subscription.dispose();
```

At application teardown, call `univer.dispose()` once. Do not keep Facade handles after disposal.

## Runtime theme and locale

The theme call below targets current source. Verify that the installed `FUniver` declarations expose `setTheme()`; otherwise select the complete theme during `createUniver` initialization.

```ts
import { defaultTheme } from '@univerjs/presets';

univerAPI.setTheme(defaultTheme);
univerAPI.toggleDarkMode(true);
univerAPI.setLocale(univerAPI.Enum.LocaleType.ZH_CN);
```

The target locale bundle must already be loaded. Do not read runtime theme values directly from `@univerjs/themes`; use the Facade or `ThemeService` inside a plugin.

Use `univer-customize-theme` for complete palette construction, current-source versus installed-package API checks, CSS variables, and product content-theme boundaries.

## CSV import and export

CSV quoting, embedded newlines, delimiters, encodings, and formula-injection rules are application concerns. Use a proven CSV parser already present in the host project, map its two-dimensional result to `range.setValues`, and escape dangerous leading formula characters before exporting untrusted user data.

Do not use `line.split(',')` as a CSV parser.

## Large data sets

- Write a rectangular matrix with one `setValues` call instead of one call per cell.
- Avoid repeated reads inside loops; read once with `getValues()`.
- Use the worker preset when formula calculation measurably blocks the UI.
- Keep only the features the application uses, but prefer official presets over a hand-maintained plugin graph.
