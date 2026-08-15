# Exchange Guide

Univer Pro performs file import/export and conversion through Universer exchange endpoints. The shared client owns transport and downloads; each host package owns its typed Facade methods.

The current Exchange Client is browser-oriented: its upload/download operations use DOM and `FileReader` APIs. Do not present it as a headless Node import/export path; use the browser integration or a documented server-side conversion workflow.

## Packages and Facade entries

| Host | Plugin package | Required side-effect import | Formats |
| --- | --- | --- | --- |
| Shared | `@univerjs-pro/exchange-client` | `@univerjs-pro/exchange-client/facade` | download helper and transport |
| Sheets | `@univerjs-pro/sheets-exchange-client` | `@univerjs-pro/sheets-exchange-client/facade` | XLSX/XLS/CSV/TSV import; XLSX/CSV/TSV export |
| Docs | `@univerjs-pro/docs-exchange-client` | `@univerjs-pro/docs-exchange-client/facade` | DOCX |
| Slides | `@univerjs-pro/slides-exchange-client` | `@univerjs-pro/slides-exchange-client/facade` | PPTX |
| Bases | `@univerjs-pro/bases-exchange-client` | `@univerjs-pro/bases-exchange-client/facade` | XLSX/XLS/CSV/TSV import; XLSX/CSV/TSV export |
| Boards | `@univerjs-pro/boards-exchange-client` | `@univerjs-pro/boards-exchange-client/facade` | PPTX export and Mermaid import |
| PDFs | `@univerjs-pro/pdfs-exchange-client` | `@univerjs-pro/pdfs-exchange-client/facade` | PDF |

Keep every package on the application's exact Univer version. Current source baseline:

```bash
npm install @univerjs-pro/exchange-client@1.0.0-beta.0 @univerjs-pro/sheets-exchange-client@1.0.0-beta.0
```

## Plugin Mode setup

Register `UniverLicensePlugin` first, then the shared exchange client, then each host client:

```ts
import { UniverExchangeClientPlugin } from '@univerjs-pro/exchange-client';
import { UniverSheetsExchangeClientPlugin } from '@univerjs-pro/sheets-exchange-client';

import '@univerjs-pro/exchange-client/facade';
import '@univerjs-pro/sheets-exchange-client/facade';

const universerEndpoint = 'https://your-universer.example.com';

univer.registerPlugin(UniverExchangeClientPlugin, {
  uploadFileServerUrl: `${universerEndpoint}/universer-api/stream/file/upload`,
  getTaskServerUrl: `${universerEndpoint}/universer-api/exchange/task/{taskID}`,
  signUrlServerUrl: `${universerEndpoint}/universer-api/file/{fileID}/sign-url`,
  importServerUrl: `${universerEndpoint}/universer-api/exchange/{type}/import`,
  exportServerUrl: `${universerEndpoint}/universer-api/exchange/{type}/export`,
  downloadEndpointUrl: `${universerEndpoint}/`,
});
univer.registerPlugin(UniverSheetsExchangeClientPlugin, {
  minSheetRowCount: 1,
  minSheetColumnCount: 1,
  disableCellImageConversion: true,
});
```

`UniverExchangeClientPlugin` accepts the six endpoint fields above plus `maxTimeoutTime`. Sheets-only fields belong directly to `UniverSheetsExchangeClientPlugin`; there is no shared `options` wrapper.

`UniverSheetsAdvancedPreset({ universerEndpoint, exchangeClientOptions })` configures the same Sheets stack in Preset Mode.

## Sheets

```ts
import { ExchangeFormat } from '@univerjs-pro/exchange-client';

const unitId = await univerAPI.importSheetToUnitIdAsync(file);
if (!unitId) throw new Error('The workbook could not be imported');

const workbookData = await univerAPI.importSheetToSnapshotAsync(file);
if (workbookData) {
  univerAPI.createWorkbook(workbookData);
}

const exported = await univerAPI.exportSheetByUnitIdAsync(
  unitId,
  ExchangeFormat.XLSX,
);
if (exported) {
  univerAPI.downloadFile(exported, 'workbook', ExchangeFormat.XLSX);
}
```

