# Univer Pro Features Guide

Current source baseline: Univer Pro `1.0.0-beta.0`. Keep all OSS, Pro, and preset packages on the application's one exact Univer version.

## Prefer current presets

| Preset | Composition | Main config |
| --- | --- | --- |
| `@univerjs/preset-sheets-advanced` | License, Pro formula, pivot, print, chart, outline, shape, sparkline, Sheets exchange, and Facades | `license`, `universerEndpoint`, `useWorker`, `formula`, `exchangeClientOptions`, `print`, `pivot` |
| `@univerjs/preset-sheets-collaboration` | Collaboration client/UI, browser socket, edit-history loader, and Facades | `universerEndpoint`, `univerContainerId`, offline/single-active/frontend-log flags, `historyWorkerURL` |
| `@univerjs/preset-docs-advanced` | License, Docs print, formula/UI, Docs exchange, and Facades | `license`, `universerEndpoint`; `useWorker` is accepted but not consumed by the current implementation |
| `@univerjs/preset-docs-collaboration` | Collaboration client/UI and browser socket for Docs | `universerEndpoint` |

Append an Advanced preset after the matching OSS core preset, then append its collaboration preset when collaboration is required. In that case, set `collaboration: true` in the top-level `createUniver` options and on feature presets that expose their own collaboration switch. Import every preset's stylesheet and merge every preset locale. Do not register the same underlying plugin again.

## Product, preset, Facade, and CSS boundaries

A product package existing does not imply that the product has a unified preset. A `/facade` entry also does not install the product. Treat these as separate integration layers:

- A preset returns a plugin composition and imports the Facade extensions it owns. Its aggregate CSS and locale bundles still require explicit imports.
- A `registerPlugin` call installs runtime behavior. It does not replace the product's CSS, locale, or Facade import.
- A `/facade` import runs a side effect that extends the current Facade classes. It does not register plugins or load CSS.
- A `/lib/index.css` import supplies styles only. In Plugin Mode, import the stylesheet of every selected CSS-owning package.

The current product boundary is:

| Product | Host packages | Unified Pro preset | Host Facade and creation method | Host UI CSS |
| --- | --- | --- | --- | --- |
| Sheets | OSS `@univerjs/sheets` and `@univerjs/sheets-ui`; Pro features are in the `sheets-*` packages below | `@univerjs/preset-sheets-advanced`; optionally `@univerjs/preset-sheets-collaboration` | OSS `@univerjs/sheets/facade`; `univerAPI.createWorkbook(data)` | Preset Mode: OSS core/feature preset CSS plus `@univerjs/preset-sheets-advanced/lib/index.css`, and collaboration preset CSS when used. Plugin Mode: `@univerjs/design`, `@univerjs/ui`, `@univerjs/docs-ui`, and `@univerjs/sheets-ui` `/lib/index.css` plus every selected Pro feature CSS |
| Docs | OSS `@univerjs/docs` and `@univerjs/docs-ui`; Pro features are in the `docs-*` packages below | `@univerjs/preset-docs-advanced`; optionally `@univerjs/preset-docs-collaboration` | OSS `@univerjs/docs/facade`; `univerAPI.createDocument(data)` | Preset Mode: OSS core/feature preset CSS plus `@univerjs/preset-docs-advanced/lib/index.css`, and collaboration preset CSS when used. Plugin Mode: `@univerjs/design`, `@univerjs/ui`, and `@univerjs/docs-ui` `/lib/index.css` plus every selected Pro feature CSS |
| Slides | `@univerjs-pro/slides`, `@univerjs-pro/slides-ui` | None | `@univerjs-pro/slides/facade`; `univerAPI.createPresentation(data)` | `@univerjs-pro/slides-ui/lib/index.css` |
| Bases | `@univerjs-pro/bases`, `@univerjs-pro/bases-ui` | None | `@univerjs-pro/bases/facade`; `univerAPI.createBase(snapshot)` | `@univerjs-pro/bases-ui/lib/index.css` |
| Boards | `@univerjs-pro/boards`, `@univerjs-pro/boards-ui` | None | `@univerjs-pro/boards/facade`; `univerAPI.createBoard(data)` | `@univerjs-pro/boards-ui/lib/index.css` |
| PDFs | `@univerjs-pro/pdfs`, `@univerjs-pro/pdfs-ui` | None | `@univerjs-pro/pdfs/facade`; `univerAPI.createPdf(data)` | `@univerjs-pro/pdfs-ui/lib/index.css` |

