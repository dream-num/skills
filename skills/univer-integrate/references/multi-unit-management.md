# Multi-Unit Management

A single `Univer` instance can own multiple units across the product types whose plugins are registered. This OSS reference demonstrates workbooks and documents; the current Pro Facades add presentations, bases, boards, and PDFs. Create a separate instance only when editors need independent plugin graphs or lifecycle ownership. Browser UI instances in one document still share root theme variables and the dark-mode class, so separate instances do not provide isolated UI palettes.

## Multiple workbooks

```ts
const first = univerAPI.createWorkbook({
  id: 'workbook-1',
  name: 'Workbook 1',
  sheetOrder: ['sheet-1'],
  sheets: {
    'sheet-1': { id: 'sheet-1', name: 'Sheet1', rowCount: 100, columnCount: 20 },
  },
});

const second = univerAPI.createWorkbook(
  {
    id: 'workbook-2',
    name: 'Workbook 2',
    sheetOrder: ['sheet-2'],
    sheets: {
      'sheet-2': { id: 'sheet-2', name: 'Sheet1', rowCount: 100, columnCount: 20 },
    },
  },
  { makeCurrent: false },
);

console.log(first.getId(), second.getId());
```

`createWorkbook` returns `FWorkbook`. `makeCurrent: false` keeps the current unit unchanged during creation.

## Retrieve and activate

```ts
const active = univerAPI.getActiveWorkbook();
const target = univerAPI.getWorkbook('workbook-2');

if (target) {
  target.getActiveSheet().activate();
}
```

Activating a sheet focuses its workbook. Do not mutate the underlying workbook model to change focus.

## Work against an explicit unit

Background work must not assume the active editor remains stable:

```ts
function updateTotal(workbookId: string) {
  const workbook = univerAPI.getWorkbook(workbookId);
  if (!workbook) throw new Error(`Workbook not found: ${workbookId}`);

  const worksheet = workbook.getSheetByName('Summary');
  if (!worksheet) throw new Error('Summary sheet not found');

  worksheet.getRange('B2').setFormula('=SUM(Data!B2:B100)');
}
```

Capture an id, not an active Facade handle, across long asynchronous work. Resolve it again before applying the result.

## Documents

Register a Docs preset/plugin before using the Docs Facade:

```ts
const document = univerAPI.createDocument({
  id: 'document-1',
  title: 'Notes',
  body: {
    dataStream: 'Hello Univer\r\n',
    textRuns: [],
    paragraphs: [{ startIndex: 0 }],
    sectionBreaks: [{ startIndex: 13 }],
  },
});

const sameDocument = univerAPI.getDocument(document.getId());
const activeDocument = univerAPI.getActiveDocument();
```

`createDocument` makes the document current. Unlike `createWorkbook`, it does not currently expose a `makeCurrent` option.

## Dispose

```ts
const disposed = univerAPI.disposeUnit('workbook-2');
console.log(disposed);

// Application teardown:
univer.dispose();
```

After unit disposal, discard every workbook, worksheet, range, or document Facade that belongs to it. Subscriptions owned by application code must also be disposed.

## Boundaries

- Unit ids must be unique within one Univer instance.
- `workbook.save()` and `document.save()` return independent snapshots; there is no cross-unit transaction Facade.
- Apply undoable changes through Facade methods or Commands. Never edit saved snapshots and assign them back to live models.
- The current Pro product Facades use `createPresentation`, `createBase`, `createBoard`, and `createPdf`; do not coerce those snapshots through `createWorkbook` or `createDocument`.
- OSS Slides do not currently provide the same Facade lifecycle as Sheets and Docs. Use the current Pro Slides Facade or inspect the installed package before promising equivalent methods.
