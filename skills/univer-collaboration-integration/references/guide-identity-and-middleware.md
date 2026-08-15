<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 身份与 middleware

Middleware 是应用把认证、权限、日志、trace、限流和外部集成接入协同生命周期的位置。三层
middleware 看到的请求不同：Transport 处理 HTTP 入口，Endpoint 处理实时 Session，Service
处理权威协同数据操作。

## 三层分别控制什么

| 层 | 什么时候运行 | 适合做什么 |
| --- | --- | --- |
| Transport HTTP middleware | 每个进入 SDK 的普通 HTTP 请求 | 认证、CORS、trace、入口日志 |
| Endpoint middleware | WebSocket connect、JOIN 和 Presence | 实时房间策略、成员展示、Presence 校验或过滤 |
| Service middleware | 读取、创建、提交、删除和恢复等数据生命周期 | ACL、配额、审计、指标、外部系统集成 |

Endpoint 的 `joinUnit` 只决定 Session 能否进入实时房间，不能替代 Service 的读取权限。
snapshot、block 和缺失 changesets 都可以通过 HTTP 读取，不要求客户端已经 JOIN。

## 两条上下文路径

普通文档数据请求使用当前 HTTP 请求的上下文：

```text
HTTP snapshot / block / fetch-missing / new-changes / delete / recover
→ Transport middleware 设置 ctx.userID 和 ctx.customData
→ Endpoint 调用 Service API
→ Service middleware 读取同一 userID 和 customData
```

WebSocket Session 则通过一次性 ticket 继承签发时的 HTTP 上下文：

```text
GET /universer-api/user/session-ticket
→ Transport middleware 设置 ctx.userID 和 ctx.customData
→ Endpoint 保存关联并返回 opaque ticket
→ WebSocket open 一次性消费 ticket
→ Endpoint 创建 Session { userID, memberID, customData }
→ Endpoint middleware 通过 ctx.session 读取
```

ticket 字符串本身不包含 `userID/customData`。所有 HTTP 路由中，只有 session-ticket 会把
当前 Transport context 延长到 WebSocket Session；其他 HTTP 请求的 `customData` 只属于
当前请求。Service middleware 获取当前 HTTP 请求的数据，不会自动合并 Session
`customData`。

## 三种标识不要混用

| 标识 | 含义 | 来源和生命周期 |
| --- | --- | --- |
| `userID` | 稳定的应用用户身份，也是 confirmed changeset 作者 | 应用在每个 HTTP 请求中提供 |
| `memberID` | 当前 WebSocket Session 的在线成员 ID | Endpoint 创建；重连后变化 |
| `sid + reqId` | changeset 提交幂等键 | Collaboration Client 创建；重试时复用 |

应用决定如何认证并把业务主键写入 `ctx.userID`。SDK 不规定 Cookie、Bearer token、用户表
或角色模型。浏览器 payload 中的用户字段、`memberID` 和 confirmed revision 都不能替代
服务端上下文。

`new-changes` 是 HTTP 请求，但 ACK 和广播通过 WebSocket 发送。Endpoint 会用 payload 中的
`memberID` 定位在线 Session，再校验该 Session 的 `userID` 与当前 HTTP `ctx.userID` 一致，
并确认它已经 JOIN 目标 Unit。应用不需要自己关联两条通道。

## 按 Transport、Endpoint、Service 的顺序安装

```ts
// 每个 Collaboration HTTP 请求进入 SDK 时运行；可认证、建立 trace 或记录网络日志。
transport.use(async (ctx, next) => {
  const user = await auth.requireUser(ctx.incomingMessage);
  ctx.userID = user.userId;
  ctx.customData.traceID = readTraceID(ctx.incomingMessage);
  await next();
});

// Session 首次 JOIN Unit、尚未进入实时房间时运行。
// userID/customData 来自签发 ticket 的 Transport HTTP 请求。
endpoint.use('joinUnit', async (ctx, next) => {
  if (!await acl.canRead(ctx.session.userID, ctx.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Cannot join this Unit');
  }
  await next();
});

// Endpoint 通过 HTTP 提交 changeset，Service 进入逻辑提交生命周期时运行。
// userID/customData 来自当前 Transport HTTP 请求。
collabService.use('submitChangeset', async (ctx, next) => {
  const unitID = ctx.request.changeset.unitID;
  if (!await acl.canEdit(ctx.userID, unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is read-only');
  }

  const startedAt = performance.now();
  await next();
  metrics.observeSubmit(performance.now() - startedAt);
});
```

同一 action 的 middleware 按注册顺序执行，`await next()` 进入下一个 middleware。认证失败
时应直接结束 HTTP response，不调用 `next()`；预期的协同拒绝使用 `CollabError`。

## customData 适合放什么

`customData` 是当前请求或 Session 内的可变对象，适合放：

- 当前用户、tenant 和 trace ID；
- 同一次调用复用的 ACL 查询结果；
- 计时起点、logger child 或临时服务对象。

它不会自动写入协同数据库、发送给浏览器或记录日志。需要持久化的业务数据应由应用显式
写入自己的存储。

## 重试和外部副作用

Service action 描述生命周期阶段，不描述业务用途。同一个 action 可以同时安装权限、日志
和指标 middleware。选择 action 时要先查看对应 Package README 中的触发时机、可见字段和
重试语义。

主 Service 的 `applyChangeset` 和 `commitChangeset` 可能因 revision 竞争重复执行，必须保持
可重试，不能在其中发送不可撤销的 webhook、扣费或消息。数据库提交后的进程内处理使用
Service event；要求可靠投递到外部系统时，由 Database Adapter 和应用使用 transactional
outbox。

History、Comment 和 Worktree 有各自独立的 Service middleware。保护主 Collaboration
Service 不会自动保护这些可选能力，接入方式见[可选能力](./guide-extensions.md)。
