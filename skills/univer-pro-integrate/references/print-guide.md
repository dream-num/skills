# Print Guide

Univer Pro provides host-specific print plugins. Sheets and Slides expose Facade methods; Docs and PDFs currently provide plugin/UI workflows.

## Current packages

| Host | Package | Facade entry |
| --- | --- | --- |
| Shared types | `@univerjs-pro/print` | none |
| Sheets | `@univerjs-pro/sheets-print` | `@univerjs-pro/sheets-print/facade` |
| Docs | `@univerjs-pro/docs-print` | none |
| Slides | `@univerjs-pro/slides-print` | `@univerjs-pro/slides-print/facade` |
| PDFs | `@univerjs-pro/pdfs-print` | none |

`UniverSheetsAdvancedPreset` already owns the Sheets print plugin and Facade extension. Import the preset stylesheet and merge its locale separately. In Plugin Mode, register the license first:

```ts
import { UniverSheetsPrintPlugin } from '@univerjs-pro/sheets-print';

import '@univerjs-pro/sheets-print/facade';

univer.registerPlugin(UniverSheetsPrintPlugin, {
  enforceWatermark: false,
});
```

## Sheets layout and rendering

The layout and render configs are separate. Use the exact current field names:

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

const worksheet = workbook.getActiveSheet();
if (!worksheet) throw new Error('No active worksheet');

workbook.updatePrintConfig({
  area: univerAPI.Enum.PrintArea.CurrentSheet,
  subUnitIds: [worksheet.getSheetId()],
  paperSize: univerAPI.Enum.PrintPaperSize.A4,
  direction: univerAPI.Enum.PrintDirection.Portrait,
  scale: univerAPI.Enum.PrintScale.FitPage,
  customScale: 1,
  freeze: [
    univerAPI.Enum.PrintFreeze.Row,
    univerAPI.Enum.PrintFreeze.Column,
  ],
  margin: univerAPI.Enum.PrintPaperMargin.Normal,
  maxRowsEachPage: Infinity,
  maxColumnsEachPage: Infinity,
  marginCustom: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

workbook.updatePrintRenderConfig({
  gridlines: true,
  hAlign: univerAPI.Enum.PrintAlign.Middle,
  vAlign: univerAPI.Enum.PrintAlign.Start,
  headerFooter: [
    univerAPI.Enum.PrintHeaderFooter.WorksheetTitle,
  ],
  headerFooterSetting: {
    topLeft: '',
    topCenter: '',
    topRight: '',
    bottomLeft: '',
    bottomCenter: '',
    bottomRight: '',
  },
});
```

Current layout fields are `area`, `subUnitIds`, `paperSize`, `direction`, `scale`, `customScale`, `freeze`, `margin`, optional `pageSizeCustom`, `maxRowsEachPage`, `maxColumnsEachPage`, and `marginCustom`.

Current render fields are `gridlines`, `hAlign`, `vAlign`, `headerFooter`, `headerFooterSetting`, optional `isCustomHeaderFooter`, and optional `watermark`.

Do not use removed names such as `orientation`, `scaleValue`, `centerHorizontal`, `centerVertical`, `printTitles`, `pageOrder`, `printGridlines`, or `printHeading`.

## Sheets actions

```ts
workbook.openPrintDialog();
workbook.closePrintDialog();
workbook.print();

const copied = await workbook.saveScreenshotToClipboard();
```

`saveScreenshotToClipboard` uses the browser Clipboard API and returns `false` when permission, license, security context, or browser support prevents the write.

Capture one range without writing to the clipboard:

```ts
const screenshot = worksheet
  .getRange('A1:D10')
  .getScreenshot({ includeHeaders: true });

if (screenshot === false) {
  throw new Error('The range screenshot is unavailable');
}
```

The successful value is a base64 image string.

## Current Sheets enums

- `PrintArea`: `CurrentSheet`, `workbook`, `CurrentSelection`, `AllSelection`.
- `PrintDirection`: `Portrait`, `Landscape`.
- `PrintScale`: `Origin`, `FitWidth`, `FitHeight`, `FitPage`, `Custom`.
- `PrintAlign`: `Start`, `End`, `Middle`.
- `PrintPaperMargin`: `Normal`, `Narrow`, `Wide`, `None`, `Custom`.
- `PrintFreeze`: `Row`, `Column`.
- `PrintHeaderFooter`: `PageSize`, `WorkbookTitle`, `WorksheetTitle`, `Date`, `Time`.
- `PrintPaperSize` exposes the core `PaperType` values, including `A4`.

`PrintArea.workbook` intentionally uses a lowercase property name in the current API. Custom header/footer page-number placeholders live under `PrintHeaderFooterSymbol`; there is no `PrintHeaderFooter.PageNumber`.

## Sheets events

The Facade entry adds these events:

- `BeforeSheetPrintOpen`
- `BeforeSheetPrintConfirm`
- `BeforeSheetPrintCanceled`
- `SheetPrintOpen`
- `SheetPrintConfirmed`
- `SheetPrintCanceled`

Use `univerAPI.addEvent(...)` and dispose the returned subscription with its owning UI.

## Slides

Register `UniverSlidesPrintPlugin` after the license and Slides dependencies, then import its Facade entry:

```ts
import { PaperType } from '@univerjs/core';
import { PrintDirection, PrintPaperMargin } from '@univerjs-pro/print';
import {
  SlidePrintHandoutOrder,
  SlidePrintLayoutType,
  UniverSlidesPrintPlugin,
} from '@univerjs-pro/slides-print';

import '@univerjs-pro/slides-print/facade';

univer.registerPlugin(UniverSlidesPrintPlugin);

const opened = univerAPI.openSlidesPrintDialog({
  range: [{ from: 1, to: 3 }],
  layout: SlidePrintLayoutType.Handout,
  slidesPerPage: 6,
  handoutOrder: SlidePrintHandoutOrder.Horizontal,
  paperSize: PaperType.A4,
  direction: PrintDirection.Landscape,
  margin: PrintPaperMargin.Normal,
  frameSlides: true,
  showSlideNumber: true,
});
```

`range` is 1-based and inclusive. `slidesPerPage` accepts `1`, `2`, `3`, `4`, `6`, or `9`. Use `await univerAPI.printSlidesAsync(options)` to start printing directly; it resolves to whether the operation started.
