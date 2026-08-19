<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/doc-typst-facade

English | 简体中文

Compile a constrained Typst source bundle into a plain JavaScript Facade program that creates a complete Univer Doc.

The compilation result also includes structured diagnostics. When the layout needs manual review, the package can generate Typst PNG previews from the same source.

## Installation

```bash
pnpm add @univer-cli/doc-typst-facade
```

Requires Node.js 22.12 or higher and uses the platform native binding supported by the package.

## Bundle structure

Bundle root contains `typst.json`, page source and local assets:

```text
paper/
├── typst.json
├── prelude.typ
├── pages/
│   ├── 01.typ
│   └── 02.typ
└── assets/
    └── logo.png
```

The manifest declares `targetUnitId` and an ordered `pages` list. It may also declare `title`, `prelude`, and explicit page IDs. Every path must stay within the bundle root; absolute paths, URLs, parent traversal, and symlinks that escape the root are rejected.

## Quick Start

```ts
import { compileDocTypstBundle } from "@univer-cli/doc-typst-facade";

const result = await compileDocTypstBundle("./paper", {
  previewDir: "./review/typst",
});

console.log(result.javascript);
console.log(result.diagnostics);
console.log(result.previews);
```

`javascript` assumes that `univerAPI` is available in the execution environment. Running it creates the complete Doc identified by `targetUnitId` in the manifest. This ID is internal to the generated program, not the real content identity assigned by Workspace.

No PNG is generated when `previewDir` is omitted. When provided, the same official native binding renders the previews, and each result records its page ID, source path, and output path.

## Diagnostics and failures

Diagnostics have `info`, `warning`, or `error` severity:

- A warning means the result is available but has fidelity limitations or needs manual review.
- An error means the caller should not apply the generated program to a persistent target.
- If the program cannot be generated, the package throws `DocTypstFacadeError` or `DaCTypstTranslationError` with diagnostics.

An adapter can identify capability errors with `isDocTypstFacadeError()` and present each issue by source path/span.

For the preset command, see
[`@univer-cli/doc-typst-facade-command`](./package-doc-typst-facade-command.md).
