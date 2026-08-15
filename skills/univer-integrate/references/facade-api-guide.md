# Facade API Guide

This reference follows the public Facade surface in Univer `1.0.0-beta.0`.

## Registration

Preset Mode is preferred. Presets compose their plugins and Facade extensions; the host must still import the preset's aggregate stylesheet and locale bundle explicitly.

In manual Plugin Mode, import `FUniver` and every feature Facade entry used by the application before creating the API:

```ts
import { FUniver } from '@univerjs/core/facade';

import '@univerjs/docs/facade';
import '@univerjs/engine-formula/facade';
import '@univerjs/network/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-conditional-formatting/facade';
import '@univerjs/sheets-data-validation/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-find-replace/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-hyper-link/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-sort/facade';

const univerAPI = FUniver.newAPI(univer);
```

Only import extensions whose matching plugins are registered. A side-effect import adds methods to the Facade types; it does not register the feature plugin itself.

## Product Facade ownership

Do not infer a Facade path from a product name. The current public ownership is:

| Product | Required product Facade import | Creation method after plugin registration |
|---|---|---|
| Sheets | `@univerjs/sheets/facade` | `univerAPI.createWorkbook(...)` |
| Docs | `@univerjs/docs/facade` | `univerAPI.createDocument(...)` |
| Slides | `@univerjs-pro/slides/facade` for the current licensed product; OSS Slides has no `/facade` export | `univerAPI.createPresentation(...)` |
| Bases | `@univerjs-pro/bases/facade` | `univerAPI.createBase(...)` |
| Boards | `@univerjs-pro/boards/facade` | `univerAPI.createBoard(...)` |
| PDFs | `@univerjs-pro/pdfs/facade` | `univerAPI.createPdf(...)` |

The last four rows belong to `univer-pro-integrate`. Some UI or feature packages add further Facade entries; import those only when their plugins are also registered.

## Object hierarchy

```text
FUniver
└── FWorkbook
    ├── FWorksheet
    │   ├── FRange
    │   │   └── FRangePermission
    │   └── FSelection
    └── FWorkbookPermission
```

## FUniver

Common methods:

```ts
const created = univerAPI.createWorkbook(workbookData, { makeCurrent: false });
const active = univerAPI.getActiveWorkbook();
const byId = univerAPI.getWorkbook(created.getId());

await univerAPI.undo();
await univerAPI.redo();

univerAPI.setLocale(univerAPI.Enum.LocaleType.EN_US);
univerAPI.setTheme(theme);
univerAPI.toggleDarkMode(true);

univerAPI.disposeUnit(created.getId());
```

`createWorkbook` returns an `FWorkbook`, not an id. `disposeUnit` disposes one unit; call `univer.dispose()` to tear down the entire application.

`setTheme()` is present in current source but may be absent from a published prerelease carrying the same manifest version. Verify the installed `FUniver` declaration and use `createUniver({ theme })` when runtime theme replacement is unavailable.

## FWorkbook

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

workbook.getId();
workbook.getName();
workbook.setName('Quarterly report');
workbook.save();

const sheets = workbook.getSheets();
const activeSheet = workbook.getActiveSheet();
const byName = workbook.getSheetByName('Sheet1');
const byId = workbook.getSheetBySheetId('sheet-1');

const inserted = workbook.insertSheet('Summary');
workbook.setActiveSheet(inserted);
workbook.moveSheet(inserted, 0);
workbook.deleteSheet(inserted);

workbook.undo();
workbook.redo();
```

Use `getSheets()`, not the removed `getWorksheets()`. `save()` is the public snapshot API.

Workbook-scoped subscriptions return `IDisposable`:

```ts
const commandSubscription = workbook.onCommandExecuted((command) => {
  console.log(command.id);
});

const selectionSubscription = workbook.onSelectionChange((ranges) => {
  console.log(ranges);
});

commandSubscription.dispose();
selectionSubscription.dispose();
```

## FWorksheet

```ts
const worksheet = workbook.getActiveSheet();

