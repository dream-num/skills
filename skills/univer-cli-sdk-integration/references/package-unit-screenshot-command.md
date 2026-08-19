<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-screenshot-command

English | 简体中文

Provide a native Commander `screenshot` preset for `@univer-cli/unit-screenshot`. It parses Unit and target options, calls the capability, and saves PNGs through an injected writer.

## Installation

```bash
pnpm add commander @univer-cli/unit-screenshot @univer-cli/unit-screenshot-command
```

## Add to application

```ts
import {
  createUnitScreenshotCommand,
  type UnitScreenshotCommandDependencies,
} from "@univer-cli/unit-screenshot-command";
import { Command } from "commander";

export async function runCli(dependencies: UnitScreenshotCommandDependencies): Promise<void> {
  const program = new Command("my-cli");
  program.addCommand(createUnitScreenshotCommand(dependencies));
  await program.parseAsync();
}
```

The application provides dependencies including the UnitData loader, screenshot capability, and PNG writer. The package does not define how Unit IDs map to local files, Workspace, or other targets.

## Input and output

The command accepts a Unit ID, Unit type, and screenshot selectors such as a Sheet range, Slide pages, Board elements, scale, and output directory. Default output lists the written PNG paths; `--json` prints a structured summary, and image bytes never enter stdout.

Commander exits non-zero when arguments are invalid or Unit loading, rendering, or file writing fails. The application still owns the runtime and other long-lived resources and closes them at the composition root.

## Browser setup command

`createUniverRenderBrowserSetupCommand()` provides optional browser installation and detection for environments without a system Chromium. It does not implicitly download a browser for every screenshot.

Both factories return native Commander `Command` instances. Target selection, pagination, naming, and limits belong to the capability. This package handles only argv, presentation, and the writer adapter.
