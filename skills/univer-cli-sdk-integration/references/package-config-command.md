<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/config-command

English | 简体中文

Add `@univer-cli/config` to a Commander application with a ready-to-use set of local configuration commands.

## Installation

```bash
pnpm add commander @univer-cli/config @univer-cli/config-command
```

Commander `^15.0.0` is a peer dependency. Requires Node.js 22.12 or higher.

## Quick Start

Define the configuration with the capability, then inject it into the command:

```ts
import { join } from "node:path";
import { configCodecs, createFileConfig, defineConfig } from "@univer-cli/config";
import { createConfigCommand } from "@univer-cli/config-command";
import { Command } from "commander";

const config = createFileConfig({
  path: join(process.cwd(), ".my-cli", "config.json"),
  definitions: defineConfig({
    "runtime.enabled": {
      description: "Enable the runtime.",
      defaultValue: true,
      codec: configCodecs.boolean(),
    },
  }),
});

const program = new Command("my-cli");
program.addCommand(createConfigCommand({ config }));
await program.parseAsync();
```

## Command list

```text
config path
config list [--json]
config get <key> [--json]
config set <key> <value> [--json]
config unset <key> [--json]
```

`set` uses the codec in the configuration definition to parse text, so the CLI and direct capability calls share the same validation. The default output is human-readable; `--json` prints structured results. Commander exits non-zero for unknown keys and invalid values.

## Customization

The factory returns a native Commander `Command`. The application can customize its name, aliases, help, output, and exit behavior, or skip the preset and call the capability directly:

```ts
const entry = await config.get({ key: "runtime.enabled" });
renderWithMyOwnFormat(entry);
```

This package does not define configuration keys, default values, or persistence rules; these contracts all belong to `@univer-cli/config`.
