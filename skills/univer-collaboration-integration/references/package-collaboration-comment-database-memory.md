<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-database-memory

进程内 `ICommentDatabaseAdapter`，适合测试、本地开发和临时 Thread Comment Service。

```bash
pnpm add \
  @univerjs-pro/collaboration-comment-service \
  @univerjs-pro/collaboration-comment-database-memory
```

```ts
const database = new MemoryCommentDatabaseAdapter();
const commentService = new UniverCommentService({ database });

await commentService.dispose();
await database.dispose();
```

Adapter 按 Unit 串行操作，并实现与 SQLite Adapter 相同的并发版本检查。

进程退出后所有评论丢失，多个 Node.js 进程也不共享状态。持久化生产数据应使用 SQLite
或其他持久化 Adapter。
