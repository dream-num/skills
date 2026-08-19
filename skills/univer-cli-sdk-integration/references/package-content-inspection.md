<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-inspection

English | 简体中文

Read stable, structured content information from loaded Univer Units, suitable for CLI, Agent, testing or other automation tools.

It supports Sheet, Doc, and Slide. The caller supplies a read-only execution runtime; the package generates and executes a Facade program, then validates the result into a stable inspection model.

## Installation

```bash
pnpm add @univer-cli/content-inspection
```

Requires Node.js 22.12 or higher.

## Quick Start

```ts
import { inspectContent } from "@univer-cli/content-inspection";

const result = await inspectContent(
  {
    unitId: lease.unitId,
    unitType: "sheet",
    execute: async (input) => await lease.execute(input),
  },
  { kind: "workbook" },
);

console.log(result);
```

The runtime only needs to implement this read interface:

```ts
interface ContentInspectionRuntime {
  readonly unitId: string;
  readonly unitType: "sheet" | "doc" | "slide" | "base" | "board";
  execute(input: { code: string; mode: "read" }): Promise<{ value: JsonValue }>;
}
```

A Collaboration Runtime lease can adapt directly to this interface.

## What can be queried?

Each Unit has an overview query, which is used to first discover the structure and then launch a more precise query:

- Sheet: `workbook` overview, select worksheet by ID/name/index, or read worksheet range;
- Doc: `document` overview, or select paragraph by ID/index;
- Slide: `presentation` overview, or select a slide by ID/index.

The query is a discriminated union, so TypeScript infers the fields available for each query kind. Results contain only JSON-compatible values for straightforward serialization and cross-process transfer.

## Error model

The package distinguishes invalid input, Unit type mismatches, runtime execution failures, and return values that do not conform to the protocol. It exposes `ContentInspectionError` with stable error codes and validates the program envelope returned by the runtime, preventing arbitrary values from being mistaken for inspection results.

For the preset command, see
[`@univer-cli/content-inspection-command`](./package-content-inspection-command.md).
