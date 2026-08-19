<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-collaboration-runtime-pool

English | 简体中文

Create, exclusively lease, cache, and recycle `UniverCollaborationRuntime` instances in separate worker processes by an application-owned opaque key.

This lets multiple short tasks reuse expensive runtimes while isolating Univer and native/runtime state in workers. If you need only one runtime in the current process, use `@univer-cli/univer-collaboration-runtime` directly.

## Installation

```bash
pnpm add @univer-cli/univer-collaboration-runtime-pool
```

Requires Node.js 22.12 or higher. Worker entry must be the built JavaScript ESM file and cannot point to TypeScript source.

## Worker entry

The worker creates the backend in the process that hosts the runtime, reads credentials, and constructs Univer:

```ts
import { defineUniverCollaborationRuntimeWorker } from "@univer-cli/univer-collaboration-runtime-pool";

export default defineUniverCollaborationRuntimeWorker({
  async createRuntime(init) {
    return createRuntimeFromApplicationInit(init);
  },
});
```

Initialization data must be compatible with structured clone. The worker can read credentials directly from the environment or secure storage, avoiding the need to route remote Snapshots, changesets, and blocks through a daemon or parent process.

## Use pool

```ts
import { createUniverCollaborationRuntimePool } from "@univer-cli/univer-collaboration-runtime-pool";

const pool = createUniverCollaborationRuntimePool({
  entry: new URL("./worker.js", import.meta.url),
});

const lease = await pool.acquire({
  key: "server-a:book-1:sheet",
  init: { unitId: "book-1", unitType: "sheet" },
});

try {
  await lease.pull();
  const result = await lease.execute({ mode: "read", code: "return workbook.getId();" });
  console.log(result.value);
} catch (error) {
  await lease.invalidate();
  throw error;
} finally {
  await lease.release();
}

await pool.close();
```

The lease proxies the collaboration runtime's complete public interface, so callers do not need to design RPC methods.

## Pool behavior

Creation for a key is single-flight, and leases for the same key are granted in FIFO order. Idle runtimes can be evicted by TTL and LRU; idle eviction never interrupts an active lease. Invalidation marks a worker/runtime as untrustworthy, so it is destroyed during release. Pool events can feed logs and metrics.

The application defines both key and initialization data. The pool knows nothing about Workspace, Worktree, URLs, authentication, or target-to-key algorithms, and does not verify whether two initialization values for the same key are semantically compatible.

## Mutation transport

Mutation replacements transferred across workers preserve the collaboration runtime's structured contract. Values unsupported by structured clone fail at the boundary. Business logic should not depend on the internal worker protocol or serialization format.

## Responsibility boundaries

The package owns worker lifecycle, runtime proxies, leases, and caching. It does not define daemon methods, Commander commands, backends, or remote data-loading workflows.
