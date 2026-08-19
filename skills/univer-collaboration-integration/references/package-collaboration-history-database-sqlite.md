<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-database-sqlite

English | [简体中文](./package-collaboration-history-database-sqlite.zh-CN.md)

A persistent SQLite `IHistoryDatabaseAdapter` for `@univerjs-pro/collaboration-history-service`. It uses the stable synchronous `libsql` API, supports Node.js 22 and later, and can share a database file with the core, Comment, and Worktree SQLite Adapters.

## Installation and usage

```bash
pnpm add \
  @univerjs-pro/collaboration-history-service \
  @univerjs-pro/collaboration-history-database-sqlite
```

```ts
const historyDatabase = new SQLiteHistoryDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
const historyService = new UniverHistoryService({
  collabService,
  dbAdapter: historyDatabase,
});

historyService.attach(collabService);

await historyService.dispose();
await historyDatabase.dispose();
```

The caller must create the database parent directory in advance and dispose the Adapter after stopping the Service.

## Storage contract

- History data uses `collaboration_history_revisions`.
- Schema version `('history', 1)` is stored in shared `collaboration_schema_versions`; `PRAGMA user_version` is not used.
- An empty History schema is initialized automatically. Incomplete or unsupported schemas are rejected without migration or legacy fallback.

History is a derived index. A core collaboration hard delete does not automatically delete History; the application must coordinate cross-module cleanup when required.
