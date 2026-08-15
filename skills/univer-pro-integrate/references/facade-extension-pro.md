# Pro Facade Extensions

Pro packages extend existing Facade classes at module evaluation time. Presets import their own Facade entries. In manual Plugin Mode, import every required host entry before creating or using `FUniver`.

## Side-effect map

| Capability | Required Facade entries |
| --- | --- |
| Sheets exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/sheets-exchange-client/facade` |
| Docs exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/docs-exchange-client/facade` |
| Slides exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/slides-exchange-client/facade` |
| Bases exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/bases-exchange-client/facade` |
| Boards exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/boards-exchange-client/facade` |
| PDFs exchange | `@univerjs-pro/exchange-client/facade`, `@univerjs-pro/pdfs-exchange-client/facade` |
| Collaboration | `@univerjs-pro/collaboration-client/facade`; add `@univerjs-pro/collaboration-client-ui/facade` for browser UI additions |
| Pro formula | `@univerjs-pro/engine-formula/facade` |
| Pivot tables | `@univerjs-pro/sheets-pivot/facade` |
| Charts in Sheets | `@univerjs-pro/engine-chart/facade`, `@univerjs-pro/sheets-chart/facade`; add `@univerjs-pro/chart-ui/facade` with Chart UI |
| Sheets outline | `@univerjs-pro/sheets-outline/facade` |
| Shapes in Sheets | `@univerjs-pro/engine-shape/facade`, `@univerjs-pro/sheets-shape/facade` |
| Sparklines | `@univerjs-pro/sheets-sparkline/facade` |
| Sheets print | `@univerjs-pro/sheets-print/facade` |
| Slides host | `@univerjs-pro/slides/facade` (`createPresentation`) |
| Slides print | `@univerjs-pro/slides-print/facade` |
| Bases host/UI | `@univerjs-pro/bases/facade`; add `@univerjs-pro/bases-ui/facade` for UI additions (`createBase` comes from the host) |
| Boards host/UI | `@univerjs-pro/boards/facade`; add `@univerjs-pro/boards-ui/facade` for UI additions (`createBoard` comes from the host) |
| PDFs host | `@univerjs-pro/pdfs/facade` (`createPdf`) |

An entry contributes methods, enum accessors, events, or live Facade classes. Importing only the plugin package is not a substitute.

Other current public Facade entries cover Docs callout/chart/code/column/formula/latex/list/quote/shape/table; Boards chart/mind/table; Slides chart/table; Embed, Ink, Live Share, Range Preprocess, and Shape Editor. `slides-ui`, `pdfs-ui`, `pdfs-editor`, and `pdfs-print` do not expose `/facade`; inspect the installed package's `exports` and types before use rather than assuming every Pro package has one.

## Exchange and collaboration on FUniver

Current host exchange names are:

- Sheets: `importSheetToUnitIdAsync`, `importSheetToSnapshotAsync`, `exportSheetByUnitIdAsync`, `exportSheetBySnapshotAsync`.
- Docs: `importDocToUnitIdAsync`, `importDocToSnapshotAsync`, `exportDocByUnitIdAsync`, `exportDocBySnapshotAsync`.
- Slides: `importSlideToUnitIdAsync`, `importSlideToSnapshotAsync`, `exportSlideByUnitIdAsync`, `exportSlideBySnapshotAsync`.
- Bases: `importBaseToUnitIdAsync`, `importBaseToSnapshotAsync`, `exportBaseByUnitIdAsync`, `exportBaseBySnapshotAsync`.
- Boards: `exportBoardByUnitIdAsync`, `exportBoardBySnapshotAsync`; the host Facade also adds `FBoard.insertMermaidAsync`.
- PDFs: `importPdfToUnitIdAsync`, `importPdfToSnapshotAsync`, `exportPdfByUnitIdAsync`, `exportPdfBySnapshotAsync`.
- Shared: `downloadFile`.

Each host also adds asynchronous snapshot JSON conversion methods. Read `exchange-guide.md` for signatures and required plugin pairing.

Collaboration adds:

```ts
const collaboration = univerAPI.getCollaboration();
const workbook = await collaboration.loadSheetAsync(unitId);

if (workbook) {
  await collaboration.flush(workbook.getId(), { timeout: 30_000 });
}
```

It also provides typed loaders for Docs, Slides, Bases, Boards, and PDFs, collaborator subscriptions, `getCollaborationStatus`, and the `CollaborationStatusChanged` event. Read `collaboration-guide.md` for lifecycle and endpoint setup.

## Pivot tables

Create a workbook-independent pivot calculator from tabular data:

```ts
const pivot = univerAPI.generatePivotTable([
  ['Region', 'Product', 'Sales'],
  ['East', 'Paper', 120],
  ['West', 'Paper', 180],
]);

const result = pivot.getResultByCalculate();
```

Insert a pivot table into a workbook:

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

const worksheet = workbook.getActiveSheet();
if (!worksheet) throw new Error('No active worksheet');

const unitId = workbook.getId();
const subUnitId = worksheet.getSheetId();
const pivotTable = await workbook.addPivotTable(
  {
    unitId,
    subUnitId,
    sheetName: worksheet.getSheetName(),
    range: worksheet.getRange('A1:G9').getRange(),
  },
  univerAPI.Enum.PositionTypeEnum.Existing,
  {
    unitId,
    subUnitId,
    row: 0,
    col: 8,
  },
);
```

