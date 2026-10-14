# Web SDK

The engine behind every Univer editor. It runs in the browser or headless in Node, and all
programmatic control goes through the Facade API.

## Products and packages

| Product | Edition | Packages | Mode |
| --- | --- | --- | --- |
| Sheets | Open source | `@univerjs/*` | Plugin by default; presets supported |
| Docs | Open source | `@univerjs/*` | Plugin by default; presets supported |
| Slides | Pro | `@univerjs-pro/slides`, `@univerjs-pro/slides-ui` | Plugin |
| Boards | Pro | `@univerjs-pro/boards`, `@univerjs-pro/boards-ui` | Plugin |
| Bases | Pro | `@univerjs-pro/bases`, `@univerjs-pro/bases-ui` | Plugin |
| PDFs | Pro | `@univerjs-pro/pdfs`, `@univerjs-pro/pdfs-ui` | Plugin |

- The Slides guide installs the `@univerjs-pro/*` packages above, not the `@univerjs/slides` model
  package. Follow the guide.
- Every Pro product needs `@univerjs-pro/license`. Register `UniverLicensePlugin` first. A key is
  optional while building; see [versions-and-license.md](versions-and-license.md).
- All `@univerjs/*` and `@univerjs-pro/*` packages share one exact version.
- Never copy an install list from memory. Use each product's `installation` page, or
  `https://docs.univer.ai/tools/initialization-generator`.

## Browser or headless Node

Choose the runtime separately from plugin or preset mode. Headless Web SDK runs in a Node.js
process without an editor UI; use it to generate or modify document data and calculate formulas.
It does not provide Server SDK's collaboration backend or AI SDK's agent tools.

| Runtime | UI wiring | Sheets core preset | Number formatting |
| --- | --- | --- | --- |
| Browser | Container, editor UI plugins, their locale and CSS | `@univerjs/preset-sheets-core` | Currently registers numfmt and numfmt UI, and imports numfmt Facade |
| Headless Node | No editor UI, container or UI CSS; retain the model/engine dependencies required by the Node guide | `@univerjs/preset-sheets-node-core` | Currently imports numfmt Facade but does not register the numfmt plugin; add it when needed |

The Node preset is a different plugin set, not the browser preset with UI removed. Check the
installed release's registrations: `dream-num/univer` has both presets under
`presets/packages/preset-sheets-{core,node-core}/src/preset.ts`. An installed package or a Facade
import does not register its feature plugin. The existence of `setNumberFormat()` therefore does
not prove that number-format commands are available.

## Plugin or preset mode

Default to plugin mode for new browser and headless Web SDK integrations. Preserve an existing
preset setup or an explicit request for presets. A preset is a pre-wired plugin bundle; equivalent
capabilities require the corresponding plugins and configuration to be present in either mode.

Presets exist for Sheets and Docs: `core`, `advanced` (Pro), `collaboration`, `node-core`, and feature
presets such as `sheets-filter`, `sheets-sort`, `sheets-table` and `docs-drawing`. Slides, Boards,
Bases and PDFs use plugin mode. Mobile UI also uses plugin mode; core browser presets register
desktop UI only. Follow each product's runtime and feature guides.

For each requested feature, verify its package, plugin registration and Facade entry; UI features
may also need locale and CSS. Add missing plugins through `createUniver`'s `plugins` option or
`univer.registerPlugin`, after checking that the preset does not already register them.

## Browser plugin setup (Sheets)

