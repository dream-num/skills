<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-database-sqlite

English | [简体中文](./package-collaboration-database-sqlite.zh-CN.md)

A persistent SQLite `IDatabaseAdapter` using the stable synchronous `libsql` API. Requires Node.js 22 or later.

## Create the Adapter

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-database-sqlite
```

The caller must create the database parent directory first:

```ts
import { mkdir } from 'node:fs/promises';
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

await mkdir('./data', { recursive: true });

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
const service = new UniverCollabService({ dbAdapter: database });

await service.dispose();
await database.dispose();
```

Pass the Adapter to `UniverCollabService` as `dbAdapter`.

## Persistence guarantees

The Adapter uses foreign keys and `BEGIN IMMEDIATE` write transactions to guarantee:

- atomic creation of the initial snapshot and Sheet blocks;
- revision CAS and `(unitID, sid, reqId)` submission idempotency;
- a snapshot becomes visible to new reads only after all of its dependencies are complete;
- soft-delete, recovery, and hard-delete batches are all-or-nothing;
- hard delete keeps a permanent deletion marker that prevents Unit ID reuse.

It stores only core collaboration data. Product resources, users, ACLs, History, Comment, and Worktree are managed by the application or their respective Adapters.

## SQLite behavior

- It does not change `journal_mode`; configure WAL, checkpointing, or backup policy before opening the Adapter when needed.
- Core tables use the `collaboration_` prefix.
- Schema version `('core', 1)` is stored in `collaboration_schema_versions`; `PRAGMA user_version` is not used.
- An empty database is initialized automatically. Incomplete or unsupported core schemas are rejected without migration or legacy fallback.

This implementation suits local applications and small-to-medium single-Node deployments. Revision CAS still preserves collaboration-data correctness when multiple Service instances share the database file.