Look up live pivots with `workbook.getPivotTableById(...)`, `workbook.getPivotTableByCell(...)`, or `worksheet.getPivotTableByCell(row, col)`. The live pivot Facade owns field operations; do not edit pivot models directly.

Current pivot events include `BeforePivotTableAdd`, `BeforePivotTableMove`, `PivotTableAdded`, `PivotTableMoved`, `PivotTableRendered`, `PivotTableRemoved`, and the `PivotTableField*`/`PivotTableValuePositionChanged` events. Use the installed event types rather than copying an old parameter shape.

## Charts

`newChart` requires a chart type and returns a detached builder. `insertChart` returns a live chart:

```ts
const chartInfo = worksheet
  .newChart(univerAPI.Enum.ChartTypeString.Column)
  .setSource({
    range: 'A1:D8',
    orientation: univerAPI.Enum.ChartSourceOrientation.Columns,
  })
  .setPosition('F2')
  .setSize(640, 360)
  .setTitle('Quarterly sales')
  .build();

const chart = await worksheet.insertChart(chartInfo);

chart
  .setTitle('Updated sales')
  .setSize(720, 400);

await chart.setDataSource({
  range: 'A2:D8',
  orientation: univerAPI.Enum.ChartSourceOrientation.Rows,
});

const areaInfo = chart
  .toBuilder(univerAPI.Enum.ChartTypeString.Area)
  .setSubtitle('Current period')
  .build();

await chart.update(areaInfo);
await chart.remove();
```

Use `worksheet.getChart(id)` and `worksheet.getCharts()` for lookup. Live charts expose `getId`, `getInfo`, `getType`, `toBuilder`, `update`, property setters, data-source updates, and `remove`.

Register a custom engine-wide chart theme through `FUniver`, then reference its stable name in a builder:

```ts
univerAPI.registerTheme('brand', chartTheme);

const themed = worksheet
  .newChart(univerAPI.Enum.ChartTypeString.Line)
  .setSource('A1:D8')
  .setTheme('brand')
  .build();
```

Do not use removed builder calls such as `newChart()` without a type, `setChartType`, `addRange`, `asLineChart`, or worksheet-level `updateChart`/`removeChart`.

The same engine builder/live-chart pattern is composed into Docs, Slides, and Boards by `@univerjs-pro/docs-chart/facade`, `@univerjs-pro/slides-chart/facade`, and `@univerjs-pro/boards-chart/facade`. Import the engine Facade plus the matching host Facade; non-Sheets hosts accept inline tabular chart data instead of a Sheet range source.

## Shapes

`insertShape` is synchronous and returns a live shape or `null`:

```ts
const shape = worksheet.insertShape({
  shapeType: univerAPI.Enum.ShapeTypeEnum.Rect,
});
if (!shape) throw new Error('The shape could not be inserted');

shape
  .setPosition(1, 1, 0, 0)
  .setSize(220, 120)
  .setSolidFill('#dbeafe', 0.9)
  .setStrokeColor('#1d4ed8')
  .setStrokeWidth(2);

shape.getText().setText('Review');

const sameShape = worksheet.getShape(shape.getId());
const allShapes = worksheet.getShapes();
shape.remove();
```

Create connectors with a connector `ShapeTypeEnum`, then use the returned `FConnectorShape` methods such as `setStartArrow`, `setEndArrow`, `bindStart(shapeId, siteIndex)`, and `bindEnd(shapeId, siteIndex)`. Both `@univerjs-pro/engine-shape/facade` and the host Facade entry are required.

Do not use removed worksheet builders or mutations such as `newShape`, `newConnector`, `connectShapes`, `updateShape`, or `removeShape`.

## Sparklines

```ts
const sourceRanges = [worksheet.getRange('A1:A7').getRange()];
const targetRanges = [worksheet.getRange('A10').getRange()];

const sparkline = worksheet.addSparkline(
  sourceRanges,
  targetRanges,
  univerAPI.Enum.SparklineTypeEnum.LINE_CHART,
);

sparkline?.changeDataSource(
  worksheet.getRange('B1:B7').getRange(),
  worksheet.getRange('B10').getRange(),
);
```

Current worksheet methods are `addSparkline`, `getAllSubSparkline`, `composeSparkline`, `unComposeSparkline`, `getSparklineByCell`, and `getSparklineGroupByCell`. Live items provide `changeDataSource` and `removeSparkline`; groups provide `changeDataSource`, `setConfig`, and `removeSparklineGroup`.

`SparklineTypeEnum` currently defines `LINE_CHART`, `BAR_CHART`, `PROFIT_AND_LOSS_CHART`, and `PIE_CHART`. The current `addSparkline` signature accepts `LINE_CHART`; use `FSparklineGroup.setConfig` for a supported post-creation type change. `SheetSparklineChanged` reports configuration changes.

## Print

Sheets print adds `updatePrintConfig`, `updatePrintRenderConfig`, `print`, `openPrintDialog`, `closePrintDialog`, `saveScreenshotToClipboard`, and `FRange.getScreenshot`. Slides print adds `printSlidesAsync` and `openSlidesPrintDialog` on `FUniver`. Read `print-guide.md` for the required current config fields and enums.
