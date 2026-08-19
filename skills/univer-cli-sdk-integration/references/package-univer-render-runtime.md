<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-render-runtime

English | 简体中文

Start a local browser from Node.js, host the Render Page built by the application, and pass materialized Univer UnitData to the page for rendering operations.

This is the underlying runtime shared by `unit-screenshot` and `unit-layout-lint`. If you only need PNGs or a lint report, start with the corresponding higher-level capability.

## Installation

```bash
pnpm add @univer-cli/univer-render-runtime
```

Also required:

- A Render Page static directory built by the application.
- A Chrome, Chromium, or Edge executable.
- UnitData materialized to an explicit head state.

## Create runtime

```ts
import { fileURLToPath } from "node:url";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const renderPageRoot = fileURLToPath(new URL("../dist/render-page", import.meta.url));
const runtime = await createUniverRenderRuntime({ renderPageRoot });

try {
  const image = await runtime.render({
    unitType: "sheet",
    unitData: workbookData,
    operation: {
      kind: "sheet-range",
      sheetName: "Sheet1",
      range: "A1:F20",
      scale: 2,
    },
  });

  console.log(image.width, image.height, image.bytes);
} finally {
  await runtime.close();
}
```

A runtime can execute multiple operations sequentially. The application should close it once at the outermost lifecycle boundary instead of restarting the browser for every image.

## Render Page and browser

The package does not include Univer plugins or a prebuilt page. The application builds the page with [`@univer-cli/univer-render-page`](./package-univer-render-page.md) or a custom implementation, then passes its directory as `renderPageRoot`.

The browser executable is resolved in this order: explicit `browserExecutablePath`, `UNIVER_RENDER_BROWSER`, the SDK browser cache, then common system installation paths. Creating a runtime does not implicitly download a browser.

```ts
import {
  installUniverRenderBrowser,
  probeUniverRenderBrowser,
} from "@univer-cli/univer-render-runtime";

const installation = await installUniverRenderBrowser();
await probeUniverRenderBrowser({ executablePath: installation.executablePath });
```

## Operations and results

The runtime supports the Sheet range, Doc page, Slide page, Board content, and Base view/table operations required by higher-level capabilities, returning PNGs or layout facts. Both the Node.js and page sides validate the protocol; mismatched page versions, invalid results, and timeouts fail explicitly.

`license` is optional and is passed through page bootstrap without modifying static files. For cross-Unit formulas, `formulaReferenceUnits` can supply the minimal UnitData dependencies.

## Run safely

The browser probe and runtime currently use Chromium `--no-sandbox`. Do not render untrusted UnitData directly on a shared high-privilege host containing sensitive data. Use a restricted user, container, or other process-level isolation, and limit file and network access.

## Responsibility boundaries

The package is responsible for static hosting, browser lifecycle, page protocol, operation dispatch, timeouts, and structured results. It does not load remote targets, materialize changesets, choose screenshot targets, or write PNG files.
