<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-endpoint

`UniverCollabEndpoint` 是 Univer Collaboration 服务端的协议层。它接收 Node Transport 分派的 HTTP 请求和 WebSocket 消息，使用 `UniverCollabService` API 读写协同数据，并管理 Session、Unit 房间、Presence、ACK 和广播。

```text
Node HTTP server
→ Transport                  应用认证，挂载 ctx.userID 和 ctx.customData
→ UniverCollabEndpoint       HTTP/WebSocket 协议、Session 和实时房间
→ UniverCollabService        数据读取、changeset 提交和 Unit 生命周期
→ Database Adapter           snapshot、changeset 和 revision 持久化
```

Endpoint 通过 `transport.register()` 注册到 `@univerjs-pro/collaboration-transport-node`，
不需要单独启动 HTTP 或 WebSocket server。

## 服务端组装

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-memory
```

```ts
import { MemoryDatabaseAdapter } from '@univerjs-pro/collaboration-database-memory';
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';
import { createNodeTransport } from '@univerjs-pro/collaboration-transport-node';

const database = new MemoryDatabaseAdapter();
const collabService = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(collabService);
const transport = createNodeTransport();

// 应用先在 Transport middleware 中认证 HTTP 请求并挂载身份。
transport.use(async (ctx, next) => {
  const user = await authenticate(ctx.incomingMessage);
  if (!user) {
    ctx.response.statusCode = 401;
    ctx.response.end('Authentication required');
    return;
  }

  ctx.userID = user.userId;
  ctx.customData.user = user;
  await next();
});

// Endpoint 必须注册在认证 middleware 之后。
transport.register(endpoint);
```

这里使用 Memory Adapter 保持示例最小，进程退出后数据会丢失。Node HTTP server 和 WebSocket upgrade 的挂载方式见 `@univerjs-pro/collaboration-transport-node` README。

全部 Collaboration 与 Univer 前端 package 应使用同一 release cohort 的匹配版本。

## 两类请求

Endpoint 处理的协议可以先分成两组：文档数据请求和实时 Session。两组请求使用不同的 middleware 和上下文。

### 文档数据请求

snapshot、block、fetch-missing、new-changes 和 Unit delete/recover 都是 HTTP 请求。它们使用当前 HTTP 请求中由 Transport middleware 挂载的身份和自定义数据：

```text
HTTP snapshot / block / fetch-missing / new-changes / delete / recover
→ Transport middleware 设置 ctx.userID 和 ctx.customData
→ Endpoint 解析协议并调用 UniverCollabService API
→ Service middleware 通过 ctx.userID 和 ctx.customData 读取
→ Service / Database Adapter
```

Service middleware 获取的是当前 HTTP 请求中由 Transport middleware 挂载的 `ctx.userID` 和
`ctx.customData`，可用于权限控制、日志和外部系统集成等。下面以读取权限为例。

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

collabService.use('readUnitData', async (ctx, next) => {
  // ctx.userID 和 ctx.customData 来自当前 HTTP 请求的 Transport middleware。
  if (!await acl.canRead(ctx.userID, ctx.request.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is not accessible');
  }

  await next();
});
```

`readUnitData` 保护 snapshot、block 和 fetch-missing。new-changes 和 Unit delete/recover 分别使用 Service 的 `submitChangeset`、`deleteUnits` 和 `recoverUnits` action。

### 实时 Session

session-ticket 和 WebSocket open、HELLO、HEARTBEAT、JOIN、LEAVE、Presence 属于实时 Session 流程：

```text
GET /universer-api/user/session-ticket
→ Transport middleware 设置 ctx.userID 和 ctx.customData
→ Endpoint 在服务端保存关联，返回一次性 opaque ticket
→ WebSocket handshake 消费 ticket；无效 ticket 在升级前返回 HTTP 401
→ Endpoint 创建 Session { userID, memberID, customData }
→ Endpoint middleware 通过 ctx.session 读取
```

ticket 字符串本身不包含 `userID` 或 `customData`。在所有 HTTP 路由中，只有 session-ticket 请求会在 WebSocket 建连时把当前 `ctx.userID` 和 `ctx.customData` 带入 Session。

Endpoint middleware 通过 `ctx.session.userID` 和 `ctx.session.customData` 读取这些数据。`memberID` 由 Endpoint 为每个 WebSocket Session 生成，重连后会变化。

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

