# OSS Package and Preset Registry

This registry reflects the current `dream-num/univer` source at version `1.0.0-beta.0`. Keep every installed `@univerjs/*` package on the same exact version.

## Current product boundary

Univer 1.0 has six public product unit types. Package existence, Facade availability, and preset availability are separate facts:

| Product | Unit type | Core and UI packages | Product Facade | Current preset path |
|---|---|---|---|---|
| Sheets | `UNIVER_SHEET` | `@univerjs/sheets`, `@univerjs/sheets-ui` | `@univerjs/sheets/facade` | OSS Sheets presets |
| Docs | `UNIVER_DOC` | `@univerjs/docs`, `@univerjs/docs-ui` | `@univerjs/docs/facade` | OSS Docs presets |
| Slides | `UNIVER_SLIDE` | `@univerjs/slides`, `@univerjs/slides-ui` | No OSS Slides Facade; use the current Pro Slides surface when required | No OSS Slides preset |
| Bases | `UNIVER_BASE` | Current Pro packages | `@univerjs-pro/bases/facade` | Plugin Mode |
| Boards | `UNIVER_BOARD` | Current Pro packages | `@univerjs-pro/boards/facade` | Plugin Mode |
| PDFs | `UNIVER_PDF` | Current Pro packages | `@univerjs-pro/pdfs/facade` | Plugin Mode |

In manual browser Plugin Mode, import shared `@univerjs/design/lib/index.css` and `@univerjs/ui/lib/index.css`, then the registered host UI package's `lib/index.css` and each feature UI package's stylesheet. A Facade side-effect import and a CSS import never register their matching plugin.

## Prefer presets

Install `@univerjs/presets` plus one core preset and only the feature presets the product uses.

### Sheets presets

| Package | Export |
|---|---|
| `@univerjs/preset-sheets-core` | `UniverSheetsCorePreset` |
| `@univerjs/preset-sheets-conditional-formatting` | `UniverSheetsConditionalFormattingPreset` |
| `@univerjs/preset-sheets-data-validation` | `UniverSheetsDataValidationPreset` |
| `@univerjs/preset-sheets-drawing` | `UniverSheetsDrawingPreset` |
| `@univerjs/preset-sheets-filter` | `UniverSheetsFilterPreset` |
| `@univerjs/preset-sheets-find-replace` | `UniverSheetsFindReplacePreset` |
| `@univerjs/preset-sheets-hyper-link` | `UniverSheetsHyperLinkPreset` |
| `@univerjs/preset-sheets-note` | `UniverSheetsNotePreset` |
| `@univerjs/preset-sheets-sort` | `UniverSheetsSortPreset` |
| `@univerjs/preset-sheets-table` | `UniverSheetsTablePreset` |
| `@univerjs/preset-sheets-thread-comment` | `UniverSheetsThreadCommentPreset` |
| `@univerjs/preset-sheets-node-core` | `UniverSheetsNodeCorePreset` |

### Docs presets

| Package | Export |
|---|---|
| `@univerjs/preset-docs-core` | `UniverDocsCorePreset` |
| `@univerjs/preset-docs-drawing` | `UniverDocsDrawingPreset` |
| `@univerjs/preset-docs-hyper-link` | `UniverDocsHyperLinkPreset` |
| `@univerjs/preset-docs-thread-comment` | `UniverDocsThreadCommentPreset` |
| `@univerjs/preset-docs-node-core` | `UniverDocsNodeCorePreset` |

Browser presets expose CSS at `@univerjs/<preset>/lib/index.css` and locale bundles at `@univerjs/<preset>/locales/<locale>`. Some worker-capable presets expose a `/worker` entry.

Example:

```ts
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import { UniverSheetsFilterPreset } from '@univerjs/preset-sheets-filter';
import { createUniver } from '@univerjs/presets';

import '@univerjs/preset-sheets-core/lib/index.css';
import '@univerjs/preset-sheets-filter/lib/index.css';

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({ container: 'app' }),
    UniverSheetsFilterPreset(),
  ],
});
```

Do not add the same plugin through both a preset and the `plugins` array. `createUniver` rejects duplicates outside preset replacement semantics.

## 0.25.0 is not a drop-in template for 1.0

Do not update a `0.25.0` example by changing version strings. The published package graphs differ:

| Concern | `0.25.0` | `1.0.0-beta.0` |
|---|---|---|
| Product unit types | Docs, Sheets, and Slides (plus the non-product `UNIVER_PROJECT` enum member) | Adds `UNIVER_BASE`, `UNIVER_BOARD`, and `UNIVER_PDF`; the public product matrix is now six types |
| Preset exports | `@univerjs/presets` exported many `./preset-*` subpaths and depended on the full preset set | `@univerjs/presets` no longer exports `./preset-*` code subpaths (it retains its root and `./lib/*` build assets); import each preset factory from its own `@univerjs/preset-*` package |
| Preset Facade imports | Built presets used legacy `@univerjs/*/lib/facade` paths | Built presets use public `@univerjs/*/facade` paths |
| Docs Facade ownership | `FDocument` lived under `@univerjs/docs-ui/facade` | `@univerjs/docs/facade` owns the document Facade; Docs UI extends it |
| Zen editor | `@univerjs/sheets-zen-editor` existed | The package is absent; do not register or import it |
| Package exports | Broad preset wildcard subpaths were available | Presets expose only declared root, `/locales/*`, `/worker`, and `/lib/*` entries as applicable |

