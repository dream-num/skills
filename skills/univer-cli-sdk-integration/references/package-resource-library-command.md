<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/resource-library-command

English | 简体中文

Provide a native Commander `resources` preset for `@univer-cli/resource-library`, including registry listing, search, reading, and batch export.

## Installation

```bash
pnpm add commander @univer-cli/resource-library @univer-cli/resource-library-command
```

Commander `^15.0.0` is a peer dependency. Requires Node.js 22.12 or higher.

## Add to application

```ts
import { createResourcesCommand } from "@univer-cli/resource-library-command";
import type { ResourceLibrary } from "@univer-cli/resource-library";
import { Command } from "commander";

export async function runCli(openLibrary: () => ResourceLibrary): Promise<void> {
  const program = new Command("my-cli");
  program.addCommand(createResourcesCommand({ openLibrary }));
  await program.parseAsync();
}
```

## Command list

```text
resources registries [--json]
resources find <queries...> [--registry <id>] [--limit <number>] [--json]
resources export <handle> [--json]
resources export <handles...> --out <directory> [--json]
resources cache path [--json]
resources cache clear [--json]
```

Default text is human-readable; `--json` prints structured results. Binary content is not mixed into the JSON summary. Commander exits non-zero for invalid input, unknown handles, and download or export failures.

`openLibrary` lets the application lazily create a library with credentials or filesystem adapters. The command package does not own catalog, cache, download, or export rules; those behaviors belong to the capability. The factory returns a native `Command`.