worksheet.getSheetId();
worksheet.getSheetName();
worksheet.setName('Data');

const byA1 = worksheet.getRange('A1:C10');
const byIndex = worksheet.getRange(0, 0, 10, 3);
const dataRange = worksheet.getDataRange();

worksheet.setRowHeight(0, 32);
worksheet.setColumnWidth(0, 140);
worksheet.setFrozenRows(1);
worksheet.setFrozenColumns(1);
worksheet.cancelFreeze();
worksheet.setHiddenGridlines(true);
worksheet.setGridLinesColor('#d9d9d9');
worksheet.activate();
```

Rows and columns are zero-based in numeric APIs. Use `getSheetName()`, not `getName()`.

## FRange

Read and write values:

```ts
const range = worksheet.getRange('A1:B2');

range.setValues([
  ['Name', 'Amount'],
  ['Ada', 42],
]);

range.getValue();
range.getRawValue();
range.getDisplayValue();
range.getValues();
range.getDisplayValues();

range.setFormula('=SUM(B2:B10)');
range.setFormulas([['=1+1', '=2+2']]);
range.getFormula();
range.getFormulas();
```

Format and structure:

```ts
range
  .setBackground('#fff2cc')
  .setFontColor('#7f6000')
  .setFontWeight('bold')
  .setHorizontalAlignment('center')
  .setVerticalAlignment('middle')
  .setWrap(true);

range.setBorder(
  univerAPI.Enum.BorderType.ALL,
  univerAPI.Enum.BorderStyleTypes.THIN,
  '#d9d9d9',
);

range.merge();
range.breakApart();
range.clearContent();
range.clearFormat();
```

`setBorder` takes border type, border style, then optional color.

Feature extensions:

```ts
range.setNumberFormat('#,##0.00');
await range.setHyperLink('https://univer.ai', 'Univer');
range.cancelHyperLink();
range.sort({ column: 0, ascending: false });

const filter = range.createFilter();
filter?.remove();

const validation = univerAPI.newDataValidation()
  .requireNumberBetween(1, 100)
  .setHelpText('Enter a value from 1 to 100')
  .build();
await range.setDataValidation(validation);
```

Feature packages must be installed at the same version and their preset/plugin must be registered.

## FSelection

```ts
const selection = worksheet.getSelection();
const primaryRange = selection?.getActiveRange();
const ranges = selection?.getActiveRangeList() ?? [];
const currentCell = selection?.getCurrentCell();

if (primaryRange) {
  selection?.updatePrimaryCell(primaryRange.offset(1, 0));
}
```

`getSelection()` may return `null`. Use `getActiveRangeList()`, not the removed `getActiveRanges()`.

## Find and replace

The find/replace engine initializes asynchronously:

```ts
const finder = await univerAPI.createTextFinderAsync('draft');
if (finder) {
  const matches = finder.findAll();
  const next = finder.findNext();
  const replaced = await finder.replaceAllWithAsync('final');
  console.log(matches.length, next?.getA1Notation(), replaced);
}
```

Use `matchCaseAsync`, `matchEntireCellAsync`, and `matchFormulaTextAsync` to change matching options.

## Conditional formatting

```ts
const rule = worksheet.newConditionalFormattingRule()
  .whenNumberGreaterThan(100)
  .setRanges([worksheet.getRange('B2:B100').getRange()])
  .setBackground('#f4cccc')
  .setFontColor('#990000')
  .build();

worksheet.addConditionalFormattingRule(rule);
```

Use `getConditionalFormattingRules()` to inspect rules and `deleteConditionalFormattingRule(cfId)` to remove one.

## Check the installed API

For an existing application, its exact installed version is authoritative. Inspect the package declarations when uncertain:

```bash
rg "methodName" node_modules/@univerjs/*/lib -g '*.d.ts'
```

Do not reach into internal services simply because an older Facade name no longer exists.