The aggregate stylesheet remains `@univerjs/<preset>/lib/index.css`, but its contents changed substantially. Import the stylesheet from the exact installed preset version; do not substitute a list copied from `0.25.0`. In manual Plugin Mode, import the individual CSS files for the UI plugins actually registered.

UMD has no ESM dependency loader. Load `@univerjs/docs` Facade before `@univerjs/docs-ui` Facade, then load Sheets Facades in dependency order. The plain HTML template in `../assets/templates/plain-html/` is runtime-tested with the current published bundles.

## Manual Plugin Mode

Use manual composition only when a preset cannot express the required graph. The Sheets Core preset currently owns this base stack:

1. `@univerjs/network`
2. `@univerjs/docs`
3. `@univerjs/engine-render`
4. `@univerjs/ui`
5. `@univerjs/docs-ui`
6. optional `@univerjs/rpc`
7. `@univerjs/engine-formula`
8. `@univerjs/sheets`
9. `@univerjs/sheets-ui`
10. `@univerjs/sheets-numfmt` and `@univerjs/sheets-numfmt-ui`
11. `@univerjs/sheets-formula` and `@univerjs/sheets-formula-ui`

Register dependencies before consumers, load every plugin locale and browser stylesheet, and import matching `/facade` entries explicitly. See `facade-api-guide.md`.

## Current runtime package families

### Platform and shared domains

- `@univerjs/core`, `@univerjs/design`, `@univerjs/themes`, `@univerjs/ui`
- `@univerjs/engine-render`, `@univerjs/engine-formula`
- `@univerjs/network`, `@univerjs/protocol`, `@univerjs/rpc`, `@univerjs/rpc-node`
- `@univerjs/data-validation`, `@univerjs/drawing`, `@univerjs/drawing-ui`
- `@univerjs/find-replace`, `@univerjs/thread-comment`, `@univerjs/thread-comment-ui`
- `@univerjs/action-recorder`, `@univerjs/telemetry`, `@univerjs/watermark`
- `@univerjs/ui-adapter-vue3`, `@univerjs/ui-adapter-web-component`

### Docs

- `@univerjs/docs`, `@univerjs/docs-ui`
- `@univerjs/docs-drawing`, `@univerjs/docs-drawing-ui`
- `@univerjs/docs-find-replace`
- `@univerjs/docs-hyper-link`, `@univerjs/docs-hyper-link-ui`
- `@univerjs/docs-quick-insert-ui`, `@univerjs/docs-thread-comment-ui`

### Sheets

- `@univerjs/sheets`, `@univerjs/sheets-ui`
- `@univerjs/sheets-conditional-formatting`, `@univerjs/sheets-conditional-formatting-ui`
- `@univerjs/sheets-crosshair-highlight`
- `@univerjs/sheets-data-validation`, `@univerjs/sheets-data-validation-ui`
- `@univerjs/sheets-drawing`, `@univerjs/sheets-drawing-ui`
- `@univerjs/sheets-filter`, `@univerjs/sheets-filter-ui`
- `@univerjs/sheets-find-replace`
- `@univerjs/sheets-formula`, `@univerjs/sheets-formula-ui`
- `@univerjs/sheets-hyper-link`, `@univerjs/sheets-hyper-link-ui`
- `@univerjs/sheets-note`, `@univerjs/sheets-note-ui`
- `@univerjs/sheets-numfmt`, `@univerjs/sheets-numfmt-ui`
- `@univerjs/sheets-sort`, `@univerjs/sheets-sort-ui`
- `@univerjs/sheets-table`, `@univerjs/sheets-table-ui`
- `@univerjs/sheets-thread-comment`, `@univerjs/sheets-thread-comment-ui`

### Slides

- `@univerjs/slides`, `@univerjs/slides-ui`

Slides do not currently have an OSS preset family equivalent to Sheets and Docs. Compose them only from current installed source or official examples.

## Development-only packages

`@univerjs/debugger`, `@univerjs/mockdata`, and `@univerjs/storybook` are repository development helpers. Do not add them to production integrations.

## Removed or invalid package names

Do not emit `@univerjs/sheets-zen-editor` or `@univerjs/docs-mention-ui`; neither exists in the current workspace. Inspect `package.json#exports` before using a subpath such as `/facade`, `/worker`, or `/locales/*`.

For `@univerjs-pro/*`, use the `univer-pro-integrate` skill. Register the license plugin before every Pro plugin that depends on it, and keep Pro on the same `1.0.0-beta.0` release line.