From [the installation guide](https://docs.univer.ai/guides/sheets/getting-started/installation#setting-up-via-plugin-mode).
Install its packages on one exact release, including the required peer dependencies (React,
React DOM and RxJS). `container` accepts an element id or a DOM element; the host needs a real height.

```html
<div id="app" style="height: 600px"></div>
```

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
import DesignEnUS from '@univerjs/design/locale/en-US'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import SheetsEnUS from '@univerjs/sheets/locale/en-US'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'
import SheetsFormulaUIEnUS from '@univerjs/sheets-formula-ui/locale/en-US'
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'
import SheetsNumfmtUIEnUS from '@univerjs/sheets-numfmt-ui/locale/en-US'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US'
import { UniverUIPlugin } from '@univerjs/ui'
import UIEnUS from '@univerjs/ui/locale/en-US'

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'
import '@univerjs/engine-formula/facade'
import '@univerjs/ui/facade'
import '@univerjs/docs-ui/facade'
import '@univerjs/sheets/facade'
import '@univerjs/sheets-ui/facade'
import '@univerjs/sheets-formula/facade'
import '@univerjs/sheets-numfmt/facade'

const univer = new Univer({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      DesignEnUS, UIEnUS, DocsUIEnUS, SheetsEnUS, SheetsUIEnUS,
      SheetsFormulaUIEnUS, SheetsNumfmtUIEnUS,
    ),
  },
})
univer.registerPlugin(UniverRenderEnginePlugin)
univer.registerPlugin(UniverFormulaEnginePlugin)
univer.registerPlugin(UniverUIPlugin, { container: 'app' })
univer.registerPlugin(UniverDocsPlugin)
univer.registerPlugin(UniverDocsUIPlugin)
univer.registerPlugin(UniverSheetsPlugin)
univer.registerPlugin(UniverSheetsUIPlugin)
univer.registerPlugin(UniverSheetsFormulaPlugin)
univer.registerPlugin(UniverSheetsFormulaUIPlugin)
univer.registerPlugin(UniverSheetsNumfmtPlugin)
univer.registerPlugin(UniverSheetsNumfmtUIPlugin)
const univerAPI = FUniver.newAPI(univer)
univerAPI.createWorkbook({})
```

In React, put this initialization inside `useEffect`. Create a child container inside the ref's
host, give it `height: 100%`, and pass that DOM element to `UniverUIPlugin`. Return this cleanup so
StrictMode and nested roots stay safe (from `/guides/sheets/getting-started/integrations/react.md`):

```tsx
return () => queueMicrotask(() => { univer.dispose(); container.remove() })
```

Other frameworks have the same page under `/guides/sheets/getting-started/integrations/`.
For other products, copy their installation guide's complete plugin wiring, including registration
order, locale, CSS and each required `/facade` entry. The Sheets list is not a universal plugin set.

## Headless in Node

Read [the Sheets Node guide](https://docs.univer.ai/guides/sheets/getting-started/node) or
[the Docs Node guide](https://docs.univer.ai/guides/docs/getting-started/node).
For Sheets, install the packages in its plugin-mode example on one exact release, including
`@univerjs/sheets-numfmt` when number formatting is needed. This example keeps the guide's engines
and model plugins, excludes editor UI, and explicitly imports the Facade entries:

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import SheetsEnUS from '@univerjs/sheets/locale/en-US'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'
import '@univerjs/engine-formula/facade'
import '@univerjs/sheets/facade'
import '@univerjs/sheets-formula/facade'
import '@univerjs/sheets-numfmt/facade'

const univer = new Univer({
  locale: LocaleType.EN_US,
  locales: { [LocaleType.EN_US]: mergeLocales(SheetsEnUS) },
})
univer.registerPlugin(UniverRenderEnginePlugin)
univer.registerPlugin(UniverFormulaEnginePlugin)
univer.registerPlugin(UniverDocsPlugin)
univer.registerPlugin(UniverSheetsPlugin)
univer.registerPlugin(UniverSheetsFormulaPlugin)
univer.registerPlugin(UniverSheetsNumfmtPlugin)
const univerAPI = FUniver.newAPI(univer)
try {
  const workbook = univerAPI.createWorkbook({})
  const range = workbook.getActiveSheet().getRange('A1')
  range.setValue(1234.567).setNumberFormat('#,##0.00')
  console.log(range.getDisplayValue()) // '1,234.57'
  console.log(range.getRawValue()) // 1234.567
} finally {
  univer.dispose()
}
```

Number formatting in Node needs `UniverSheetsNumfmtPlugin`, not `UniverSheetsNumfmtUIPlugin`.
The core numfmt package has no locale or CSS. Other features may still need locales or additional
model dependencies; follow their runtime-specific docs instead of dropping all engines or locales.

## When preserving or explicitly choosing presets

