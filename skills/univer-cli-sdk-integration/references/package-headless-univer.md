<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/headless-univer

English | 简体中文

Provides a standard headless Univer factory for Node.js that can be used directly in production compositions.

The factory registers Sheet, Doc, Slide, Base, and Board content plugins; Facade extensions; locale, formula, and network dependencies; and returns an exclusive `Univer` instance with no target Unit loaded.

## Installation

```bash
pnpm add @univer-cli/headless-univer
```

Requires Node.js 22.12 or higher. The caller must also satisfy the Univer / Univer Pro peer and runtime dependencies declared in the package manifest.

## Quick Start

The most common usage is to inject a standard factory into the Collaboration Runtime:

```ts
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createUniverCollaborationRuntimeFactory,
  type CollaborationRuntimeBackend,
} from "@univer-cli/univer-collaboration-runtime";

export function createRuntimeFactory(backend: CollaborationRuntimeBackend) {
  return createUniverCollaborationRuntimeFactory({
    backend,
    createUniver: createStandardHeadlessUniverFactory({
      license: process.env.UNIVER_LICENSE ?? "",
    }),
  });
}
```

The returned factory also works with any custom runtime that accepts the same Univer factory shape; this package does not depend on Collaboration Runtime.

## Factory behavior

The standard composition:

- Registers standard content and Pro plugins for Sheet, Doc, Slide, Base, and Board.
- Registers the corresponding Facade extensions.
- Uses a fixed locale and the Rust formula engine.
- Sets initial formula calculation to `NO_CALCULATION`.
- Accepts optional `embedPluginConfig`.
- Creates `FUniver` on the same dependency graph through `createStandardHeadlessUniverFacade(univer)`.

Each factory call returns a new exclusive Univer instance. Its lifecycle owner must dispose of it after use.

## Responsibility boundaries

The package is responsible only for standard Univer composition. It does not load Snapshot or UnitData, capture mutations, or manage revisions, OT, commits, worker pools, daemons, authentication, or server transport. Applications that need a different plugin combination can implement their own `HeadlessUniverFactory` without forking this package.