For Plugin Mode, the host CSS in the table is only the product shell. Also import every selected feature UI stylesheet and any shared UI stylesheet it depends on. Current host-specific CSS owners are:

- Sheets: `sheets-chart-ui`, `sheets-outline-ui`, `sheets-pivot-ui`, `sheets-print`, `sheets-shape-ui`, and `sheets-sparkline-ui`.
- Docs: `docs-callout-ui`, `docs-chart-ui`, `docs-code-ui`, `docs-column-ui`, `docs-formula-ui`, `docs-latex-ui`, `docs-list-ui`, `docs-quote-ui`, `docs-shape-ui`, and `docs-table-ui`.
- Slides: `slides-ui`, `slides-chart-ui`, `slides-print`, and `slides-table-ui`.
- Bases: `bases-ui` and `bases-exchange-client`.
- Boards: `boards-ui`, `boards-chart-ui`, `boards-exchange-client`, `boards-mind-ui`, `boards-resources-ui`, and `boards-table-ui`.
- PDFs: `pdfs-ui` and `pdfs-print`.

Shared Pro CSS owners include `chart-ui`, `collaboration-client-ui`, `edit-history-viewer`, `exchange-client`, `ink-ui`, `resources-ui`, and `shape-editor-ui`. Import their `/lib/index.css` files only when those packages are selected. Preserve the OSS design, UI, and host/preset CSS required by the base integration, and merge the locale bundle from every selected UI package.

### Manual host dependency groups

Register the configured license first for every Pro host, including PDFs. The groups below mirror the current `@DependentOn` declarations; they are dependency summaries to combine with the base `univer-integrate` setup, not standalone application recipes. Register dependencies with non-default configuration before any dependent can auto-register them.

- Slides: register `UniverLicensePlugin` and `UniverShapePlugin`, then `UniverSlidesPlugin`. Before `UniverSlidesUIPlugin`, provide `UniverDocsPlugin`, `UniverRenderEnginePlugin`, `UniverDocsUIPlugin`, `UniverShapeEditorPlugin`, and `UniverShapeEditorUIPlugin`. Add chart runtime/UI, print, and table runtime/UI only when used, then shared exchange -> Slides exchange.
- Bases: register `UniverLicensePlugin` and `UniverProFormulaEnginePlugin`, then `UniverBasesPlugin`. Provide `UniverRenderEnginePlugin` before `UniverBasesUIPlugin`, then shared exchange -> Bases exchange.
- Boards: register `UniverLicensePlugin` and `UniverShapePlugin`, then `UniverBoardsPlugin`. Before `UniverBoardsUIPlugin`, provide `UniverDocsPlugin`, `UniverRenderEnginePlugin`, `UniverInkPlugin`, `UniverDocsUIPlugin`, `UniverShapeEditorPlugin`, `UniverInkUIPlugin`, and `UniverShapeEditorUIPlugin`. Add selected chart, mind, and table runtime/UI pairs after the host. For resources, register a configured `UniverResourcesPlugin` before `UniverBoardsResourcesPlugin`, then `UniverResourcesUIPlugin` before `UniverBoardsResourcesUIPlugin`. Finish with shared exchange -> Boards exchange.
- PDFs: register `UniverLicensePlugin`, then `UniverPdfsPlugin`. `UniverPdfEditorPlugin` is optional and additionally depends on `UniverCollaborationPlugin`; configure collaboration before the editor. Register `UniverPdfsUIPlugin` after the host, supply its thumbnail worker URL, then optional print, then shared exchange -> PDFs exchange.

