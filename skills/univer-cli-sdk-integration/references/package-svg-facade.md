<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/svg-facade

English | 简体中文

Deterministically compile SVG source into plain JavaScript Facade code that can be executed in Univer Slide and return structured diagnostics.

It is suitable for Slide importers, Agent asset workflows, and build tools. The package does not depend on Commander, filesystems, or a specific target model.

## Installation

```bash
pnpm add @univer-cli/svg-facade
```

## Quick Start

```ts
import { compileSvgToFacade, wrapSlideScript } from "@univer-cli/svg-facade";

const compiled = await compileSvgToFacade(`
  <svg viewBox="0 0 960 540">
    <rect x="40" y="40" width="240" height="120" rx="16" fill="#2563eb" />
    <text x="72" y="112" font-size="28" fill="#ffffff">Hello</text>
  </svg>
`);

const program = wrapSlideScript(compiled.code, {
  page: 2,
  mode: "replace",
  ...compiled.viewport,
});

await runtime.execute({ code: program, mode: "write" });
```

`compiled.code` assumes that `slide` and `univerAPI` are already in scope. The wrapper binds the code to the target page and sets the page size from the SVG viewport.

## Supported features

The compiler maps common shapes, paths, text, images, gradients, references, and viewport behavior. Results include code, viewport details, warnings, authoring lints, and text measurement information. Unsupported features are reported through diagnostics or `SvgFacadeError` instead of silently pretending to work.

## External images and fonts

When an SVG references an external asset, the caller provides its content through a resolver. The package does not read URLs or arbitrary local paths on its own. Text fidelity depends on an injected text measurer; results explicitly report fallbacks or risks when precise font measurement is unavailable.

Target selection, runtime lease, execution and commit belong to the application.

For the preset command, see [`@univer-cli/svg-facade-command`](./package-svg-facade-command.md).
