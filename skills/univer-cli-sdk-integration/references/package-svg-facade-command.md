<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/svg-facade-command

English | 简体中文

Provide a native Commander `compile-svg` preset for `@univer-cli/svg-facade`. It reads SVG and local references, writes Facade JavaScript or JSON, and sends diagnostics to the appropriate terminal stream.

## Installation

```bash
pnpm add commander @univer-cli/svg-facade @univer-cli/svg-facade-command
```

## Add to application

```ts
import { createCompileSvgCommand } from "@univer-cli/svg-facade-command";
import { Command } from "commander";

const program = new Command("my-cli");
program.addCommand(createCompileSvgCommand({ textMeasurer }));
await program.parseAsync();
```

## Command list

```text
compile-svg <file.svg> [--json] [--estimate-text-size]
  [--page <number> [--add] [--out <path>]]
```

By default, JavaScript is written to stdout. When `--page` is specified, `--out` can write the result to a file. `--add` overlays content instead of clearing the page. `--json` returns code, viewport details, and diagnostics. Warnings and authoring lints go to stderr without polluting code output. Commander exits non-zero for input, asset, or compilation failures.

The package is responsible for file input, CLI presentation, and failure behavior. SVG semantics, compilation, and diagnostics belong to the capability. The factory returns a native `Command`.