The shared Pro dependency classes above come from `@univerjs-pro/engine-shape`, `@univerjs-pro/engine-formula`, `@univerjs-pro/shape-editor`, `@univerjs-pro/shape-editor-ui`, `@univerjs-pro/ink`, `@univerjs-pro/ink-ui`, `@univerjs-pro/resources`, and `@univerjs-pro/resources-ui`, respectively. Keep them on the same exact version as the hosts.

The common OSS `UniverUIPlugin`, design/theme, locale, and host UI styles still come from the base integration. Only after the complete selected graph is registered should the application construct `FUniver` and call the creation method in the table. Import the matching host `/facade` before constructing or using the API.

### Optional product Facade entries

Use only the entries for installed features:

- Sheets: the Advanced preset imports `engine-chart/facade`, `engine-formula/facade`, `engine-shape/facade`, `chart-ui/facade`, every included `sheets-*` feature Facade, and the shared plus Sheets exchange Facades. The collaboration preset adds collaboration client/UI Facades. Reproduce those imports explicitly only in Plugin Mode.
- Docs: the Advanced preset imports `docs-formula/facade` and the shared plus Docs exchange Facades; the collaboration preset adds the collaboration client Facade. Optional Docs callout, chart, code, column, LaTeX, list, quote, shape, and table runtime packages each expose `/facade`; `docs-print` does not.
- Slides: `slides-chart/facade`, `slides-print/facade`, `slides-table/facade`, and the shared plus Slides exchange Facades. `slides-ui` has no Facade entry.
- Bases: `bases-ui/facade` and the shared plus Bases exchange Facades.
- Boards: `boards-ui/facade`, `boards-chart/facade`, `boards-mind/facade`, `boards-table/facade`, and the shared plus Boards exchange Facades. `boards-resources` and the chart, mind, resources, and table UI packages do not provide their own Facade entries.
- PDFs: the shared plus PDFs exchange Facades. `pdfs-ui`, `pdfs-editor`, and `pdfs-print` have no Facade entries.

`engine-chart/facade`, `engine-shape/facade`, `chart-ui/facade`, collaboration Facades, and other shared Facades may also be required by a selected feature. Verify every subpath in that package's current `package.json#exports` instead of inferring it from the package name.

## 0.25.0 is not a version-string migration

Do not update a `0.25.0` integration by changing dependency versions while keeping its registration entry unchanged. The verified release boundaries differ:

| Concern | Pro `0.25.0` | Pro `1.0.0-beta.0` |
| --- | --- | --- |
| Product packages | The Pro tag contains shared, Sheets, and Docs package families; it has no Pro `slides`, `bases`, `boards`, or `pdfs` package directories | All six product families exist, but only Sheets and Docs have unified Pro presets |
| Registration | The Advanced Sheets example manually registers a long OSS and Pro plugin list and a worker before creating the workbook | Prefer the OSS core preset plus the matching Pro Advanced preset, optional collaboration preset, and matching worker presets; retain Plugin Mode for custom composition and products without presets |
| CSS | Pro packages use per-package `/lib/index.css` imports | Plugin Mode still uses per-package CSS; each current Pro preset additionally publishes one aggregate `/lib/index.css` that must be imported explicitly |
| Facade side effects | The example imports feature Facades manually. `sheets-exchange-client`, `engine-chart`, and `engine-shape` publish no Facade artifact and have no explicit `./facade` export | The Advanced preset imports its owned Facades; Plugin Mode still imports them manually. Those three packages and every new product host now publish the current Facade entries described above |

The current preset entry does not load its CSS, and the current aggregate CSS does not activate its plugins or Facades. Preserve all four current concerns independently: exact versions, preset/plugin registration, Facade side effects, and styles/locales.

## Advanced Sheets composition

The current Advanced preset owns these Pro plugins:

