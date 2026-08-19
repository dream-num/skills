<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-layout-lint

English | 简体中文

Use real browser-generated layout facts to detect text overflow and overlap in Slides, returning structured findings with evidence.

Currently only Slide is supported. If the goal is to take a screenshot rather than diagnose, use `@univer-cli/unit-screenshot`.

## Installation

```bash
pnpm add @univer-cli/unit-layout-lint @univer-cli/univer-render-runtime
```

The application must also build the Render Page and provide Chrome, Chromium, or Edge.

## Quick Start

```ts
import { fileURLToPath } from "node:url";
import { createUnitLayoutLint } from "@univer-cli/unit-layout-lint";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const runtime = await createUniverRenderRuntime({
  renderPageRoot: fileURLToPath(new URL("../dist/render-page", import.meta.url)),
});

try {
  const lint = createUnitLayoutLint({ runtime });
  const report = await lint.lint({
    unitType: "slide",
    unitData: slideData,
    pages: [1, "closing-slide"],
  });
  console.log(report.findings);
} finally {
  await runtime.close();
}
```

## Current rules

- `text-off-page`: actual glyph ink extends beyond the page.
- `text-escapes-container`: text visibly escapes a smaller opaque container.
- `text-overlaps-text`: two regions of actual glyph ink overlap significantly.

A finding is an evidence-backed review suggestion, not a content error that must always be fixed. When `pages` is omitted, every page is checked. Numeric page selectors are one-based; string selectors use page IDs from `slideOrder`.

The application is responsible for materializing the Slide and providing a render runtime. The package does not load remote targets, save reports, or define lint rules for other Unit types.

For the preset command, see
[`@univer-cli/unit-layout-lint-command`](./package-unit-layout-lint-command.md).