endpoint.use('joinUnit', async (ctx, next) => {
  // ctx.session.userID 和 ctx.session.customData 来自 session-ticket HTTP 请求。
  if (!await acl.canRead(ctx.session.userID, ctx.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is not accessible');
  }

  await next();
});
```

### `new-changes` 连接两组请求

new-changes 是 HTTP 文档数据请求，但它的 ACK 和广播通过 WebSocket 投递：

```text
HTTP new-changes { memberID }
→ Endpoint 使用 memberID 查找在线 Session
→ 验证 session.userID === 当前 HTTP ctx.userID
→ 验证 Session 已 JOIN 目标 Unit
→ 使用当前 HTTP 请求的 ctx.userID 和 ctx.customData 调用 Service
→ 通过 WebSocket 发送 ACK 和广播
```

`memberID` 只用于定位 WebSocket Session，不能单独作为身份凭据。这些关联和校验由 Endpoint 完成，应用不需要自己处理。

## Middleware

Endpoint 提供以下四个实时协议 middleware action。文档数据请求使用的 Service middleware 已在上一节说明，具体 action 见 `@univerjs-pro/collaboration-service` README。

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `connect` | 消费 ticket 并创建 Session 后，处理 `HELLO` 前 | `session`、`connection`、`member` | 每次建连一次；重连会再次执行 | 连接策略、补充成员名称和头像 |
| `joinUnit` | 收到 `JOIN` 后，Session 加入房间前 | `session`、`unitID` | 当前 Session 首次 JOIN 时一次；Endpoint 不重试 | 房间读取 ACL |
| `receivePresence` | 已 JOIN 的 Session 发送 Presence 后、向房间广播前 | `session`、`unitID`、`payload`、`customData` | 每条 Presence 一次；Endpoint 不重试 | 校验、限流和过滤 Presence |
| `sendPresence` | Presence 即将发送给某个房间成员前 | 上述字段、`targetMemberID` | 每个目标成员一次；发送失败不重试 | 按接收者过滤 Presence |

表中的 `session` 来自 session-ticket 请求；Presence context 顶层的 `customData` 则是
Transport 为当前 WebSocket message 创建的独立对象。

同一 action 的 middleware 按注册顺序执行；`await next()` 进入下一个 middleware，抛出
`CollabError` 表示预期拒绝。

`joinUnit` 只保护实时房间，不能取代 Service `readUnitData` middleware；未加入房间的客户端仍可能直接发起 snapshot HTTP 请求。

## 协议路由参考

下表使用默认 `protocolBasePath=/universer-api`。通常由 Univer Collaboration Client 调用这些路由，应用不需要手动封装。

| 通道 | Method / Message | Path | 用途 |
| --- | --- | --- | --- |
| HTTP | `GET` | `/universer-api/user/session-ticket` | 获取一次性 WebSocket ticket |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/rev/:revision` | 加载 Unit snapshot 和 changesets |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/block/:blockID` | 加载 Unit block |
| HTTP | `GET` | `/universer-api/snapshot/block/:type/unit/:unitID/block/:blockID` | 加载已解析的 Unit block |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/fetchmissing?from=:from&to=:to` | 加载缺失 changesets |
| HTTP | `POST` | `/universer-api/comb/:type/unit/:unitID/new_changes` | 提交 changeset |
| HTTP | `DELETE` | `/universer-api/snapshot/-/units` | 删除 Unit |
| HTTP | `POST` | `/universer-api/snapshot/-/units/recover` | 恢复 Unit |
| WebSocket open | `GET` + Upgrade | `/universer-api/comb/connect?sessionTicket=:ticket` | 消费 ticket 并建立 Session |
| WebSocket | `HELLO/HEARTBEAT/JOIN/LEAVE/Presence` | `/universer-api/comb/connect` | 成员、房间和 Presence |

## 配置与部署

```ts
const endpoint = new UniverCollabEndpoint(collabService, {
  protocolBasePath: '/universer-api',      // 默认值
  sessionTicketTtlMs: 5 * 60_000,          // 默认 5 分钟
});
```

Session、Unit room 和待发送消息队列都在进程内，因此实时广播只保证单 Endpoint 进程。当前没有跨进程的在线成员、房间或广播能力。

WebSocket ACK 和广播不保证每条消息都送达，也不是权威数据源。客户端断线后使用 revision
和 fetch-missing HTTP 补齐 confirmed changesets。

### 停止服务

Transport 会释放注册的 Endpoint；Endpoint 会清理 Session、房间和 Service event 订阅。应用仍需释放 Service 和 Database Adapter。

```ts
await transport.dispose();
await collabService.dispose();
await database.dispose();
```
