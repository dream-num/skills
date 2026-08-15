# Node.js Common Tasks

These recipes assume the `univerAPI` returned by `createUniver` with `UniverSheetsNodeCorePreset`.

## Contents

- [Batch Report Generation](#batch-report-generation)
- [JSON Snapshot Round Trip](#json-snapshot-round-trip)
- [Formula Calculation Barrier](#formula-calculation-barrier)
- [Custom Functions](#custom-functions)
- [Headless Events](#headless-events)
- [Multi-Workbook Processing](#multi-workbook-processing)
- [Process Cleanup](#process-cleanup)

## Batch Report Generation

Use `setValues` so a data batch becomes one Facade command instead of one command per cell.

```ts
interface ISale {
  amount: number;
  date: string;
  region: string;
}

async function generateSalesReport(sales: ISale[]) {
  const workbook = univerAPI.createWorkbook({});

  try {
    const sheet = workbook.getActiveSheet();
    sheet.getRange('A1:C1').setValues([['Date', 'Amount', 'Region']]);

    if (sales.length > 0) {
      sheet.getRange(1, 0, sales.length, 3).setValues(
        sales.map((row) => [row.date, row.amount, row.region])
      );
    }

    const totalRow = sales.length + 1;
    sheet.getRange(totalRow, 0).setValue('Total');
    sheet.getRange(totalRow, 1).setValue(
      sales.length > 0 ? `=SUM(B2:B${sales.length + 1})` : 0
    );

    if (sales.length > 0) {
      await univerAPI.getFormula().onCalculationResultApplied();
    }

    return workbook.save();
  } finally {
    univerAPI.disposeUnit(workbook.getId());
  }
}
```

Facade row and column indexes are zero-based. A1 notation is one-based.

## JSON Snapshot Round Trip

```ts
import type { IWorkbookData } from '@univerjs/core';
import { readFile, writeFile } from 'node:fs/promises';

const input = JSON.parse(
  await readFile('workbook.json', 'utf8')
) as IWorkbookData;

const workbook = univerAPI.createWorkbook(input);
try {
  workbook.getActiveSheet().getRange('A1').setValue('Modified in Node.js');
  await writeFile('output.json', JSON.stringify(workbook.save(), null, 2));
} finally {
  univerAPI.disposeUnit(workbook.getId());
}
```

`workbook.save()` is the supported snapshot boundary. Do not mutate the underlying workbook model directly.

## Formula Calculation Barrier

Cell mutations complete synchronously, but formula results may be applied later. Wait for the latest calculation before reading or persisting computed values.

```ts
const workbook = univerAPI.createWorkbook({});
const sheet = workbook.getActiveSheet();

sheet.getRange('A1:A2').setValues([[10], [20]]);
sheet.getRange('A3').setValue('=SUM(A1:A2)');

await univerAPI.getFormula().onCalculationResultApplied();
console.log(sheet.getRange('A3').getValue()); // 30
```

Do not replace the barrier with a fixed timeout. `calculationEnd` remains available for long-lived observers, but `onCalculationResultApplied()` is the direct one-shot API for batch jobs.

## Custom Functions

The registration APIs return disposables. Keep them for as long as formulas may call the function.

```ts
const formula = univerAPI.getFormula();
const discount = formula.registerFunction(
  'DISCOUNT',
  (price, percent) => Number(price) * (1 - Number(percent) / 100),
  'Calculate a discounted price'
);

try {
  sheet.getRange('B1').setValue('=DISCOUNT(100, 20)');
  await formula.onCalculationResultApplied();
  console.log(sheet.getRange('B1').getValue()); // 80
} finally {
  discount.dispose();
}
```

Async functions use the same shape:

```ts
const delayedDouble = formula.registerAsyncFunction(
  'DELAYED_DOUBLE',
  async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return Number(value) * 2;
  },
  'Double a number asynchronously'
);

// Call delayedDouble.dispose() when the function is no longer needed.
```

These Facade registrations are for inline calculation. In worker mode, the current remote endpoint deliberately rejects serialized function registration. Do not expect a function registered in the main process to cross the fork. Package worker-safe custom functions as `BaseFunction` classes and supply them through the `formula.function` option of `UniverSheetsNodeCoreWorkerPreset` (and the matching main preset), or keep calculation inline.

## Headless Events

The current value-change event is `SheetValueChanged`; the older `SheetCellChanged` and `SheetEdited` names are not current Facade events.

```ts
const valueChanges = univerAPI.addEvent(
  univerAPI.Event.SheetValueChanged,
  ({ effectedRanges, payload }) => {
    console.log(
      'Changed ranges:',
      effectedRanges.map((range) => range.getA1Notation()),
      'Command:',
      payload.id
    );
  }
);

// Later
valueChanges.dispose();
```

Formula observers also return a disposable:

```ts
const calculation = univerAPI.getFormula().calculationEnd((state) => {
  console.log('Formula state:', state);
});

// Later
calculation.dispose();
```

## Multi-Workbook Processing

Dispose each workbook before opening the next one to bound retained models and subscriptions.

```ts
import type { IWorkbookData } from '@univerjs/core';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function processFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    const snapshot = JSON.parse(
      await readFile(filePath, 'utf8')
    ) as IWorkbookData;
    const workbook = univerAPI.createWorkbook(snapshot);

    try {
      const sheet = workbook.getActiveSheet();
      const dataRange = sheet.getDataRange();
      const totalRow = dataRange.getRow() + dataRange.getHeight();

      sheet.getRange(totalRow, 0).setValue('Grand Total');
      sheet.getRange(totalRow, 1).setValue(
        totalRow > 0 ? `=SUM(B1:B${totalRow})` : 0
      );

      if (totalRow > 0) {
        await univerAPI.getFormula().onCalculationResultApplied();
      }

      await writeFile(
        `processed-${path.basename(filePath)}`,
        JSON.stringify(workbook.save())
      );
    } finally {
      univerAPI.disposeUnit(workbook.getId());
    }
  }
}
```

## Process Cleanup

Own the root instance with `try`/`finally`:

```ts
const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  presets: [UniverSheetsNodeCorePreset()],
});

try {
  await runJobs(univerAPI);
} finally {
  univer.dispose();
}
```

`UniverRPCNodeMainPlugin.dispose()` kills its forked child process, so final disposal is required for worker-based scripts to exit cleanly.
