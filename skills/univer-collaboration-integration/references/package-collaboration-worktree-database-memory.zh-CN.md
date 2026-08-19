<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-database-memory

[English](./package-collaboration-worktree-database-memory.md) | [简体中文](./package-collaboration-worktree-database-memory.zh-CN.md)

进程内 `IWorktreeDatabaseAdapter`，适合测试、本地开发和临时 Worktree 数据。

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

它实现 Worktree 状态转换、draft revision CAS、幂等提交和逐 Unit merge result 契约。

进程退出后所有 Worktree 数据丢失，多个 Node.js 进程之间也不共享状态。持久化生产数据
应使用 SQLite 或其他持久化 Adapter。
