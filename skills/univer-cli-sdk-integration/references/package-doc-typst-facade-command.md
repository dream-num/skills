<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/doc-typst-facade-command

English | 简体中文

Provide a native Commander `compile-typst` preset for `@univer-cli/doc-typst-facade`. It reads a Typst bundle, writes Facade JavaScript, and can generate diagnostics and PNG previews.

## Installation

```bash
pnpm add commander @univer-cli/doc-typst-facade @univer-cli/doc-typst-facade-command
```

## Quick Start

```ts
import { Command } from "commander";
import { createCompileTypstCommand } from "@univer-cli/doc-typst-facade-command";

const program = new Command("my-cli");
program.addCommand(createCompileTypstCommand());
await program.parseAsync();
```

```bash
my-cli compile-typst ./paper --out ./generated/doc.js
my-cli compile-typst ./paper --out ./generated/doc.js --preview-dir ./review/typst
```

The factory returns a native Commander `Command`. Bundle validation, compilation, diagnostics, and preview semantics belong to the capability; this package handles only file arguments, output, and Commander failure behavior.
