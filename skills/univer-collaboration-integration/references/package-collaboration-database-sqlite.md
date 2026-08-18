<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-database-sqlite

持久化 SQLite `IDatabaseAdapter`，使用稳定的 `libsql` 同步接口，支持 Node.js 22
及以上版本。

## 创建 Adapter

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-database-sqlite
```

调用方需要先创建数据库父目录：

```ts
import { mkdir } from 'node:fs/promises';
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

await mkdir('./data', { recursive: true });

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
const service = new UniverCollabService({ dbAdapter: database });

await service.dispose();
await database.dispose();
```

将 Adapter 作为 `dbAdapter` 传给 `UniverCollabService`。

## 持久化保证

Adapter 使用 foreign keys 和 `BEGIN IMMEDIATE` 写事务，保证：

- 初始 snapshot 与 Sheet blocks 原子创建；
- revision CAS 与 `(unitID, sid, reqId)` 提交幂等；
- snapshot 依赖完整后才对新读取可见；
- 软删除、恢复和 hard delete 批次全有或全无；
- hard delete 保留永久删除标记，禁止 Unit ID 复用。

它只保存协同核心数据。产品资源、用户、ACL、History、Comment 和 Worktree 分别由应用
或对应 Adapter 管理。

## SQLite 行为

- 不主动修改 `journal_mode`；需要 WAL、checkpoint 或备份策略时由应用在打开前配置。
- 核心表使用 `collaboration_` 前缀。
- schema 版本以 `('core', 1)` 写入 `collaboration_schema_versions`，不占用
  `PRAGMA user_version`。
- 空库会自动初始化；不完整或不支持的核心 schema 会被拒绝，不执行 migration 或旧版
  fallback。

本实现适合本地应用和中小规模单 Node 部署。多个 Service 实例共享数据库文件时，
revision CAS 仍能保证协同数据正确性。
