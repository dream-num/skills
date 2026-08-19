<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-exchange

English | 简体中文

Import Office files as Univer UnitData or export UnitData as Office files in Node.js.

The package uses `@univerjs-pro/uexcli` directly and hides exchange wire formats, Snapshot details, and SheetBlock conversion.

## Installation

```bash
pnpm add @univer-cli/unit-exchange
```

Requires Node.js 22.12 or higher. `@univerjs-pro/uexcli` will install the native binary corresponding to the current platform.

## Import

```ts
import { createUnitExchange } from "@univer-cli/unit-exchange";
import { UniverInstanceType } from "@univerjs/core";

const exchange = createUnitExchange();
const imported = await exchange.importFile({
  sourcePath: "/tmp/report.xlsx",
  unitType: UniverInstanceType.UNIVER_SHEET,
});

console.log(imported.data);
```

## Export

```ts
import { UnitExchangeFormat, createUnitExchange } from "@univer-cli/unit-exchange";
import { UniverInstanceType } from "@univerjs/core";

const exchange = createUnitExchange();
const result = await exchange.exportFile({
  unit: { type: UniverInstanceType.UNIVER_SHEET, data: workbookData },
  format: UnitExchangeFormat.XLSX,
  outputPath: "/tmp/report-output",
});

console.log(result.outputPath);
```

`outputPath` does not need an extension; `UnitExchangeFormat` alone determines the actual format.

## Format

| Unit  | Import                    | Export         |
| ----- | ------------------------- | -------------- |
| Sheet | XLS, XLSX, XLSM, CSV, TSV | XLSX, CSV, TSV |
| Base  | XLS, XLSX                 | XLSX, CSV, TSV |
| Doc   | DOC, DOCX                 | DOCX           |
| Slide | PPT, PPTX                 | PPTX           |

For CSV/TSV, use `sheetName` to select a worksheet and `tableName` to select a Base table. On both import and export, `formulaCalculationMode` controls the converter's formula calculation strategy.

The package does not download URLs, handle Workspace authentication, create remote Units, or provide Commander commands. `UnitExchangeError` distinguishes failures in the input, format, native converter, and output stages.
