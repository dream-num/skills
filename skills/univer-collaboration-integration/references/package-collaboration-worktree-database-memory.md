<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-database-memory

English | [简体中文](./package-collaboration-worktree-database-memory.zh-CN.md)

An in-process `IWorktreeDatabaseAdapter` for tests, local development, and temporary Worktree data.

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-database-memory
```

```ts
const worktreeDatabase = new MemoryWorktreeDatabaseAdapter();
const worktreeService = new UniverCollabWorktreeService({
  trunk: {
    service: collabService,
    dbAdapter: trunkDatabase,
  },
  dbAdapter: worktreeDatabase,
});

await worktreeService.dispose();
await worktreeDatabase.dispose();
```

It implements Worktree state transitions, draft revision CAS, idempotent submissions, and per-Unit merge-result contracts.

All Worktree data is lost when the process exits, and state is not shared between Node.js processes. Use SQLite or another persistent Adapter for persistent production data.
