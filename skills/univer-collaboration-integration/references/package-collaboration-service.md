<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-service

Univer Collaboration 服务端组装中的协同核心，支持 Sheet、Doc、Slide、Board 和 Base。
Service 负责权威 OT、连续 revision、提交幂等、snapshot 和 Unit 生命周期。使用 Univer
Collaboration Client 时，由 `@univerjs-pro/collaboration-endpoint` 根据前端协议调用。

```text
Node Transport
→ UniverCollabEndpoint
→ UniverCollabService
→ IDatabaseAdapter
```

本 README 重点说明 Service middleware、生命周期和高级 API。第一次接入应先按 SDK 用户手册
中的《搭建协同服务》完成 Transport、Endpoint、Service 和 Database Adapter 的组装。

## 安装

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-sqlite \
  @univerjs/protocol
```

Service、Database Adapter 和 Univer SDK 必须使用同一 release cohort 的匹配版本。

## 创建 Service

```ts
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
});
const collabService = new UniverCollabService({ dbAdapter: database });
```

接着用这个 Service 创建 `UniverCollabEndpoint`，再把 Endpoint 注册到
Node Transport。

## Service API

`UniverCollabService` 提供协同数据读取、changeset 提交和 Unit 生命周期 API。通过
Endpoint 接入时，这些 API 由 `UniverCollabEndpoint` 根据前端协议调用：

- `getUnit()`：读取最新或指定 revision。
- `getChangesets()`：读取缺失的 confirmed changesets。
- `submitChangeset()`：提交客户端 changeset。
- `createUnitFromData()`：从 Sheet、Doc、Slide、Board 或 Base 的 Unit data 创建 Unit。
- `createUnit()`：从 Protocol `ISnapshot` 创建 Unit。
- `deleteUnits()`：批量软删除或永久删除。
- `recoverUnits()`：批量恢复软删除 Unit。

`createUnitFromData()` 的 `data.id` 是全局唯一 Unit ID，初始 revision 必须为 `1`；第一条
confirmed changeset 的 revision 为 `2`。单次删除或恢复最多接受
`MAX_UNIT_LIFECYCLE_BATCH_SIZE` 个 Unit，当前为 `100`，整批全有或全无。hard delete 后
Unit 永久不可访问，且相同 ID 不可复用。

## Service middleware

Service middleware 是通用的生命周期扩展点，可用于权限控制、日志和外部系统集成等。
下面以接入 Unit 权限为例。

Service 不定义角色或 ACL 存储。应用在对应的生命周期 middleware 中保护 Unit 读取、创建、
提交、删除和恢复：

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

collabService.use('submitChangeset', async (ctx, next) => {
  const role = await acl.getRole(
    ctx.userID,
    ctx.request.changeset.unitID
  );
  ctx.customData.role = role;

  if (role !== 'owner' && role !== 'editor') {
    throw new CollabError('PERMISSION_DENIED', 'Unit is read-only');
  }
  await next();
});
```

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `readUnitData` | Request 创建后、读取 Adapter 前 | `userID`、`customData`、具体 `request` | 每次 Service API 调用一次 | 读取 ACL、tenant、审计 |
| `createUnit` | 初始 snapshot 准备后、原子创建前 | `userID`、`customData`、`request.snapshot`、`request.sheetBlocks` | 每次创建调用一次 | 创建权限、配额和类型限制 |
| `deleteUnits` | 批次规范化后、调用 Adapter 前 | `userID`、`customData`、`request.unitIDs`、`request.hardDelete` | 每次调用一次；数据库竞态不重复 | 逐 Unit 删除 ACL |
| `recoverUnits` | 批次规范化后、调用 Adapter 前 | `userID`、`customData`、`request.unitIDs` | 每次调用一次；数据库竞态不重复 | 逐 Unit 恢复 ACL |
| `submitChangeset` | 逻辑提交 Request 创建后、幂等与 OT 前 | `userID`、`memberID`、`customData`、`request` | 每次逻辑提交一次；数据库 revision 冲突重试时不重复 | 编辑 ACL、大小限制和 trace |
| `applyChangeset` | changeset 已通过 OT 与当前 revision 对齐、应用到待提交 Unit 状态前 | `userID`、`memberID`、`customData`、`request`、`changeset`、`currentRevision`、`attempt` | 数据库 revision 冲突后重复 | 对齐后的 mutation 检查 |
| `commitChangeset` | changeset 已应用到待提交 Unit 状态、Adapter 检查 revision 并写入前 | `userID`、`memberID`、`customData`、`request`、`changeset`、`expectedHeadRevision`、`attempt` | 数据库 revision 冲突后重复 | 最终 revision 检查和指标 |

`applyChangeset` 和 `commitChangeset` 必须可重试。不可回滚的提交后副作用应放进对应 event
或由具体 Database Adapter 使用 transactional outbox。

