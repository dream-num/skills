<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/daemon-command

English | 简体中文

Provide native Commander lifecycle commands for `@univer-cli/daemon`, allowing users to inspect, start, restart, and stop a local daemon explicitly.

## Installation

```bash
pnpm add commander @univer-cli/daemon @univer-cli/daemon-command
```

Commander `^15.0.0` is a peer dependency. Requires Node.js 22.12 or higher.

## Quick Start

```ts
import { createDaemonControl } from "@univer-cli/daemon";
import { createDaemonCommand } from "@univer-cli/daemon-command";
import { Command } from "commander";

const control = createDaemonControl({
  entry: new URL("./daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath: "/tmp/my-cli.sock",
});

const program = new Command("my-cli");
program.addCommand(createDaemonCommand({ control }));
await program.parseAsync();
```

## Command list

```text
daemon status [--json]
daemon start [--json]
daemon restart [--json]
daemon stop [--json]
```

Default output is human-readable; `--json` is suitable for scripts and Agents. The factory returns a native Commander `Command`, so you can continue to customize its name, help, output, and exit behavior.

This package does not choose the daemon entrypoint, socket, identity, environment, or application shutdown cleanup. The application provides those dependencies when it creates `DaemonControl`.
