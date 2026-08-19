<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/api-reference-command

English | 简体中文

Add `@univer-cli/api-reference` to an existing Commander application with ready-to-use `api find` and `api show` commands.

## Installation

```bash
pnpm add commander @univer-cli/api-reference @univer-cli/api-reference-command
```

Commander `^15.0.0` is a peer dependency. Requires Node.js 22.12 or higher.

## Quick Start

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

const program = new Command("my-cli");

program.addCommand(
  createApiCommand({
    reference: createStandardApiReference(),
  }),
);

await program.parseAsync();
```

After building the CLI, query the reference directly:

```bash
my-cli api find setValues "conditional formatting" --unit sheet
my-cli api show FRange FRange.setValues ICellData.v
```

## Command list

```text
api find <terms...> [--unit <sheet|slide|doc>]
api show <symbols...>
```

`find` prints human-readable matches; `show` prints precise details. When a symbol is not found, `show` writes an error and exits non-zero. Commander also handles invalid arguments and reference execution errors.

## Customize with Commander

The factory returns a native `Command`, so you can continue to customize its name, aliases, output, and error behavior:

```ts
const command = createApiCommand({ reference }).name("reference").alias("api").exitOverride();

command.configureOutput({
  writeOut: (text) => process.stdout.write(text),
  writeErr: (text) => process.stderr.write(text),
});
```

The package does not create a root program or restrict how the application composes other commands.

## API entry

- `createApiCommand({ reference })`: Returns a native Commander `Command`.
- `renderFindResults()`, `renderShowResult()`: Default text presenters.
