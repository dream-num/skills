<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-endpoint

提供 Worktree 管理 API，并接收限定到具体 Worktree 的 Univer 协同请求。它使用
`UniverCollabWorktreeService` API 处理 Worktree 管理和协同数据操作。

## 安装与注册

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-endpoint \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node
```

Worktree Endpoint 和 trunk Endpoint 需要共享同一个 `ticketStore`：

```ts
const ticketStore = new MemorySessionTicketStore();
const trunkEndpoint = new UniverCollabEndpoint(collabService, { ticketStore });
const worktreeEndpoint = new UniverCollabWorktreeEndpoint(
  worktreeService,
  { ticketStore }
);

transport.use(authenticationMiddleware);
transport.register(trunkEndpoint);
transport.register(worktreeEndpoint);
```

认证 middleware 必须先为 HTTP 请求设置 `ctx.userID`。除共享同一个 `ticketStore` 实例外，
无需额外关联两个 Endpoint；每条 WebSocket 连接仍使用独立的一次性 ticket。

## 前端会获得什么

- 一组用于创建、读取、ready、reopen、discard、merge 和预览的 Worktree HTTP API。
- 每个 Worktree 独立的 snapshot、changeset、ACK、广播和 Presence 通道。
- Worktree 状态变化的 `/events` WebSocket，便于产品 UI 刷新 ready/merged 等状态。

应用不需要自己把 `worktreeID` 塞进 changeset 或 room ID。浏览器只配置目标 Worktree，
Endpoint 从 URL 取得 `worktreeID` 并保持不同 Worktree 之间的数据和实时房间隔离。

## Worktree 协议路径

协议位于 `/universer-api/worktrees/:worktreeID`。一条协同 WebSocket 只属于一个
Worktree；即使 `unitID` 相同，不同 Worktree 的编辑和在线成员也彼此隔离。Worktree 状态
变化通过独立 `/events` WebSocket 发送，不向协同 WebSocket 注入未知事件。

管理 API：

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/universer-api/worktrees` | 创建 Worktree |
| `GET` | `/universer-api/worktrees/:worktreeID` | 读取完整 Worktree 状态 |
| `POST` | `/universer-api/worktrees/:worktreeID/units` | 加入已有 trunk Unit |
| `POST` | `/universer-api/worktrees/:worktreeID/units/from-snapshot` | 从 protocol snapshot 创建 draft Unit |
| `POST` | `/universer-api/worktrees/:worktreeID/units/from-data` | 从 Univer Unit data 创建 draft Unit |
| `GET` | `/universer-api/worktrees/:worktreeID/units/:unitID/merge-preview` | 评估单 Unit 合入 |
| `POST` | `/universer-api/worktrees/:worktreeID/ready` | 冻结各 Unit 当前的 draft revision |
| `POST` | `/universer-api/worktrees/:worktreeID/reopen` | 重新进入 draft |
| `POST` | `/universer-api/worktrees/:worktreeID/merge` | 逐 Unit 合入 trunk |
| `POST` | `/universer-api/worktrees/:worktreeID/discard` | 丢弃 Worktree |

实时和协同通道：

| 通道 | Path | 用途 |
| --- | --- | --- |
| HTTP | `/universer-api/worktrees/:worktreeID/snapshot/...` | 读取该 Worktree 的 snapshot、blocks 和缺失 changesets |
| HTTP | `/universer-api/worktrees/:worktreeID/comb/...` | 向该 Worktree 提交 changeset |
| WebSocket | `/universer-api/worktrees/:worktreeID/comb/connect` | 该 Worktree 的 Session、房间、Presence、ACK 和广播 |
| WebSocket | `/universer-api/worktrees/:worktreeID/events` | 推送完整 `WorktreeData` 状态 |

URL 是 `worktreeID` 的权威来源。`merge-preview` 只在 `ready` 状态评估一个 Unit，使用
`Cache-Control: no-store`，不执行正式 merge。

## Middleware

Worktree Endpoint middleware 只控制当前 Worktree 的 Session 和实时房间：

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `connect` | ticket 已消费并创建 Worktree Session，注册协同或 `/events` 连接前 | `worktreeID`、`session`、`connection`、`member` | 每次建连一次；重连再次执行 | 成员展示和连接策略 |
| `joinUnit` | 收到 `JOIN`，Session 加入当前 Worktree 房间前 | `worktreeID`、`session`、`unitID` | 当前 Session 首次 JOIN 时一次；Endpoint 不重试 | Worktree 与 Unit 读取 ACL |
| `receivePresence` | 已 JOIN 的 Session 发送 Presence、向房间广播前 | `worktreeID`、`session`、`unitID`、`payload`、事件级 `customData` | 每条 Presence 一次；Endpoint 不重试 | 校验、限流和过滤 |
| `sendPresence` | Presence 即将发送给当前 Worktree 的一个房间成员 | `worktreeID`、`session`、`unitID`、`payload`、事件级 `customData`、`targetMemberID` | 每个目标成员一次；发送失败不重试 | 按接收者过滤展示数据 |

```ts
worktreeEndpoint.use('joinUnit', async (ctx, next) => {
  if (!await acl.canReadWorktreeUnit(
    ctx.session.userID,
    ctx.worktreeID,
    ctx.unitID
  )) {
    throw new CollabError('PERMISSION_DENIED', 'Cannot join this Worktree Unit');
  }
  await next();
});
```

`joinUnit` 只保护实时房间。Worktree 数据读取、提交和 merge 必须由 Worktree Service
middleware 保护；Service middleware 获取当前 HTTP 请求由 Transport 挂载的
`ctx.userID/customData`。

## 部署与资源释放

实时房间、状态事件和广播当前只保证单 Endpoint 进程。

Transport 释放已注册 Endpoint；Endpoint 不释放 Worktree Service、trunk Service 或
应用传入的 `ticketStore`。
