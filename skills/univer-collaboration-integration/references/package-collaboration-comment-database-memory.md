<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-database-memory

English | [简体中文](./package-collaboration-comment-database-memory.zh-CN.md)

An in-process `ICommentDatabaseAdapter` for tests, local development, and temporary Thread Comment Services.

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

The Adapter serializes operations per Unit and implements the same concurrency-version checks as the SQLite Adapter.

All comments are lost when the process exits, and state is not shared between Node.js processes. Use SQLite or another persistent Adapter for persistent production data.
