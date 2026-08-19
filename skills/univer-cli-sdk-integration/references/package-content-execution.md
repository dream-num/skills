<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-execution

English | 简体中文

Bind a piece of Facade JavaScript to an explicit Univer Unit to generate a program that can be executed by the runtime.

This is useful for CLIs or Agents that need user code to operate only on a specified Unit. The package injects stable bindings for the Unit type and prevents user code from redeclaring those bindings before execution.

## Installation

```bash
pnpm add @univer-cli/content-execution
```

Requires Node.js 22.12 or higher.

## Quick Start

```ts
import { prepareContentExecutionProgram } from "@univer-cli/content-execution";

const program = prepareContentExecutionProgram({
  code: 'workbook.getActiveSheet().getRange("A1").setValue("done");',
  unitId: "book-1",
  unitType: "sheet",
});

const result = await runtime.execute({
  code: program,
  mode: "write",
});
```

The package returns only the program string. The caller remains responsible for acquiring the Runtime, selecting the execution mode, managing the lease, and persisting changes.

## Available bindings

| Unit type | Injected binding                   |
| --------- | ---------------------------------- |
| Sheet     | `univerAPI`, `api`, `workbook`     |
| Doc       | `univerAPI`, `api`, `document`     |
| Slide     | `univerAPI`, `api`, `presentation` |
| Base      | `univerAPI`, `api`, `database`     |
| Board     | `univerAPI`, `api`, `board`        |

Root Facade is obtained through `unitId` instead of relying on the current active unit, so the same code can be stably executed in the headless runtime.

## Validation and errors

User code must not redeclare package-injected bindings at the top level. An invalid Unit type, empty Unit ID, parse failure, or binding conflict throws `ContentExecutionError` with a stable error code for adapter-level presentation.

The package does not determine whether code is safe or provide a process-level sandbox. When executing untrusted code, the application must provide its own isolation boundary.

## Responsibility boundaries

This package does not depend on Commander, acquire collaboration runtimes, parse targets, or submit changesets. For a complete collaboration execution workflow, combine it with `@univer-cli/univer-collaboration-runtime` or the runtime pool.
