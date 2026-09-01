<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-service

可选的 Univer 版本历史 Service，负责把 confirmed collaboration revisions 分组为面向
用户的历史条目、补全创建者资料，并提供 History Endpoint 使用的服务契约。

History 是派生索引；协同 Service 保存的 confirmed changesets 才是 Unit 状态的权威来源。

```text
Transport
→ UniverHistoryEndpoint
→ UniverHistoryService
→ History Database Adapter
```

## 安装与创建

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-history-service \
  @univerjs-pro/collaboration-history-endpoint \
  @univerjs-pro/collaboration-history-database-sqlite
```

```ts
import { SQLiteHistoryDatabaseAdapter } from '@univerjs-pro/collaboration-history-database-sqlite';
import {
  DefaultHistoryPolicy,
  UniverHistoryService,
} from '@univerjs-pro/collaboration-history-service';

const historyDatabase = new SQLiteHistoryDatabaseAdapter({
  filename: './data/collaboration.sqlite',
});
const historyService = new UniverHistoryService({
  collabService,
  dbAdapter: historyDatabase,
  policy: new DefaultHistoryPolicy({ timeIntervalMs: 60_000 }),
  userProvider: {
    async getUsers(userIDs) {
      return applicationUsers.findMany(userIDs);
    },
  },
});

const attachment = historyService.attach(collabService);
```

`attach()` 监听 Unit 创建和 confirmed changeset。默认策略按约 60 秒和 restore 等特殊
mutation 分段，而不是每条 changeset 生成一个历史项。未传 `dbAdapter` 时 Service 会拥有
一个内存 Adapter，只适合测试或临时环境。

## History middleware

History 不继承主 Collaboration Service 的 middleware。五个 action 分别保护读取和索引：

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `getHistoryList` | Request 创建后、读取 History Adapter 前 | `userID`、`customData`、`request` | 每次 API 调用一次 | Unit 读取 ACL、分页审计 |
| `listHistoryCreators` | Request 创建后、读取创建者索引前 | `userID`、`customData`、`request` | 每次 API 调用一次 | Unit 读取 ACL |
| `getHistoryChangesets` | Request 创建后、读取索引和 core changesets 前 | `userID`、`customData`、`request` | 每次 API 调用一次 | Unit 读取 ACL、revision 范围限制 |
| `indexUnitCreated` | 创建索引 Request 后、写 revision 1 索引数据前 | `userID`、`customData`、`request` | 每次逻辑索引一次；协同数据库 revision 冲突重试时不重复 | 索引范围、tenant 和审计 |
| `indexChangeset` | changeset 索引 Request 创建后、写索引数据前 | `userID`、`customData`、`request` | 每次逻辑索引一次；协同数据库 revision 冲突重试时不重复 | 索引过滤、tenant 和审计 |

```ts
historyService.use('getHistoryList', async (ctx, next) => {
  if (!await acl.canRead(ctx.userID, ctx.request.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'History is not accessible');
  }
  await next();
});
```

User Provider 只补全展示用户，不是鉴权边界。

应用直接读取 History Service 时，SDK 自有结果字段使用 `userID/userIDs/unitID`；
`UniverHistoryEndpoint` 会在 HTTP 协议边界自动映射为前端协议所需的
`userId/userIds/unitId`。使用 History Client 时无需手动转换。

## 可靠性与资源释放

便捷的 `attach()` 在进程内更新索引，但不保证每次更新都完成；失败不影响已提交的协同
数据。若应用要求索引严格不丢失，应在协同提交事务中写 transactional outbox，再由可重复
执行的后台任务调用 `indexUnitCreated()` 或
`indexChangeset()`。

```ts
attachment.dispose();
await historyService.dispose();
await collabService.dispose();
await historyDatabase.dispose();
```

History Service 不会释放应用注入的 Database Adapter。
