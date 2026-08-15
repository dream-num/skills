# Node.js Plugin Registry

This registry reflects the `1.0.0-beta.0` source baseline. Prefer the maintained Sheets or Docs Node preset when it fits; use a source-verified manual stack for the other product hosts.

## Contents

- [Six-Product Node Matrix](#six-product-node-matrix)
- [OSS Node Presets](#oss-node-presets)
- [RPC Layer](#rpc-layer)
- [Optional Core Plugins Verified in Node Examples](#optional-core-plugins-verified-in-node-examples)
- [Node-Safe Facade Entries](#node-safe-facade-entries)
- [Pro Node Product Stacks](#pro-node-product-stacks)
- [Browser-Dependent Packages](#browser-dependent-packages)
- [Manual Worker Pairing](#manual-worker-pairing)

## Six-Product Node Matrix

| Product | Maintained Node preset | Current Pro Node host | Product Facade | Current example data path |
| --- | --- | --- | --- | --- |
| Sheets | `@univerjs/preset-sheets-node-core` | OSS Sheets host plus selected `@univerjs-pro/sheets-*` features | `@univerjs/sheets/facade` | Local in OSS; collaborative `loadSheetAsync` in Pro |
| Docs | `@univerjs/preset-docs-node-core` | OSS Docs host plus selected `@univerjs-pro/docs-*` features | `@univerjs/docs/facade` | Local through the OSS preset; collaborative `loadDocAsync` in Pro |
| Slides | None | `@univerjs-pro/slides` | `@univerjs-pro/slides/facade` | Collaborative `loadSlideAsync` |
| Bases | None | `@univerjs-pro/bases` | `@univerjs-pro/bases/facade` | Collaborative `loadBaseAsync`; formula runs in the paired Node worker |
| Boards | None | `@univerjs-pro/boards` | `@univerjs-pro/boards/facade` | Local `createBoard` or collaborative `loadBoardAsync` |
| PDFs | None | `@univerjs-pro/pdfs` | `@univerjs-pro/pdfs/facade` | Collaborative `loadPdfAsync` |

The last four rows are source-verified manual plugin stacks, not implicit presets. None of the current Node product examples registers a `*-ui` plugin or imports CSS. Do not infer browser rendering, print, screenshots, thumbnails, or exchange-client support from model/Facade execution.

## OSS Node Presets

| Export | Package | Process | Purpose |
| --- | --- | --- | --- |
| `UniverSheetsNodeCorePreset` | `@univerjs/preset-sheets-node-core` | Main | Headless Sheets runtime; accepts optional `workerSrc` |
| `UniverSheetsNodeCoreWorkerPreset` | `@univerjs/preset-sheets-node-core/worker` | Child | Formula calculation process paired with the main preset |
| `UniverDocsNodeCorePreset` | `@univerjs/preset-docs-node-core` | Main | Headless Docs runtime; accepts formula initialization configuration |
| `createUniver` | `@univerjs/presets` | Both | Registers a preset and returns `{ univer, univerAPI }` |

The Sheets main preset currently registers:

- optional `UniverRPCNodeMainPlugin`
- `UniverFormulaEnginePlugin`
- `UniverThreadCommentPlugin`
- `UniverDocsPlugin`
- `UniverSheetsPlugin`
- `UniverSheetsFormulaPlugin`
- `UniverSheetsDataValidationPlugin`
- `UniverSheetsFilterPlugin`
- `UniverSheetsHyperLinkPlugin`
- `UniverSheetsDrawingPlugin`
- `UniverSheetsSortPlugin`
- `UniverSheetsThreadCommentPlugin`

The worker preset registers exactly the worker-side stack required for formula RPC:

```ts
[UniverSheetsPlugin, { onlyRegisterFormulaRelatedMutations: true }]
UniverFormulaEnginePlugin
UniverRPCNodeWorkerPlugin
UniverRemoteSheetsFormulaPlugin
```

The Docs Node preset currently registers `UniverFormulaEnginePlugin`, `UniverThreadCommentPlugin`, `UniverDocsPlugin`, `UniverDocsHyperLinkPlugin`, and `UniverDocsDrawingPlugin`. It imports `@univerjs/engine-formula/facade`, but it has no `/worker` export and does not accept `workerSrc`. Do not copy the Sheets worker pairing into Docs.

For local Docs, explicitly import `@univerjs/docs/facade`, then call the current `univerAPI.createDocument(snapshot)` method and persist with `document.save()`. Do not use the stale `createUniverDoc(...)` spelling that remains in an old source JSDoc example. Import `@univerjs/docs-drawing/facade` only when its Facade extensions are needed.

### Local Docs preset example

```bash
npm install @univerjs/core@1.0.0-beta.0 @univerjs/docs@1.0.0-beta.0 @univerjs/presets@1.0.0-beta.0 @univerjs/preset-docs-node-core@1.0.0-beta.0 rxjs@^7.8.2
```

```ts
import { LocaleType } from '@univerjs/core';
import { UniverDocsNodeCorePreset } from '@univerjs/preset-docs-node-core';
import UniverDocsNodeCoreEnUS from '@univerjs/preset-docs-node-core/locales/en-US';
import { createUniver } from '@univerjs/presets';

import '@univerjs/docs/facade';

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: UniverDocsNodeCoreEnUS,
  },
  presets: [UniverDocsNodeCorePreset()],
});

try {
  const document = univerAPI.createDocument({ title: 'Node report' });
  console.log(document.save());
} finally {
  univer.dispose();
}
```

## RPC Layer

| Plugin | Package | Configuration |
| --- | --- | --- |
| `UniverRPCNodeMainPlugin` | `@univerjs/rpc-node` | `{ workerSrc: '/absolute/or/resolved/worker.js' }` |
| `UniverRPCNodeWorkerPlugin` | `@univerjs/rpc-node` | None |

`workerSrc` is required. The main plugin passes it to `node:child_process.fork()` and kills the child from `dispose()`.

Do not mix these with browser RPC classes:

- Browser main: `UniverRPCMainThreadPlugin`, option `workerURL`
- Browser worker: `UniverRPCWorkerThreadPlugin`

## Optional Core Plugins Verified in Node Examples

Register only what the job uses. Some plugins have `@DependentOn` dependencies, but explicit registration should follow the nearest maintained example or preset.

| Plugin | Package | Purpose |
| --- | --- | --- |
| `UniverDataValidationPlugin` | `@univerjs/data-validation` | Shared validation model |
| `UniverDocsPlugin` | `@univerjs/docs` | Document model |
| `UniverDocsDrawingPlugin` | `@univerjs/docs-drawing` | Document drawing model |
| `UniverDocsHyperLinkPlugin` | `@univerjs/docs-hyper-link` | Document hyperlinks |
| `UniverDrawingPlugin` | `@univerjs/drawing` | Shared drawing model |
| `UniverFormulaEnginePlugin` | `@univerjs/engine-formula` | Formula engine |
| `UniverRenderEnginePlugin` | `@univerjs/engine-render` | Model dependency used by current Pro Docs, Slides, Bases, Boards, and Sheets examples; does not prove image rendering |
| `UniverNetworkPlugin` | `@univerjs/network` | HTTP/socket infrastructure |
| `UniverSheetsPlugin` | `@univerjs/sheets` | Workbook model and commands |
| `UniverSheetsConditionalFormattingPlugin` | `@univerjs/sheets-conditional-formatting` | Conditional-formatting model |
| `UniverSheetsDataValidationPlugin` | `@univerjs/sheets-data-validation` | Sheets validation integration |
| `UniverSheetsDrawingPlugin` | `@univerjs/sheets-drawing` | Sheet drawing model |
| `UniverSheetsFilterPlugin` | `@univerjs/sheets-filter` | Filters |
| `UniverSheetsFormulaPlugin` | `@univerjs/sheets-formula` | Main-process formula integration |
| `UniverRemoteSheetsFormulaPlugin` | `@univerjs/sheets-formula` | Worker-process formula RPC implementation |
| `UniverSheetsHyperLinkPlugin` | `@univerjs/sheets-hyper-link` | Hyperlinks |
| `UniverSheetsNotePlugin` | `@univerjs/sheets-note` | Notes |
| `UniverSheetsNumfmtPlugin` | `@univerjs/sheets-numfmt` | Number formats |
| `UniverSheetsSortPlugin` | `@univerjs/sheets-sort` | Sorting |
| `UniverSheetsTablePlugin` | `@univerjs/sheets-table` | Tables |
| `UniverSheetsThreadCommentPlugin` | `@univerjs/sheets-thread-comment` | Sheet comments |
| `UniverThreadCommentPlugin` | `@univerjs/thread-comment` | Shared comment model |

## Node-Safe Facade Entries

The maintained Sheets Node preset imports these automatically:

```ts
import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-data-validation/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-hyper-link/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-sort/facade';
import '@univerjs/sheets-thread-comment/facade';
```

Current Node examples also use the following entries when their owning plugins are registered:

```ts
import '@univerjs/docs/facade';
import '@univerjs/docs-drawing/facade';
import '@univerjs/sheets-conditional-formatting/facade';
import '@univerjs/sheets-drawing/facade';
import '@univerjs/sheets-note/facade';
import '@univerjs/sheets-table/facade';

import '@univerjs-pro/collaboration-client/facade';
import '@univerjs-pro/engine-shape/facade';
import '@univerjs-pro/bases/facade';
import '@univerjs-pro/boards/facade';
import '@univerjs-pro/boards-mind/facade';
import '@univerjs-pro/boards-table/facade';
import '@univerjs-pro/docs-callout/facade';
import '@univerjs-pro/docs-code/facade';
import '@univerjs-pro/docs-column/facade';
import '@univerjs-pro/docs-latex/facade';
import '@univerjs-pro/docs-list/facade';
import '@univerjs-pro/docs-quote/facade';
import '@univerjs-pro/docs-shape/facade';
import '@univerjs-pro/docs-table/facade';
import '@univerjs-pro/ink/facade';
import '@univerjs-pro/pdfs/facade';
import '@univerjs-pro/slides/facade';
import '@univerjs-pro/slides-chart/facade';
import '@univerjs-pro/slides-table/facade';
import '@univerjs-pro/sheets-chart/facade';
import '@univerjs-pro/sheets-outline/facade';
import '@univerjs-pro/sheets-pivot/facade';
import '@univerjs-pro/sheets-shape/facade';
import '@univerjs-pro/sheets-sparkline/facade';
```

Keep Facade imports as explicit side effects. Do not assume registering a plugin also loads its Facade mixins.

`UniverDocsNodeCorePreset` imports only the formula Facade side effect. Import `@univerjs/docs/facade` and the installed feature Facades explicitly when code uses those extensions. The manual Pro product stacks likewise import their host `/facade` entries before constructing or using `FUniver`.

## Pro Node Product Stacks

Every current Pro Node product stack registers `UniverLicensePlugin` first. The collaborative paths then add `UniverNetworkPlugin`, `UniverCollaborationPlugin`, `UniverCollaborationClientPlugin` configured with `NodeCollaborationSocketService`, and `UniverCollaborationClientNodePlugin`. Import `@univerjs-pro/collaboration-client/facade` before calling a typed loader.

The product-specific runtime plugins verified by the current examples are:

- **Sheets**: `UniverProFormulaEnginePlugin`, `UniverRenderEnginePlugin`, `UniverThreadCommentPlugin`, `UniverDrawingPlugin`, `UniverDocsPlugin`, `UniverDocsDrawingPlugin`, `UniverSheetsPlugin`, `UniverSheetsFormulaPlugin`, `UniverSheetsNumfmtPlugin`, `UniverSheetsConditionalFormattingPlugin`, `UniverDataValidationPlugin`, `UniverSheetsDataValidationPlugin`, `UniverSheetsFilterPlugin`, `UniverSheetsHyperLinkPlugin`, `UniverSheetsNotePlugin`, `UniverSheetsDrawingPlugin`, `UniverSheetsSortPlugin`, `UniverSheetsTablePlugin`, `UniverSheetsChartPlugin`, `UniverSheetsShapePlugin`, `UniverSheetsPivotTablePlugin`, `UniverSheetSparklinePlugin`, and `UniverSheetsOutlinePlugin`.
- **Docs**: `UniverRenderEnginePlugin`, `UniverThreadCommentPlugin`, `UniverDrawingPlugin`, `UniverDocsPlugin`, `UniverDocsDrawingPlugin`, `UniverDocsHyperLinkPlugin`, `UniverDocsCalloutPlugin`, `UniverDocsCodePlugin`, `UniverDocsListPlugin`, `UniverDocsQuotePlugin`, `UniverDocsShapePlugin`, `UniverDocsTablePlugin`, `UniverDocsColumnPlugin`, and `UniverDocsLatexPlugin`.
- **Slides**: `UniverRenderEnginePlugin`, `UniverDrawingPlugin`, `UniverDocsPlugin`, `UniverDocsDrawingPlugin`, `UniverSlidesPlugin`, `UniverSlidesChartPlugin`, and `UniverSlidesTablePlugin`.
- **Bases main/child**: main registers `UniverRenderEnginePlugin`, `UniverProFormulaEnginePlugin({ notExecuteFormula: true })`, `UniverRPCNodeMainPlugin`, and `UniverBasesPlugin`; child registers `UniverProFormulaEnginePlugin`, `UniverRemoteBasesPlugin`, and `UniverRPCNodeWorkerPlugin`.
- **Boards**: `UniverRenderEnginePlugin`, `UniverDrawingPlugin`, `UniverDocsPlugin`, `UniverDocsLatexPlugin`, `UniverBoardsPlugin`, `UniverInkPlugin`, `UniverBoardsMindPlugin`, and `UniverBoardsTablePlugin`. Collaboration is conditional; the local branch omits the collaboration stack.
- **PDFs**: `UniverPdfsPlugin` and `UniverPdfEditorPlugin`.

These lists describe the maintained examples, not mandatory minimal graphs. Preserve their ordering and DI overrides when adapting the same scenario; remove a feature only after checking the remaining plugins' public dependencies. See `node-pro-integration.md` for the matching Facade entries, example loading behavior, worker configuration, and collaboration overrides.

Selected shared and Sheets-specific roles from those stacks:

| Plugin | Package | Notes |
| --- | --- | --- |
| `UniverLicensePlugin` | `@univerjs-pro/license` | Register in every process that runs Pro code |
| `UniverProFormulaEnginePlugin` | `@univerjs-pro/engine-formula` | Replaces the core formula plugin; do not register both |
| `UniverSheetsPivotTablePlugin` | `@univerjs-pro/sheets-pivot` | Use `true` on main and `false` in worker for split execution |
| `UniverSheetsChartPlugin` | `@univerjs-pro/sheets-chart` | Chart model; transitively requires render engine |
| `UniverSheetsShapePlugin` | `@univerjs-pro/sheets-shape` | Shape model |
| `UniverSheetSparklinePlugin` | `@univerjs-pro/sheets-sparkline` | Sparkline model |
| `UniverSheetsOutlinePlugin` | `@univerjs-pro/sheets-outline` | Row/column outlines |
| `UniverCollaborationPlugin` | `@univerjs-pro/collaboration` | Collaboration model |
| `UniverCollaborationClientPlugin` | `@univerjs-pro/collaboration-client` | Server loading and synchronization |
| `UniverCollaborationClientNodePlugin` | `@univerjs-pro/collaboration-client-node` | Node socket transport |

## Browser-Dependent Packages

Do not put these into a plain headless process:

- `@univerjs/ui` and all `*-ui` plugins or Facade entries
- print plugins such as `@univerjs-pro/sheets-print`
- the current Pro exchange-client plugin stack for headless XLSX import/export

The exchange-client source currently contains `document`, `window`, `location`, browser download elements, and `FileReader`; it is not the Node-safe XLSX path claimed by older versions of this skill.

`UniverRenderEnginePlugin` is conditional rather than generally required. The current Pro Node chart example registers it because `UniverChartPlugin` depends on it. That verifies model/Facade execution, not server-side image rendering; rendering still needs a compatible canvas/render host.

## Manual Worker Pairing

If the preset cannot be used, match both sides:

| Main process | Child process |
| --- | --- |
| `UniverRPCNodeMainPlugin({ workerSrc })` | `UniverRPCNodeWorkerPlugin` |
| Formula engine `{ notExecuteFormula: true }` | Formula engine with calculation enabled |
| `UniverSheetsFormulaPlugin({ notExecuteFormula: true })` | `UniverRemoteSheetsFormulaPlugin` |
| `UniverSheetsPlugin` | `UniverSheetsPlugin({ onlyRegisterFormulaRelatedMutations: true })` |

For Pro pivot, additionally register `UniverSheetsPivotTablePlugin({ notExecuteFormula: true })` on main and `{ notExecuteFormula: false }` in the child.
