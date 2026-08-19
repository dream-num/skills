<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-database-sqlite

English | [简体中文](./package-collaboration-worktree-database-sqlite.zh-CN.md)

A persistent SQLite `IWorktreeDatabaseAdapter` for `@univerjs-pro/collaboration-worktree-service`. It uses the stable synchronous `libsql` API and supports Node.js 22 and later.

## Installation and usage

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-database-sqlite
```

```ts
const worktreeDatabase = new SQLiteWorktreeDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
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

The caller must create the database parent directory in advance and dispose the Adapter after stopping Worktree Service.

## Storage contract

- Tables use the `collaboration_worktree_*` prefix.
- Schema version `('worktree', 1)` is stored in shared `collaboration_schema_versions`; `PRAGMA user_version` is not used.
- It can share a database file with trunk, Comment, and History SQLite Adapters.
- State transitions, draft CAS, and merge results use SQLite transactions for atomicity.
- An empty Worktree schema is initialized automatically. Incomplete or unsupported schemas are rejected without migration or legacy fallback.

Worktree Adapter does not own trunk collaboration data and does not manage Worktree names, list discovery, ACLs, or product-resource extension data for the application.
