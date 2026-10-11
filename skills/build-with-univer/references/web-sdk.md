# Web SDK

The engine behind every Univer editor. It runs in the browser or headless in Node, and all
programmatic control goes through the Facade API.

## Products and packages

| Product | Edition | Packages | Mode |
| --- | --- | --- | --- |
| Sheets | Open source | `@univerjs/*` | Preset or plugin |
| Docs | Open source | `@univerjs/*` | Preset or plugin |
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

## Preset or plugin mode

A preset is a pre-wired bundle of plugins. Capabilities are identical; the difference is control.

| Situation | Mode |
| --- | --- |
| Sheets or Docs, standard desktop UI | Preset |
| Sheets or Docs needing a custom plugin set, lazy loading or custom registration order | Plugin |
| Slides, Boards, Bases, PDFs | Plugin (no presets exist) |
| Mobile UI | Plugin (the core presets register desktop UI only) |
| Headless Node | `preset-*-node-core` or plugin mode; see below |

Presets exist only for Sheets and Docs, as `@univerjs/preset-{sheets,docs}-*`: `core`, `advanced`
(Pro features), `collaboration`, `node-core`, plus feature presets such as `sheets-filter`,
`sheets-sort`, `sheets-table`, `docs-drawing`. Core and node-core are the only ones you need for a
first render; list `dream-num/univer` `presets/packages/` for the open-source set.

Do not mix: a plugin already inside a preset must not be registered again. Add extra plugins
through the `plugins` option of `createUniver` or `univer.registerPlugin`.

## Preset skeleton (Sheets)

From the current installation guide. Install `@univerjs/presets`, `@univerjs/preset-sheets-core` and
`rxjs` (a peer dependency that npm may not add for you). `container` takes an element id or a DOM
element, and the host needs a real height.

```html
<div id="app" style="height: 600px"></div>
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
  },
  presets: [UniverSheetsCorePreset({ container: 'app' })],
})

univerAPI.createWorkbook({})
```

In React, pass a DOM element and dispose in a microtask so StrictMode and nested roots stay safe
(from `/guides/sheets/getting-started/integrations/react.md`):

```tsx
useEffect(() => {
  const host = containerRef.current
  if (!host) return
  const container = document.createElement('div')
  container.style.height = '100%'
  host.append(container)
  const { univer, univerAPI } = createUniver({ /* locale, locales as above */
    presets: [UniverSheetsCorePreset({ container })],
  })
  univerAPI.createWorkbook({})
  return () => queueMicrotask(() => { univer.dispose(); container.remove() })
}, [])
```

Other frameworks have the same page under `/guides/sheets/getting-started/integrations/`.

Docs is the same shape: `UniverDocsCorePreset` from `@univerjs/preset-docs-core`, with its own
`locales/en-US` and `lib/index.css`. Create the unit with the Docs Facade; read the Docs guide
for the call. Every preset ships its own locale and CSS; import both.

## Plugin skeleton (any product)

```typescript
import { LocaleType, mergeLocales, Univer, UniverInstanceType } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
import DesignEnUS from '@univerjs/design/locale/en-US'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverUIPlugin } from '@univerjs/ui'
import UIEnUS from '@univerjs/ui/locale/en-US'
import '@univerjs/design/lib/index.css' // design CSS first, then ui, then product CSS
import '@univerjs/ui/lib/index.css'
import '@univerjs-pro/slides/facade' // per-package side effect: adds methods to FUniver

const univer = new Univer({
  locale: LocaleType.EN_US,
  locales: { [LocaleType.EN_US]: mergeLocales(DesignEnUS, UIEnUS /* , product locales */) },
})
univer.registerPlugin(UniverRenderEnginePlugin)
univer.registerPlugin(UniverUIPlugin, { container: 'app' })
// ...product plugins, in the order the product guide gives
univer.createUnit(UniverInstanceType.UNIVER_SLIDE, {})
const univerAPI = FUniver.newAPI(univer)
```

This is a shape, not a working setup: plugin lists, registration order, locales, CSS and the
`UniverInstanceType` differ per product (`UNIVER_SHEET`, `UNIVER_DOC`, `UNIVER_SLIDE`,
`UNIVER_BOARD`, `UNIVER_BASE`). Copy the full block from the product's `installation` page.
Plugin mode does not import Facade for you: `@univerjs/core/facade` plus a `/facade` import per
package you call into.

## Headless in Node

Sheets and Docs run without a DOM. Read `/guides/sheets/getting-started/node.md` and
`/guides/docs/getting-started/node.md`.

## Facade essentials

- Obtain `univerAPI` from `createUniver` (preset) or `FUniver.newAPI(univer)` (plugin).
- Sheets: `univerAPI.createWorkbook(data)` creates and opens a workbook;
  `getActiveWorkbook()` and `getWorkbook(id)` return `FWorkbook | null`. Check for null.
- Read and write cells: `univerAPI.getActiveWorkbook()?.getActiveSheet().getRange('A1')`, then
  `getValue()` / `setValue(v)` and the plural `getValues()` / `setValues(m)`. Wait for the workbook
  to render before reading; the docs name the lifecycle event on the Facade page.
- Other products have their own entry points on the Facade (for example, the Slides, Boards, Bases
  and PDFs guides each have a `facade` page). Look them up, do not infer from Sheets.
- A source-new API may not be in the installed release. Open the installed `.d.ts` (for example
  `node_modules/@univerjs/sheets/lib/types/facade/`) before using any method that is new to you,
  and if it is absent, say so rather than substituting a guess. The docs' Facade pages and
  `/reference/llms.txt` are the API reference; this file does not duplicate them.

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
