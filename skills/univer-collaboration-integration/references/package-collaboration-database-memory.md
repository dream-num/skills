<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-database-memory

进程内 `IDatabaseAdapter`，适合测试、本地开发和临时协同服务。

## 创建 Adapter

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-database-memory
```

```ts
import { MemoryDatabaseAdapter } from '@univerjs-pro/collaboration-database-memory';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });

await service.dispose();
await database.dispose();
```

将 Adapter 作为 `dbAdapter` 传给 `UniverCollabService`。

它与 SQLite Adapter 遵守相同的协同持久化契约，包括 revision CAS、
`(unitID, sid, reqId)` 幂等、revisioned snapshot、Sheet blocks 和原子 Unit
生命周期批次。

## 限制

- 进程退出后全部数据丢失。
- 多个 Node.js 进程之间不共享状态。
- 只适合测试和临时环境，不适合持久化生产数据。
- hard delete 会清理当前进程中的核心 Unit 数据，并保留永久删除标记以禁止 ID 复用。
