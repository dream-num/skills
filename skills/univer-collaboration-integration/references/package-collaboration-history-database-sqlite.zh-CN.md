<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-database-sqlite

[English](./package-collaboration-history-database-sqlite.md) | [简体中文](./package-collaboration-history-database-sqlite.zh-CN.md)

面向 `@univerjs-pro/collaboration-history-service` 的持久化 SQLite
`IHistoryDatabaseAdapter`。它使用稳定的 `libsql` 同步接口，支持 Node.js 22 及以上，
并可与 core、Comment 和 Worktree SQLite Adapter 共用一个数据库文件。

## 安装与使用

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

调用方必须预先创建数据库父目录，并在 Service 停止后释放 Adapter。

## 存储契约

- History 数据使用 `collaboration_history_revisions`。
- schema 版本 `('history', 1)` 记录在共享的
  `collaboration_schema_versions`，不占用 `PRAGMA user_version`。
- 空 History schema 自动初始化；不完整或不支持的 schema 会被拒绝，不执行 migration
  或 legacy fallback。

History 是派生索引。协同 core hard delete 不会自动删除 History；需要跨模块清理时由应用
统一协调。