| Capability | Runtime plugin | UI plugin or pair |
| --- | --- | --- |
| License | `UniverLicensePlugin` from `@univerjs-pro/license` | — |
| Formula | `UniverProFormulaEnginePlugin` from `@univerjs-pro/engine-formula` | — |
| Pivot | `UniverSheetsPivotTablePlugin` | `UniverSheetsPivotTableUIPlugin` |
| Print | `UniverSheetsPrintPlugin` | — |
| Chart | `UniverSheetsChartPlugin` | `UniverSheetsChartUIPlugin` |
| Outline | `UniverSheetsOutlinePlugin` | `UniverSheetsOutlineUIPlugin` |
| Shape | `UniverSheetsShapePlugin` | `UniverSheetsShapeUIPlugin` |
| Sparkline | `UniverSheetSparklinePlugin` | `UniverSheetSparklineUIPlugin` |
| Exchange | `UniverExchangeClientPlugin` | `UniverSheetsExchangeClientPlugin` |

It also imports the required engine, host, UI, and exchange Facade entries. Use `facade-extension-pro.md` when reproducing any part manually.

## Manual registration order

Use this order when a preset cannot be used:

1. Construct `Univer`.
2. Register configured dependencies, especially `UniverLicensePlugin`.
3. Register OSS render, formula/RPC, UI, and host plugins required by the unit type.
4. Register Pro engine/domain plugins before their host and UI plugins.
5. Register shared exchange before host exchange clients.
6. Register collaboration core before collaboration client and UI.
7. Import required Facade side effects and styles; load locale resources.
8. Only then create or load units and obtain/use Facade handles.

`@DependentOn` can auto-register a missing dependency with its default config. Do not rely on that for license, endpoint, worker, or other required configuration: a later explicit registration becomes a duplicate.

## Worker preset

For formula/pivot execution in a browser worker, connect the OSS core worker preset to the Advanced worker preset.

The snippets assume `clientLicense` and `universerEndpoint` are supplied by the application's secure build/runtime configuration; make the license available to both bundles without committing it.

Main thread:

```ts
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
});

const presets = [
  UniverSheetsCorePreset({
    container: 'app',
    workerURL: worker,
  }),
  UniverSheetsAdvancedPreset({
    license: clientLicense,
    universerEndpoint,
    useWorker: true,
  }),
];
```

Worker entry:

```ts
import { UniverSheetsAdvancedWorkerPreset } from '@univerjs/preset-sheets-advanced/worker';
import UniverPresetSheetsAdvancedEnUS from '@univerjs/preset-sheets-advanced/locales/en-US';
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';

createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsAdvancedEnUS,
    ),
  },
  presets: [
    UniverSheetsCoreWorkerPreset(),
    UniverSheetsAdvancedWorkerPreset({ license: clientLicense }),
  ],
});
```

Add the worker preset for every OSS feature whose calculations run there. The Advanced worker preset currently registers the license, Pro formula engine, and pivot plugin with formula execution enabled.

In manual Plugin Mode, the alternative is to encode the license using `WORKER_INIT_LICENSE` in the worker URL and let `UniverLicensePlugin` read it inside the browser worker. See `license-guide.md`.

## Current public package families

The following packages are public in the current Pro source. Install only the feature and host packages required by the application; package names do not imply that every package has a `/facade` entry.

### Shared engines and infrastructure

- `@univerjs-pro/license`, `@univerjs-pro/engine-formula`, `@univerjs-pro/engine-chart`, `@univerjs-pro/engine-pivot`, `@univerjs-pro/engine-shape`
- `@univerjs-pro/chart-ui`, `@univerjs-pro/shape-editor`, `@univerjs-pro/shape-editor-ui`, `@univerjs-pro/print`
- `@univerjs-pro/exchange-client`, `@univerjs-pro/range-preprocess`, `@univerjs-pro/resources`, `@univerjs-pro/resources-ui`
- `@univerjs-pro/ink`, `@univerjs-pro/ink-ui`, `@univerjs-pro/telemetry`

### Collaboration, history, comments, and embedding

