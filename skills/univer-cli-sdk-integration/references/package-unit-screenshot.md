<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-screenshot

English | 简体中文

Renders a materialized Univer UnitData to one or more PNGs, returning the image bytes, dimensions, page identity, and suggested filename.

This is the preferred entry point for Sheet, Doc, Slide, Board, and Base screenshots. It handles target selection, pagination, scale, naming, and resource limits; `@univer-cli/univer-render-runtime` provides the underlying browser lifecycle.

## Installation

```bash
pnpm add @univer-cli/unit-screenshot @univer-cli/univer-render-runtime
```

Also required:

- A Render Page built by the application.
- Chrome, Chromium, or Edge.
- UnitData materialized to an explicit content state.

## Quick Start

First mount the Render Page in the browser entry:

```ts
import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("#app is required");

await mountUniverRenderPage({
  container,
  createUniver: createPresetRenderUniver,
});
```

After building the page, create runtime and screenshot capabilities in Node.js:

```ts
import { fileURLToPath } from "node:url";
import { createUnitScreenshot } from "@univer-cli/unit-screenshot";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const runtime = await createUniverRenderRuntime({
  renderPageRoot: fileURLToPath(new URL("../dist/render-page", import.meta.url)),
});

try {
  const screenshot = createUnitScreenshot({ runtime });
  const result = await screenshot.capture({
    unitType: "sheet",
    unitData: workbookData,
    target: {
      kind: "sheet-range",
      sheetName: "Data",
      range: "B2:H40",
      scale: 2,
    },
  });

  for (const image of result.images) {
    await writePng(image.name, image.bytes);
  }
} finally {
  await runtime.close();
}
```

The capability does not write files; the application implements `writePng`.

## Target

Omitting `target` selects the default content conforming to the Unit type:

| Unit  | Default target                         |
| ----- | -------------------------------------- |
| Sheet | used range of active worksheet         |
| Doc   | All pages                              |
| Slide | All slide pages                        |
| Board | Content bounds containing all elements |
| Base  | Active table/view after opening        |

For precise control, select a Sheet range, Doc pages, Slide pages or contact sheet, Board region or elements, or Base table/view. Slide page numbers are one-based; page IDs are also accepted.

## External pictures

If an image in UnitData contains only a UUID, inject its bytes or data URL through `resolveImage`. The package traverses image references and creates a copy suitable for browser transport; it does not modify the caller's UnitData.

Use `formulaReferenceUnits` when the host Unit contains cross-Unit formulas. This is an optional enhancement and does not change the ordinary `unitType + unitData` screenshot contract.

## Results and limits

A capture may return multiple images. Each image contains PNG bytes, dimensions, page/target identity, and a stable suggested filename. Limits can constrain the page count, pixels per image, and total pixels to prevent accidental memory exhaustion. Scale must be between 0.1 and 4.

`UnitScreenshotError` is thrown when rendering fails, a target is invalid, an image cannot be parsed, or a limit is exceeded. The application should always close the shared render runtime at the outermost lifecycle boundary.

Use `@univer-cli/univer-render-runtime` when you need direct control over browser operations. For Slide layout diagnosis, use `@univer-cli/unit-layout-lint`.

For the preset command, see
[`@univer-cli/unit-screenshot-command`](./package-unit-screenshot-command.md).
