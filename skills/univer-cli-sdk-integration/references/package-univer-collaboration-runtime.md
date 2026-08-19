<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-collaboration-runtime

English | 简体中文

Create a headless collaboration runtime that binds one Univer Unit in a Node.js process and explicitly controls reading, editing, pulling, and committing.

The runtime handles UnitData/Snapshot loading, mutation capture, OT, revisions, pending/awaiting state, and changeset identity. Through the backend port, the application determines whether content comes from local files, databases, or Collaboration Server.

## Installation

```bash
pnpm add @univer-cli/univer-collaboration-runtime
```

Requires Node.js 22.12 or higher and meets the Univer and Collaboration SDK version requirements in the package manifest.

## Quick Start

Create a backend, then inject it and a Univer factory into the runtime factory:

```ts
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createUniverCollaborationRuntimeFactory,
  type CollaborationRuntimeBackend,
} from "@univer-cli/univer-collaboration-runtime";

const backend: CollaborationRuntimeBackend = {
  async open({ unitId, unitType }) {
    return {
      format: "unit-data",
      getConnectionState: () => "online",
      getUnitData: async () => loadCheckpoint(unitId, unitType),
      fetchChangesets: (from, to) => loadChangesets(unitId, from, to),
      submitChangeset: (draft) => storeChangeset(unitId, unitType, draft),
      close: async () => undefined,
    };
  },
};

const factory = createUniverCollaborationRuntimeFactory({
  backend,
  createUniver: createStandardHeadlessUniverFactory({ license: "" }),
});
```

The factory creates a runtime for a target. A runtime remains bound to that one Unit throughout its lifecycle.

## Recommended single-round workflow

```ts
const runtime = await factory.load(unitId, unitType);

try {
  const initialPull = await runtime.pull();
  if (initialPull.status === "conflict") throw new Error(initialPull.conflict.message);

  const result = await runtime.execute({
    mode: "write",
    code: 'workbook.getActiveSheet().getRange("A1").setValue("ready");',
  });

  let commit = await runtime.commit();
  if (commit.status === "pull-required") {
    const pulled = await runtime.pull();
    if (pulled.status === "conflict") throw new Error(pulled.conflict.message);
    commit = await runtime.commit();
  }
  console.log(result.value, commit);
} finally {
  await runtime.close();
}
```

- `execute({ mode: "read" })` does not allow mutations.
- `execute({ mode: "write" })` captures mutations and adds them to the local pending state.
- `fetch()` only retrieves and validates remote changesets; it does not modify Unit content. Most workflows do not need to call it separately.
- `pull()` fetches first, then reconciles local state through OT and applies remote changesets.
- `commit()` commits local changeset and handles awaiting/pending identity.
- `close()` releases the backend handle and Univer instance.

The caller must inspect the final commit status. `confirmed` and `nothing-to-commit` are complete. `retry` and `unknown` can be retried on the same runtime. `pull-required` requires another pull/commit cycle. `conflict` requires writes to stop while the application chooses a recovery strategy.

## Backend port

`CollaborationRuntimeBackend.open()` returns a handle bound to the target. The handle can use a `unit-data` checkpoint or Snapshot and is responsible for continuous changeset reads, idempotent commits, connection state, and closing. The runtime does not interpret Workspace, Worktree, ResourceRef, credentials, or URLs; those belong to the application adapter.

When connecting to the official Collaboration Server, build the backend with the services, endpoints, and transports provided by the Collaboration SDK. Snapshots and changesets should not pass through the daemon.

## Status and errors

The runtime exposes the current revision, connection state, local dirty state, and conflict results. Backend interruptions are not disguised as success; fetch/pull/commit results let adapters distinguish no changes, successful pushes, conflicts, and failures. If a runtime can no longer be reused safely, its owner should destroy it instead of continuing execution.

## Relationship with other packages

The standard Univer composition comes from `@univer-cli/headless-univer`. To reuse runtimes by key in worker processes, use
[`@univer-cli/univer-collaboration-runtime-pool`](./package-univer-collaboration-runtime-pool.md).
This package does not provide Commander commands, a pool, workers, a daemon, a target-to-key algorithm, or an authentication strategy.
