<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-database-sqlite

面向 `@univerjs-pro/collaboration-comment-service` 的持久化 SQLite
`ICommentDatabaseAdapter`。它使用稳定的 `libsql` 同步接口，支持 Node.js 22 及以上，
并可与 core、History 和 Worktree SQLite Adapter 共用数据库文件。

## 安装与使用

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

调用方必须预先创建数据库父目录，并在 Service 停止后释放 Adapter。

## 存储契约

- Comment 数据保存在 `collaboration_comments`。
- schema 版本 `('comment', 1)` 记录在共享的
  `collaboration_schema_versions`，不占用 `PRAGMA user_version`。
- 复合检查与写入使用 SQLite transaction；删除时使用不可复用的并发版本防止覆盖新数据。
- 空 Comment schema 自动初始化；不完整或不支持的 schema 会被拒绝，不执行 migration
  或 legacy fallback。

Comment 表独立于 core snapshot/changeset。core hard delete 不会自动清理 Comment；需要
跨模块清理时由应用统一协调。
