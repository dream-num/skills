<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/generic-keyed-instance-pool

English | 简体中文

Create, exclusively lease, cache, and recycle stateful instances by an opaque key supplied by the application.

It is intended for objects that are expensive to create, reused by key, restricted to one caller at a time, and explicitly destroyed, such as browsers, database sessions, or headless runtimes. Stateless objects and objects that can be shared safely across concurrent callers do not need this pool.

## Installation

```bash
pnpm add @univer-cli/generic-keyed-instance-pool
```

Requires Node.js 22.12 or higher.

## Quick Start

```ts
import {
  createGenericKeyedInstancePool,
  type ManagedInstanceFactory,
} from "@univer-cli/generic-keyed-instance-pool";

interface Client {
  close(): Promise<void>;
  query(): Promise<string>;
}

const factory: ManagedInstanceFactory<Client, { url: string }> = {
  async create({ init }) {
    return createClient(init.url);
  },
  async destroy({ instance }) {
    await instance.close();
  },
};

const pool = createGenericKeyedInstancePool({
  factory,
  cache: {
    idleTtlMs: 60_000,
    maxEntries: 20,
  },
});

const lease = await pool.acquire({
  key: "server-a",
  init: { url: "https://example.com" },
});

try {
  console.log(await lease.instance.query());
} catch (error) {
  await lease.invalidate();
  throw error;
} finally {
  await lease.release();
}

await pool.close();
```

## Lifecycle guarantees

- The first creation for a key is single-flight, preventing duplicate instances from being created concurrently.
- An instance is only handed over to one lease at a time.
- Callers waiting for the same key acquire the lease in FIFO order.
- After normal release, the instance can enter the idle cache.
- Invalidation marks an instance as unsafe to reuse, so it is destroyed during release.
- TTL and LRU only recycle idle instances and do not interrupt active leases.
- `close()` rejects new acquisitions, waits for or terminates remaining lifecycle work, and destroys cached instances.

The key is used only for equality checks and events; the package never interprets it. The caller must ensure that a key always maps to compatible initialization data. The pool does not define the application's target-to-key algorithm.

## Failures and observability

Create, destroy, wait-cancellation, and pool-close failures are exposed as `InstancePoolError`. Event callbacks provide visibility into creation, acquisition, release, eviction, and destruction without exposing the internal cache.

## Responsibility boundaries

This package provides only the in-process lifecycle for raw instances. It does not provide workers, IPC, RPC, method proxies, business operations, or cross-process sharing. For collaboration runtimes hosted in workers, use
`@univer-cli/univer-collaboration-runtime-pool`.
