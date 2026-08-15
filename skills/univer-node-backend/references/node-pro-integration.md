# Pro Node.js Integration

This guide reflects Univer Pro `1.0.0-beta.0`. A valid license is required, and all `@univerjs/*` and `@univerjs-pro/*` packages must use the same version.

## Contents

- [Install Pro Packages](#install-pro-packages)
- [Six-Product Node Matrix](#six-product-node-matrix)
- [Inline Pro Formula and Pivot](#inline-pro-formula-and-pivot)
- [Pro Formula and Pivot Worker](#pro-formula-and-pivot-worker)
- [Base Formula Worker](#base-formula-worker)
- [Collaboration in Node.js](#collaboration-in-nodejs)
- [Current Headless Boundaries](#current-headless-boundaries)
- [Cleanup and Safety](#cleanup-and-safety)

## Install Pro Packages

Formula and pivot:

```bash
npm install @univerjs-pro/license@1.0.0-beta.0 @univerjs-pro/engine-formula@1.0.0-beta.0 @univerjs-pro/sheets-pivot@1.0.0-beta.0
```

Optional model features used by the current Pro Node example:

```bash
npm install @univerjs-pro/sheets-chart@1.0.0-beta.0 @univerjs-pro/sheets-shape@1.0.0-beta.0 @univerjs-pro/sheets-sparkline@1.0.0-beta.0 @univerjs-pro/sheets-outline@1.0.0-beta.0
```

Collaboration:

```bash
npm install @univerjs-pro/collaboration@1.0.0-beta.0 @univerjs-pro/collaboration-client@1.0.0-beta.0 @univerjs-pro/collaboration-client-node@1.0.0-beta.0
```

Slides, Bases, Boards, and PDFs have no unified Node preset. Install the exact Pro host and feature packages selected from the current stack below; do not add their `*-ui`, print, or exchange-client packages to a plain headless process.

## Six-Product Node Matrix

All current Pro Node examples register `UniverLicensePlugin` before Pro hosts and features. The detailed runtime class lists are in `node-plugin-registry.md`; this table records the host, Facade, worker, and data-loading boundaries that must not be conflated:

| Product | Current host and Facade | Current example path | Worker boundary |
| --- | --- | --- | --- |
| Sheets | OSS `UniverSheetsPlugin` plus Pro Sheets features; `@univerjs/sheets/facade` and selected feature Facades | Always calls `loadSheetAsync` and therefore requires collaboration/server configuration | Optional Node formula/pivot child process |
| Docs | `UniverDocsPlugin` plus current Pro Docs features; `@univerjs/docs/facade` and selected feature Facades | Always calls `loadDocAsync` and therefore requires collaboration/server configuration | No Docs Node worker preset in the checked source |
| Slides | `UniverSlidesPlugin`; `@univerjs-pro/slides/facade` | Always calls `loadSlideAsync` and therefore requires collaboration/server configuration | No unified Node worker preset |
| Bases | `UniverBasesPlugin`; `@univerjs-pro/bases/facade` | Always calls `loadBaseAsync` and therefore requires collaboration/server configuration | Current example requires a child process with `UniverRemoteBasesPlugin` |
| Boards | `UniverBoardsPlugin`; `@univerjs-pro/boards/facade` | Local `createBoard(...)` when no unit ID is supplied; `loadBoardAsync` and collaboration only for the remote branch | No unified Node worker preset |
| PDFs | `UniverPdfsPlugin` plus `UniverPdfEditorPlugin`; `@univerjs-pro/pdfs/facade` | Always calls `loadPdfAsync` and therefore requires collaboration/server configuration | No unified Node worker preset |

The matching current example Facade side effects are:

- Sheets: core formula, Sheets, formula, number-format, conditional-formatting, data-validation, filter, hyperlink, note, table, drawing, and thread-comment Facades; Pro engine-shape, pivot, sparkline, chart, shape, outline, and collaboration Facades.
- Docs: Docs and Docs Drawing Facades; Pro shape, callout, code, list, quote, table, column, LaTeX, and collaboration Facades.
- Slides: Pro engine-shape, Slides, Slides Chart, Slides Table, and collaboration Facades.
- Bases: Pro Bases and collaboration Facades.
- Boards: Pro Boards, Boards Mind, Boards Table, Docs LaTeX, and Ink Facades. The remote branch dynamically imports the collaboration Facade before constructing `FUniver`; the local branch does not.
- PDFs: Pro PDFs and collaboration Facades.

These examples intentionally omit product UI plugins and CSS. `UniverRenderEnginePlugin` appears where model features depend on it, but that does not configure a DOM, canvas host, presentation playback, thumbnails, screenshots, or image export. Reuse environment licenses and server credentials; never copy the example repository's embedded development values.

## Inline Pro Formula and Pivot

`UniverProFormulaEnginePlugin` extends and replaces `UniverFormulaEnginePlugin`. Do not register both, and do not add it on top of `UniverSheetsNodeCorePreset`, which already contains the core formula plugin. Use manual registration when the Pro engine is required.

```ts
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import { UniverSheetsPivotTablePlugin } from '@univerjs-pro/sheets-pivot';
import { LocaleType, Univer } from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';

import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs-pro/engine-formula/facade';
import '@univerjs-pro/sheets-pivot/facade';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const univer = new Univer({ locale: LocaleType.EN_US });
univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverProFormulaEnginePlugin);
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);
univer.registerPlugin(UniverSheetsFilterPlugin);
univer.registerPlugin(UniverSheetsPivotTablePlugin);

const univerAPI = FUniver.newAPI(univer);
```

## Pro Formula and Pivot Worker

Build the worker as JavaScript and pass its resolved path to the main process.

```ts
// main.ts
import { fileURLToPath } from 'node:url';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import { UniverSheetsPivotTablePlugin } from '@univerjs-pro/sheets-pivot';
import { LocaleType, Univer } from '@univerjs/core';
import { UniverRPCNodeMainPlugin } from '@univerjs/rpc-node';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const workerSrc = fileURLToPath(new URL('./formula-worker.js', import.meta.url));
const univer = new Univer({ locale: LocaleType.EN_US });
univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverProFormulaEnginePlugin, { notExecuteFormula: true });
univer.registerPlugin(UniverRPCNodeMainPlugin, { workerSrc });
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin, { notExecuteFormula: true });
univer.registerPlugin(UniverSheetsFilterPlugin);
univer.registerPlugin(UniverSheetsPivotTablePlugin, { notExecuteFormula: true });
```

```ts
// formula-worker.ts
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import { UniverSheetsPivotTablePlugin } from '@univerjs-pro/sheets-pivot';
import { LocaleType, Univer } from '@univerjs/core';
import { UniverRPCNodeWorkerPlugin } from '@univerjs/rpc-node';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverRemoteSheetsFormulaPlugin } from '@univerjs/sheets-formula';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const univer = new Univer({ locale: LocaleType.EN_US });
univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverSheetsPlugin, {
  onlyRegisterFormulaRelatedMutations: true,
});
univer.registerPlugin(UniverProFormulaEnginePlugin);
univer.registerPlugin(UniverRPCNodeWorkerPlugin);
univer.registerPlugin(UniverRemoteSheetsFormulaPlugin);
univer.registerPlugin(UniverSheetsFilterPlugin);
univer.registerPlugin(UniverSheetsPivotTablePlugin, {
  notExecuteFormula: false,
});
```

The child created by `fork()` inherits environment variables by default, so using `process.env.UNIVER_LICENSE` in both files keeps the same license without embedding it in source. `WORKER_INIT_LICENSE` is a browser-worker URL parameter key; it is not a Node license value.

## Base Formula Worker

The current `bases-node` example always splits Base formula execution into a child process. On the main process, register the Pro formula engine with execution disabled, then RPC, then the Base host:

```ts
import { fileURLToPath } from 'node:url';
import { UniverBasesPlugin } from '@univerjs-pro/bases';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import { LocaleType, Univer } from '@univerjs/core';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverRPCNodeMainPlugin } from '@univerjs/rpc-node';

import '@univerjs-pro/bases/facade';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const workerSrc = fileURLToPath(new URL('./base-worker.js', import.meta.url));
const univer = new Univer({ locale: LocaleType.EN_US });
univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverRenderEnginePlugin);
univer.registerPlugin(UniverProFormulaEnginePlugin, { notExecuteFormula: true });
univer.registerPlugin(UniverRPCNodeMainPlugin, { workerSrc });
univer.registerPlugin(UniverBasesPlugin);
```

The child process uses the Base-specific remote bridge rather than the Sheets remote formula plugin:

```ts
import { UniverRemoteBasesPlugin } from '@univerjs-pro/bases';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import { LocaleType, Univer } from '@univerjs/core';
import { UniverRPCNodeWorkerPlugin } from '@univerjs/rpc-node';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const univer = new Univer({ locale: LocaleType.EN_US });
univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverProFormulaEnginePlugin);
univer.registerPlugin(UniverRemoteBasesPlugin);
univer.registerPlugin(UniverRPCNodeWorkerPlugin);
```

Compile `base-worker.ts` to runnable JavaScript and dispose the main `Univer` instance so `UniverRPCNodeMainPlugin` terminates the fork.

## Collaboration in Node.js

Use `NodeCollaborationSocketService` in the collaboration-client config and also register `UniverCollaborationClientNodePlugin` for the Node WebSocket transport.

When constructing the same Univer instance, remove the default services replaced by the selected collaboration stack. The current Sheets, Bases, and PDFs examples override authorization and undo/redo. Docs and Slides also override mention; Boards always overrides authorization and mention and adds the undo/redo override only for its remote branch. This Sheets example therefore uses the narrower pair:

```ts
import { UniverCollaborationPlugin } from '@univerjs-pro/collaboration';
import { UniverCollaborationClientPlugin } from '@univerjs-pro/collaboration-client';
import {
  NodeCollaborationSocketService,
  UniverCollaborationClientNodePlugin,
} from '@univerjs-pro/collaboration-client-node';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import { UniverLicensePlugin } from '@univerjs-pro/license';
import {
  IAuthzIoService,
  IUndoRedoService,
  LocaleType,
  Univer,
} from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';
import { UniverNetworkPlugin } from '@univerjs/network';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';

import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs-pro/collaboration-client/facade';

const license = process.env.UNIVER_LICENSE;
if (!license) {
  throw new Error('UNIVER_LICENSE is required');
}

const univer = new Univer({
  locale: LocaleType.EN_US,
  override: [
    [IAuthzIoService, null],
    [IUndoRedoService, null],
  ],
});

univer.registerPlugin(UniverLicensePlugin, { license });
univer.registerPlugin(UniverProFormulaEnginePlugin);
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);
univer.registerPlugin(UniverNetworkPlugin);
univer.registerPlugin(UniverCollaborationPlugin);
univer.registerPlugin(UniverCollaborationClientPlugin, {
  socketService: NodeCollaborationSocketService,
  enableOfflineEditing: false,
  enableSingleActiveInstanceLock: false,
  snapshotServerUrl: 'https://your-server/universer-api/snapshot',
  collabSubmitChangesetUrl: 'https://your-server/universer-api/comb',
  collabWebSocketUrl: 'wss://your-server/universer-api/comb/connect',
  wsSessionTicketUrl: 'https://your-server/universer-api/user/session-ticket',
});
univer.registerPlugin(UniverCollaborationClientNodePlugin);

const univerAPI = FUniver.newAPI(univer);
```

Pass server authentication through `customHeaders` when required. Do not hard-code tokens in source.

### Load, edit, and flush a collaborative workbook

```ts
const collaboration = univerAPI.getCollaboration();
const workbook = await collaboration.loadSheetAsync('unit-id');
if (!workbook) {
  throw new Error('Workbook was not found');
}

const collaborators = collaboration.subscribeCollaborators(
  workbook.getId(),
  (members) => console.log('Online members:', members)
);

try {
  workbook.getActiveSheet().getRange('A1').setValue('Updated by Node.js');
  await collaboration.flush(workbook.getId());
} finally {
  collaborators.dispose();
  univer.dispose();
}
```

`flush(unitId, { timeout })` is the current explicit synchronization barrier for scripts. A successful Facade mutation only updates local state; do not dispose the process before `flush` resolves.

The same collaboration Facade exposes `loadDocAsync`, `loadSlideAsync`, `loadBaseAsync`, `loadBoardAsync`, and `loadPdfAsync`. Register the corresponding product host and its `/facade` entry before calling a loader. Only the current Boards example has a source-verified local fallback that omits collaboration; the other five Pro example entry points always load a server unit.

## Current Headless Boundaries

| Feature | Current Node status | Notes |
| --- | --- | --- |
| Sheets host | Supported | OSS Node preset for local workbooks; current Pro example also verifies advanced model Facades and collaboration |
| Docs host | Supported | OSS Node preset exists; current Pro example verifies Docs feature Facades through a collaborative Doc |
| Slides host | Model/Facade supported | Manual Pro stack; current example is collaboration-backed and does not establish playback or browser rendering |
| Bases host | Model/Facade supported | Manual Pro stack with required Base formula child process in the current example |
| Boards host | Model/Facade supported | Current example supports local creation and an optional collaboration-backed branch |
| PDFs host | Model/Facade supported | Manual Pro PDF/editor stack; current example is collaboration-backed and does not establish browser thumbnails or print |
| Pro formula | Supported | Inline or child process |
| Pivot table | Supported | Split `notExecuteFormula` config when using a worker |
| Sparkline | Model/Facade supported | Registered by the current Pro Node example |
| Outline | Model/Facade supported | Registered by the current Pro Node example |
| Shape | Model/Facade supported | Rendering still needs a compatible host |
| Chart | Model/Facade supported | Pulls in render engine; image rendering is not established by the Node example |
| Collaboration | Supported | Requires `collaboration-client-node` and server endpoints |
| Print | Browser-dependent | Do not register print plugins headlessly |
| Exchange Client XLSX | Browser-dependent in current source | Uses `document`, `window`, `location`, download elements, and `FileReader` |

For headless persistence, use Univer JSON snapshots. If XLSX conversion is required, call an exchange service from a server-specific adapter or use a separate Node conversion library; do not use the browser download helper.

## Cleanup and Safety

- Keep the license in environment or secret storage and pass the same value to main and child processes.
- Never log the license or collaboration credentials.
- Dispose collaborator subscriptions and the Univer root instance.
- Do not register `*-ui`, print, or browser exchange plugins in a plain Node process.
- Do not assume chart/shape model support means canvas image export is configured.
- Treat each current `examples/src/*-node` entry as scenario evidence, not as a minimal dependency declaration; preserve its host, Facade, overrides, and transport pairing when adapting it.
