<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-inspection-command

English | 简体中文

Provide a native Commander `inspect` command preset for `@univer-cli/content-inspection`, including selector parsing, default text or JSON output, and runtime lease acquisition and release.

## Installation

```bash
pnpm add commander @univer-cli/content-inspection @univer-cli/content-inspection-command
```

Commander `^15.0.0` is a peer dependency. Requires Node.js 22.12 or higher.

## Select preset

The package provides two independent factories:

- `createContentInspectionCommand()`: only receives Unit ID, no Worktree option appears;
- `createWorktreeContentInspectionCommand()`: forces the caller to choose either `--trunk` or `--worktree <id>`.

Ordinary applications should choose the former; use the latter only if the target model explicitly includes Worktree.

## Quick Start

```ts
import { createContentInspectionCommand } from "@univer-cli/content-inspection-command";
import { Command } from "commander";

const program = new Command("my-cli");

program.addCommand(
  createContentInspectionCommand({
    async acquireRuntime({ unitId }) {
      const lease = await runtimes.acquire({
        key: `unit:${unitId}`,
        init: { unitId },
      });

      return {
        unitId: lease.unitId,
        unitType: "sheet",
        execute: async (input) => await lease.execute(input),
        invalidate: async () => await lease.invalidate(),
        release: async () => await lease.release(),
      };
    },
  }),
);

await program.parseAsync();
```

## Lifecycle

The command acquires a runtime when its action starts and releases it on success or failure. If inspection or presentation fails, it invalidates the lease before passing the failure to Commander. The application still owns target-to-pool-key mapping, runtime initialization, authentication, and remote data loading.

## Input and output

The command accepts a Unit ID, a Unit-specific selector, and `--json`. Default text is human-readable; JSON output directly represents the capability's structured result. Selector syntax validation belongs to the command adapter, while the actual inspection rules belong to the capability.

The factory returns a native `Command`, so you can continue to use Commander to customize its name, help, output, and exit behavior. This package does not create a root program.
