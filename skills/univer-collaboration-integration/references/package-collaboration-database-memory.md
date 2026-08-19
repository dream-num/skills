<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-database-memory

English | [简体中文](./package-collaboration-database-memory.zh-CN.md)

An in-process `IDatabaseAdapter` for tests, local development, and temporary collaboration services.

## Create the Adapter

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-database-memory
```

```ts
import { MemoryDatabaseAdapter } from '@univerjs-pro/collaboration-database-memory';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });

await service.dispose();
await database.dispose();
```

Pass the Adapter to `UniverCollabService` as `dbAdapter`.

It follows the same collaboration persistence contract as the SQLite Adapter, including revision CAS, `(unitID, sid, reqId)` idempotency, revisioned snapshots, Sheet blocks, and atomic Unit lifecycle batches.

## Limitations

- All data is lost when the process exits.
- State is not shared between Node.js processes.
- It is intended only for tests and temporary environments, not persistent production data.
- Hard delete removes core Unit data from the current process and retains a permanent deletion marker that prevents ID reuse.