Export an in-memory workbook snapshot:

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

const exported = await univerAPI.exportSheetBySnapshotAsync(
  workbook.save(),
  ExchangeFormat.XLSX,
);
```

For CSV or TSV, pass the target `sheetId` as the third export argument.

## Docs

Install and register `UniverDocsExchangeClientPlugin`, then import both Facade entries:

```ts
import '@univerjs-pro/exchange-client/facade';
import '@univerjs-pro/docs-exchange-client/facade';

const unitId = await univerAPI.importDocToUnitIdAsync(file);
const documentData = await univerAPI.importDocToSnapshotAsync(file);
const byUnit = unitId
  ? await univerAPI.exportDocByUnitIdAsync(unitId)
  : undefined;
const bySnapshot = documentData
  ? await univerAPI.exportDocBySnapshotAsync(documentData)
  : undefined;
```

## Slides

Install and register `UniverSlidesExchangeClientPlugin`, then import both Facade entries:

```ts
import '@univerjs-pro/exchange-client/facade';
import '@univerjs-pro/slides-exchange-client/facade';

const unitId = await univerAPI.importSlideToUnitIdAsync(file);
const slideData = await univerAPI.importSlideToSnapshotAsync(file);
const byUnit = unitId
  ? await univerAPI.exportSlideByUnitIdAsync(unitId)
  : undefined;
const bySnapshot = slideData
  ? await univerAPI.exportSlideBySnapshotAsync(slideData)
  : undefined;
```

## Snapshot conversion

Conversion is asynchronous and lives on `FUniver`:

| Host | Snapshot JSON to unit data | Unit data to snapshot JSON |
| --- | --- | --- |
| Sheets | `transformSnapshotJsonToWorkbookDataAsync` | `transformWorkbookDataToSnapshotJsonAsync` |
| Docs | `transformSnapshotJsonToDocumentDataAsync` | `transformDocumentDataToSnapshotJsonAsync` |
| Slides | `transformSnapshotJsonToSlideDataAsync` | `transformSlideDataToSnapshotJsonAsync` |
| Bases | `transformSnapshotJsonToBaseDataAsync` | `transformBaseDataToSnapshotJsonAsync` |
| Boards | `transformSnapshotJsonToBoardDataAsync` | `transformBoardDataToSnapshotJsonAsync` |
| PDFs | `transformSnapshotJsonToPdfDataAsync` | `transformPdfDataToSnapshotJsonAsync` |

## Bases, Boards, and PDFs

The newer host clients follow the same shared-client plus host-client pattern:

- Bases add `importBaseToUnitIdAsync`, `importBaseToSnapshotAsync`, `exportBaseByUnitIdAsync`, and `exportBaseBySnapshotAsync`. CSV/TSV exports accept an optional Base `tableId` as the third argument.
- Boards add `exportBoardByUnitIdAsync` and `exportBoardBySnapshotAsync`. The same Facade entry adds `board.insertMermaidAsync(code, options)` for server-converted Mermaid diagrams; it does not add a general Board file-import method.
- PDFs add `importPdfToUnitIdAsync`, `importPdfToSnapshotAsync`, `exportPdfByUnitIdAsync`, and `exportPdfBySnapshotAsync`.

Import both `@univerjs-pro/exchange-client/facade` and the matching host Facade entry, and register the shared client before the host exchange plugin.

All import and export methods can return `undefined`; guard the result before creating a unit or downloading a file. `downloadFile(file, name, extension)` is an `FUniver` method supplied by the shared Facade entry, not a standalone public helper.

`ExchangeFormat` currently defines `XLSX`, `CSV`, `TSV`, `DOCX`, `PPTX`, and `PDF`. Do not infer the unit type from a file using an unexported helper; choose the host flow from the accepted input or product UI.
