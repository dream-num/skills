<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/config

English | 简体中文

Provide well-typed local configuration for CLIs, Agents, and other Node.js applications. The application declares the available keys, default values, and codecs; the package validates and reads effective values and persists values explicitly set by the user.

## Installation

```bash
pnpm add @univer-cli/config
```

Requires Node.js 22.12 or higher.

## Quick Start

```ts
import { join } from "node:path";
import { configCodecs, createFileConfig, defineConfig } from "@univer-cli/config";

const definitions = defineConfig({
  "workspace.origin": {
    description: "Workspace service origin.",
    defaultValue: "https://workspace.univer.plus",
    codec: configCodecs.httpOrigin(),
  },
  "runtime.enabled": {
    description: "Enable the runtime.",
    defaultValue: true,
    codec: configCodecs.boolean(),
  },
});

const config = createFileConfig({
  definitions,
  path: join(process.cwd(), ".my-cli", "config.json"),
});

const entry = await config.get({ key: "workspace.origin" });
console.log(entry.value, entry.source);

await config.set({ key: "runtime.enabled", value: false });
await config.unset({ key: "runtime.enabled" });
```

`path` must be an absolute `.json` path chosen by the application. The package does not choose a product directory or configuration filename for you.

## Where does the value come from?

Reading the result will indicate the source of the effective value:

- `explicit`: The value was written to the configuration file.
- `default`: The value comes from the in-memory configuration definition.
- `unset`: There is neither an explicit value nor a default.

Configuration files contain only explicit values. Descriptions, codecs, and default values exist only in the application's definitions and are not written to disk.

## Codec

Built-in codecs cover common CLI configuration types:

- `nonEmptyString()`
- `boolean()`
- `integer({ minimum, maximum })`
- `enumeration(values)`
- `httpUrl()`
- `httpOrigin()`

A custom codec must both validate JSON values and define how CLI text is converted to the same type. Every value must satisfy `ConfigValue`; functions, class instances, and other arbitrary objects cannot be persisted.

## Persistence and errors

The package uses `conf` for JSON reads, writes, and atomic replacement, but does not expose the `conf` instance, its storage interface, or the internal document shape. Unknown keys, invalid values, codec failures, and file errors all throw `ConfigError`; adapters can use its error code to choose terminal or UI presentation.

For the preset command, see [`@univer-cli/config-command`](./package-config-command.md).