Browser Sheets uses `UniverSheetsCorePreset` from `@univerjs/preset-sheets-core`, with its
`locales/en-US` and `lib/index.css`. Docs uses `UniverDocsCorePreset` and its own locale/CSS.
Install `@univerjs/presets` as well, satisfy peer dependencies, and import each selected preset's
locale and CSS. Browser Sheets setup:

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import SheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-sheets-core/lib/index.css'

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: { [LocaleType.EN_US]: mergeLocales(SheetsCoreEnUS) },
  presets: [UniverSheetsCorePreset({ container: 'app' })],
})
univerAPI.createWorkbook({})
```

For an existing Node preset setup that needs number formatting, add the missing core plugin
before creating a workbook. This example applies to releases whose Node preset does not already
register numfmt; check the installed preset first. Its numfmt Facade import is already included.

```typescript
import { UniverSheetsNodeCorePreset } from '@univerjs/preset-sheets-node-core'
import SheetsNodeCoreEnUS from '@univerjs/preset-sheets-node-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: { [LocaleType.EN_US]: mergeLocales(SheetsNodeCoreEnUS) },
  presets: [UniverSheetsNodeCorePreset()],
  plugins: [UniverSheetsNumfmtPlugin],
})
try {
  const workbook = univerAPI.createWorkbook({})
  workbook.getActiveSheet().getRange('A1').setValue(0.25).setNumberFormat('0%')
} finally {
  univer.dispose()
}
```

## Facade essentials

- Obtain `univerAPI` from `createUniver` (preset) or `FUniver.newAPI(univer)` (plugin).
- Sheets: `univerAPI.createWorkbook(data)` creates and opens a workbook;
  `getActiveWorkbook()` and `getWorkbook(id)` return `FWorkbook | null`. Check for null.
- Read and write cells: `univerAPI.getActiveWorkbook()?.getActiveSheet().getRange('A1')`, then
  `getValue()` / `setValue(v)` and the plural `getValues()` / `setValues(m)`. Read model data once
  the workbook is available. Browser formula calculation initializes at `Rendered`; Node formula
  calculation initializes at `Ready`. After formula edits, wait for calculation results to be
  applied before reading them. Layout/render APIs follow the browser lifecycle; Node data
  operations do not wait for a browser render event. Check the installed release's lifecycle APIs.
- Other products have their own entry points on the Facade (for example, the Slides, Boards, Bases
  and PDFs guides each have a `facade` page). Look them up, do not infer from Sheets.
- A source-new API may not be in the installed release. Open the installed `.d.ts` (for example
  `node_modules/@univerjs/sheets/lib/types/facade/`) before using any method that is new to you,
  and if it is absent, say so rather than substituting a guess. The docs' Facade pages and
  `/reference/llms.txt` are the API reference; this file does not duplicate them.

## Before adding a workaround

For a missing method, command or unexpected feature result, check the target runtime, exact
package versions, preset contents/plugin registrations, Facade imports and the API's lifecycle
requirements. Reproduce with the native API in that runtime. A callable method with an unregistered
command can indicate a missing plugin, not an SDK limitation.

For numfmt, verify `getDisplayValue()` against the original value: formatting `0.25` as `0%` should
display `25%` while preserving `0.25` for calculations. `getValue()` can return a formatted string
after numfmt processing; use `getRawValue()` / `getRawValues()` when the installed declarations
provide them, or inspect the saved workbook's raw cell value and type. Do not replace numeric
cells with formatted strings to bypass a missing plugin; that changes formula and sorting behavior.
If a minimal, correctly wired example still fails or the installed release lacks the capability,
report the evidence before choosing a workaround.

## Where to look

| Need | Location |
| --- | --- |
| Product guides | `https://docs.univer.ai/guides/<sheets\|docs\|slides\|boards\|bases\|pdfs>/getting-started/...` (`installation`, `quickstart`, `facade`, `i18n`, `lifecycle`) |
| Framework wiring | `.../getting-started/integrations/{react,vue,angular,nextjs,astro,web-component}`; no-bundler: `installation/cdn` |
| Markdown twin of any page | Append `.md` to the URL |
| Section index | `https://docs.univer.ai/guides/llms.txt` |
| Tools | `https://docs.univer.ai/tools/` (initialization generator, snapshot inspector, theme customizer) |
| Playground | `https://office.univer.ai/{lang}/playground/<product>/<slug>`, e.g. `en-US/playground/sheets/slim-via-preset` |
| Sheets, Docs, Slides dev examples | `dream-num/univer` `examples/src/{sheets,docs,slides}/` (`mount.ts`) |
| Preset source | `dream-num/univer` `presets/packages/` |
| Pro Sheets full app | `dream-num/univer-pro-sheet-start-kit` |

## Beyond the first build

| Topic | Docs |
| --- | --- |
| Pro products, advanced formula, print, exchange | `/guides/<product>/features/...`, `/guides/sheets/features/advanced-formula` |
| Permissions | `/guides/sheets/features/core/permission` |
| Custom components and plugins | `/guides/sheets/ui/components`, package reference at `/reference/llms.txt` |
| Themes and dark mode | `/guides/fundamentals/ui/themes` |
| Web Workers and i18n | `/guides/sheets/getting-started/{worker,i18n}` |
