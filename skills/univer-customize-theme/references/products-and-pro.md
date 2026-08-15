# Products and Pro themes

This reference targets current Univer OSS and Pro source.

## Shared application palette

All six product families consume the core `ThemeService` from the owning Univer runtime:

| Product | Unit type | Separate content theme/style |
|---|---|---|
| Sheets | `UNIVER_SHEET` | Range/table themes through Sheet Facades |
| Docs | `UNIVER_DOC` | No public document-theme Facade; text/paragraph styles are content |
| Slides | `UNIVER_SLIDE` | Persisted slide color/font/format scheme; no current public setter Facade |
| Bases | `UNIVER_BASE` | No separate public Base theme |
| Boards | `UNIVER_BOARD` | Persisted Board theme selected by ID; no public custom-theme registry |
| PDFs | `UNIVER_PDF` | PDF table theme Facades |

Set the application palette once. Do not create per-product `ThemeService` instances or invent a product theme plugin.

Theme state does not replace integration state:

- Preset Mode imports each selected preset's aggregate `/lib/index.css` and locale bundle.
- Plugin Mode registers the full plugin graph, imports required `/facade` entries, and imports `@univerjs/design/lib/index.css`, `@univerjs/ui/lib/index.css`, the host UI CSS, and selected feature UI CSS.
- Slides, Bases, Boards, and PDFs still use their current Pro host composition; a shared Theme does not create a preset for them.

Use `univer-integrate` or `univer-pro-integrate` for the exact product graph.

## Runtime theme versus persisted content

The application theme supplies UI and rendering defaults. It does not rewrite persisted cell fills, document text, slide/board shapes, PDF annotations, or explicit Chart colors. Use product Facades or Commands when the request changes content.

Important product boundaries:

- Sheet range themes are registered and applied through `FWorkbook`/`FRange`; they are not application palettes.
- Slide theme data controls presentation content, but current source has no public `FPresentation` or `FSlide` theme setter. Do not call internal operations from external integration code.
- Board `getThemeData()`/`setTheme(themeId)` uses its content theme system and selects an already-known ID. Do not promise a custom Board theme registry that the current public Facade does not expose.
- PDF table presets and `FPdfTable.setTheme()` style table content. Some palette slots use product fallbacks when no matching global token exists.

## Pro Chart themes are separate

`@univerjs-pro/engine-chart` owns a complete `IEchartTheme` registry shared by Charts in Sheets, Docs, Slides, and Boards. Bases and PDFs are not Chart hosts in this matrix. A Chart theme is not an `@univerjs/themes` application `Theme`.

The current source adds `FUniver.registerTheme()` through the Chart Facade. The published npm `1.0.0-beta.0` Chart Facade does not yet declare that method despite carrying the same manifest version; check the installed `/facade` declarations. When it is absent, do not reach through the injector to the exported service—use the installed public Chart palette/theme surface or upgrade to a release that exposes registration.

The host must register its selected Chart plugin graph. In Plugin Mode, explicitly import the Facade side effect:

```ts
import type { IEchartTheme } from '@univerjs-pro/engine-chart';
import { UniverTheme1 } from '@univerjs-pro/engine-chart';

import '@univerjs-pro/engine-chart/facade';

const brandChartTheme: IEchartTheme = {
  ...UniverTheme1,
  themeName: 'brand',
  theme: {
    ...UniverTheme1.theme,
    color: ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B'],
  },
};

univerAPI.registerTheme('brand', brandChartTheme);
```

Also import the Facade entry owned by every Chart host used:

| Host | Facade side effect |
|---|---|
| Sheets | `@univerjs-pro/sheets-chart/facade` |
| Docs | `@univerjs-pro/docs-chart/facade` |
| Slides | `@univerjs-pro/slides-chart/facade` |
| Boards | `@univerjs-pro/boards-chart/facade` |

For example, a Sheet Chart builder needs its host extension before applying the registered name:

```ts
import '@univerjs-pro/sheets-chart/facade';

const chartInfo = worksheet
  .newChart(univerAPI.Enum.ChartTypeString.Column)
  .setSource('A1:D8')
  .setTheme('brand')
  .build();

await worksheet.insertChart(chartInfo);
```

Rules:

- Keep `themeName` and registry name stable and equal.
- Derive from a built-in because `IEchartTheme` is complete.
- Registering an existing name replaces it; there is no public unregister method.
- An explicit non-empty Chart palette can override the registered palette.
- Chart rendering consults core dark mode, but the registry remains separate.
- `registerTheme()` requires `@univerjs-pro/engine-chart/facade`; the base application palette method is `setTheme()`.

## Multiple browser instances

Each Univer instance owns service state, but current UI variables and `univer-dark` are written to the document root. Separate instances in one page cannot guarantee independent UI palettes. Current disposal does not remove that style element or restore the root class. Use a single document-wide appearance or isolate editors in separate documents.