- `@univerjs-pro/collaboration`, `@univerjs-pro/collaboration-client`, `@univerjs-pro/collaboration-client-node`, `@univerjs-pro/collaboration-client-ui`, `@univerjs-pro/collaboration-embed`
- `@univerjs-pro/edit-history-loader`, `@univerjs-pro/edit-history-viewer`, `@univerjs-pro/live-share`
- `@univerjs-pro/thread-comment-datasource`, `@univerjs-pro/thread-comment-resource`
- `@univerjs-pro/embed`, `@univerjs-pro/embed-ui`, `@univerjs-pro/embed-unit-ui`

### Sheets

- `@univerjs-pro/sheets-chart`, `@univerjs-pro/sheets-chart-ui`
- `@univerjs-pro/sheets-exchange-client`
- `@univerjs-pro/sheets-outline`, `@univerjs-pro/sheets-outline-ui`
- `@univerjs-pro/sheets-pivot`, `@univerjs-pro/sheets-pivot-ui`
- `@univerjs-pro/sheets-print`
- `@univerjs-pro/sheets-shape`, `@univerjs-pro/sheets-shape-ui`
- `@univerjs-pro/sheets-sparkline`, `@univerjs-pro/sheets-sparkline-ui`

### Docs

- `@univerjs-pro/docs-callout`, `@univerjs-pro/docs-callout-ui`
- `@univerjs-pro/docs-chart`, `@univerjs-pro/docs-chart-ui`
- `@univerjs-pro/docs-code`, `@univerjs-pro/docs-code-ui`
- `@univerjs-pro/docs-column`, `@univerjs-pro/docs-column-ui`
- `@univerjs-pro/docs-exchange-client`
- `@univerjs-pro/docs-formula`, `@univerjs-pro/docs-formula-ui`
- `@univerjs-pro/docs-latex`, `@univerjs-pro/docs-latex-ui`
- `@univerjs-pro/docs-list`, `@univerjs-pro/docs-list-ui`
- `@univerjs-pro/docs-print`
- `@univerjs-pro/docs-quote`, `@univerjs-pro/docs-quote-ui`
- `@univerjs-pro/docs-shape`, `@univerjs-pro/docs-shape-ui`
- `@univerjs-pro/docs-table`, `@univerjs-pro/docs-table-ui`

### Slides

- `@univerjs-pro/slides`, `@univerjs-pro/slides-ui`
- `@univerjs-pro/slides-chart`, `@univerjs-pro/slides-chart-ui`
- `@univerjs-pro/slides-exchange-client`, `@univerjs-pro/slides-print`
- `@univerjs-pro/slides-table`, `@univerjs-pro/slides-table-ui`

### Bases

- `@univerjs-pro/bases`, `@univerjs-pro/bases-ui`, `@univerjs-pro/bases-exchange-client`

### Boards

- `@univerjs-pro/boards`, `@univerjs-pro/boards-ui`
- `@univerjs-pro/boards-chart`, `@univerjs-pro/boards-chart-ui`
- `@univerjs-pro/boards-exchange-client`
- `@univerjs-pro/boards-mind`, `@univerjs-pro/boards-mind-ui`
- `@univerjs-pro/boards-resources`, `@univerjs-pro/boards-resources-ui`
- `@univerjs-pro/boards-table`, `@univerjs-pro/boards-table-ui`

### PDFs

- `@univerjs-pro/pdfs`, `@univerjs-pro/pdfs-ui`, `@univerjs-pro/pdfs-editor`, `@univerjs-pro/pdfs-exchange-client`, `@univerjs-pro/pdfs-print`

## Selection checks

- Confirm the host plugin is registered before adding its feature plugin.
- Pair runtime and UI packages only when the application needs the UI; headless or custom UI integrations can omit an optional UI package.
- Inspect each installed `package.json#exports` before adding a `/facade` import. Use only an actual public subpath.
- Keep endpoint configuration on the owning client plugin. Shared exchange routes do not accept Sheets-only options.
- Preserve the repository's established worker and collaboration model rather than adding a second one.
- Create a unit only after all plugins that observe unit lifecycle are registered.