Endpoint 调用 Service 时，会把 Transport middleware 建立的当前 HTTP
`userID/customData` 传入 Service，所以 Service middleware 可以读取认证用户、tenant、trace
和请求级 ACL 缓存。

## 身份与 customData

- `userID`：应用提供的身份字符串和 confirmed changeset 作者，Service 不解释其业务含义。
- `memberID`：在线 WebSocket Session 的成员 ID；只有 submit 等需要关联实时成员的调用传入。
- `(unitID, sid, reqId)`：客户端提交幂等键。
- `context.customData`：只属于当前 Service 调用，适合 trace、ACL 缓存和计时。

普通方法接收 `CollabContext`；`submitChangeset()` 接收额外包含 `memberID` 的
`CollabMemberContext`。同一次调用的 middleware 可以通过 `ctx.customData` 共享 trace、
ACL 查询结果或计时数据；这些内容不会自动持久化、记录日志或发送给客户端。

## 能力边界与资源释放

Service 不提供 HTTP、WebSocket、房间、Presence、用户、登录、ACL 存储、文件管理或分享。
在服务端组装中，这些能力由 Transport、Endpoint 和应用自己提供。

应用拥有注入的 Database Adapter。停止时先释放 Service，再释放 Adapter：

```ts
await collabService.dispose();
await database.dispose();
```

## 高级集成：封装应用 API

应用也可以直接使用 Service API 封装自己的 HTTP/RPC 接口和业务编排。调用方需要自己
建立 `CollabContext`，并承担身份、对外协议和错误映射边界。

例如，在已有 Express `app` 上提供应用接口 `POST /api/units`，并复用前文创建的
`collabService`：

```bash
pnpm add express
pnpm add -D @types/express
```

```ts
import { randomUUID } from 'node:crypto';
import { json } from 'express';
import { UniverType } from '@univerjs/protocol';

app.post('/api/units', json({ limit: '1mb' }), async (request, response, next) => {
  try {
    const user = response.locals.user as { readonly userId: string };
    const workbookData = request.body.data;
    const unitID = randomUUID();

    const result = await collabService.createUnitFromData(
      {
        type: UniverType.UNIVER_SHEET,
        data: { ...workbookData, id: unitID, rev: 1 },
      },
      {
        userID: user.userId,
        customData: { traceId: randomUUID() },
      }
    );

    response
      .status(result.status === 'created' ? 201 : 200)
      .json(result);
  } catch (error) {
    next(error);
  }
});
```

`POST /api/units` 是应用自己的 API，不是 Univer Collaboration Client 使用的协议路由。
示例假设 Express 认证 middleware 已设置 `response.locals.user`；应用还应校验
`request.body.data`，并在 error middleware 中把 `CollabError` 映射为应用 API 响应。需要
应用记录或 owner ACL 时，应在同一业务流程中显式创建并处理失败补偿。

## 高级集成：后台任务直接提交 changeset

后台任务也可以直接读取 Unit 的最新 revision，再调用 `submitChangeset()`。下面假设
`task` 是任务系统提供的当前任务，`task.id` 在重试时保持不变，`task.mutations` 已按 Univer
支持的 mutation 格式构造：

```ts
const context = {
  userID: task.userID,
  memberID: `background:${task.id}`,
  customData: { taskID: task.id },
};

const current = await collabService.getUnit(
  {
    unitID: task.unitID,
    type: task.type,
    revision: 0,
  },
  context
);

const result = await collabService.submitChangeset(
  {
    changeset: {
      unitID: task.unitID,
      type: task.type,
      baseRev: current.headRevision,
      revision: current.headRevision + 1,
      sid: `background:${task.id}`,
      reqId: 1,
      userID: context.userID,
      memberID: context.memberID,
      mutations: task.mutations,
    },
  },
  context
);

if (result.status === 'rejected' || result.status === 'retry') {
  throw result.error;
}
```

`sid/reqId` 是提交幂等键，任务重试时必须复用相同值。`memberID` 只表示这次提交的来源；
后台任务不需要创建 WebSocket Session，Service 也不会检查该成员是否在线。

`collabService` 本身不感知网络，也不直接发送 WebSocket 消息。创建
`UniverCollabEndpoint` 时，Endpoint 会监听同一个 `collabService` 的
`changesetCommitted` event。后台任务提交成功后，Endpoint 会把 confirmed changeset
广播给当前进程中已经 JOIN 该 Unit 的在线客户端。由于后台任务的 `memberID` 不对应在线
Session，不会排除某个提交者，因此这些客户端都会实时收到变更。

这个事件监听只在当前进程、当前 Service 实例内生效。如果后台任务运行在其他进程，或使用
另一个 `UniverCollabService` 实例，数据库提交仍然正确，但当前 Endpoint 不会自动收到广播
事件；客户端随后可以通过缺失 changesets 恢复。
