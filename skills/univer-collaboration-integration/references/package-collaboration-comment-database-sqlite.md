<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-database-sqlite

English | [简体中文](./package-collaboration-comment-database-sqlite.zh-CN.md)

A persistent SQLite `ICommentDatabaseAdapter` for `@univerjs-pro/collaboration-comment-service`. It uses the stable synchronous `libsql` API, supports Node.js 22 and later, and can share a database file with the core, History, and Worktree SQLite Adapters.

## Installation and usage

```bash
pnpm add \
  @univerjs-pro/collaboration-comment-service \
  @univerjs-pro/collaboration-comment-database-sqlite
```

```ts
const commentDatabase = new SQLiteCommentDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
const commentService = new UniverCommentService({
  database: commentDatabase,
});

await commentService.dispose();
await commentDatabase.dispose();
```

The caller must create the database parent directory in advance and dispose the Adapter after stopping the Service.

## Storage contract

- Comment data is stored in `collaboration_comments`.
- Schema version `('comment', 1)` is stored in shared `collaboration_schema_versions`; `PRAGMA user_version` is not used.
- Compound checks and writes use SQLite transactions. Deletes use a non-reusable concurrency version to avoid overwriting newer data.
- An empty Comment schema is initialized automatically. Incomplete or unsupported schemas are rejected without migration or legacy fallback.

Comment tables are independent of core snapshots and changesets. A core hard delete does not automatically clean up Comments; the application must coordinate cross-module cleanup when required.
