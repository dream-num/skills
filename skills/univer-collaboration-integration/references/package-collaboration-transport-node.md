<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-transport-node

Univer Collaboration 服务端组装中的 Node.js HTTP/WebSocket 入口。

Transport 接收宿主 Node HTTP server 转交的 request 和 WebSocket upgrade。应用通过 HTTP
middleware 接入认证、日志等入口逻辑，再由注册的协议 Endpoint 处理 Collaboration 请求。
它通常不单独使用：

```text
Node HTTP server
→ Transport
  ├─→ HTTP middleware       登录认证、CORS、trace 和网络日志
  │   → Endpoint HTTP       协议路由，必要时调用 Service API
  │       → Service middleware / Database
  └─→ Endpoint WebSocket    Session、JOIN、Presence、ACK 和广播
      → Endpoint middleware 实时房间 ACL 和 Presence 控制
```

## 服务端组装

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-memory
```

```ts
import { createServer } from 'node:http';
import { MemoryDatabaseAdapter } from '@univerjs-pro/collaboration-database-memory';
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';
import { createNodeTransport } from '@univerjs-pro/collaboration-transport-node';

const database = new MemoryDatabaseAdapter();
const collabService = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(collabService);
const transport = createNodeTransport();

// use() 只接收 HTTP request；这里由应用认证并挂载身份和请求级数据。
transport.use(async (ctx, next) => {
  const user = await authenticate(ctx.incomingMessage);
  if (!user) {
    ctx.response.statusCode = 401;
    ctx.response.end('Authentication required');
    return;
  }

  // 在进入 Collaboration SDK 时映射应用的稳定用户主键。
  ctx.userID = user.userId;
  ctx.customData.user = user;
  ctx.customData.traceId = readTraceId(ctx.incomingMessage);
  await next();
});

// useUpgrade() 每次 WebSocket handshake 运行一次，可在升级前拒绝。
transport.useUpgrade(async (ctx, next) => {
  if (!isAllowedOrigin(ctx.incomingMessage.headers.origin)) {
    ctx.reject(403, 'Origin rejected');
    return;
  }
  await next();
});

// WebSocket Session 发送 JOIN 消息、尚未加入 Unit 房间时，
// 会经过 joinUnit middleware；Session 数据继承自签发 ticket 的 HTTP 请求。
endpoint.use('joinUnit', async (ctx, next) => {
  // Transport 挂载的 ctx.userID → ctx.session.userID
  // Transport 挂载的 ctx.customData → ctx.session.customData
  console.log(ctx.session.userID, ctx.session.customData.user, ctx.session.customData.traceId);
  await next();
});

// Endpoint 通过 HTTP 读取 Unit、changesets 或 Sheet block，
// Service 尚未访问 Database Adapter 时，会经过 readUnitData middleware。
collabService.use('readUnitData', async (ctx, next) => {
  // Transport 挂载的 ctx.userID → Service ctx.userID
  // Transport 挂载的 ctx.customData → Service ctx.customData
  console.log(ctx.userID, ctx.customData.user, ctx.customData.traceId);
  await next();
});

// Endpoint 通过独立入口注册，并由 Transport 管理生命周期。
transport.register(endpoint);

const server = createServer((request, response) => {
  transport.handleRequest(request, response);
});
server.on('upgrade', (request, socket, head) => {
  transport.handleUpgrade(request, socket, head);
});
server.listen(3010);
```

这里使用 Memory Adapter 只是为了让 Transport 示例保持最小；进程退出后数据会丢失。
生产环境的持久化选择见 SDK 用户手册中的《生产运行》。

Transport 不规定 Cookie、Bearer token、用户表或用户类型。应用在 HTTP
middleware 中验证自己的凭据，再把稳定业务身份显式写入
`ctx.userID`。认证失败时直接结束 response，不要继续调用 `next()`。

## 身份与 customData 如何进入 Endpoint 和 Service

Transport 为每个 HTTP 请求创建独立的 `ctx.customData`。HTTP middleware 可以在
其中放入当前请求需要的用户、tenant、trace 或 ACL 查询对象。

```text
普通协议 HTTP 请求
→ Transport middleware 设置 userID/customData
→ Endpoint 验证协议并调用 Service
→ Service middleware 读取同一 userID/customData
```

WebSocket 身份不直接取自 upgrade URL 或客户端 payload，而是由 Endpoint 通过一次性
ticket 继承：

```text
ticket HTTP 请求上的 userID/customData
→ Endpoint 在服务端保存关联并返回 opaque ticket 字符串
→ WebSocket open 一次性消费关联记录
→ Endpoint 创建 Session { userID, memberID, customData }
→ Endpoint middleware 通过 ctx.session 读取
```

ticket 字符串本身不包含 `userID/customData`。只有 session-ticket HTTP 路由会把
当前 Transport context 延长到 WebSocket Session；其他 HTTP 路由不会。

Transport 的网络数据生命周期如下：

- HTTP `ctx.customData` 只属于当前请求；每个后续 HTTP 请求都会重新运行认证
  middleware。
- `EndpointSession.customData` 来自签发 ticket 的那次 HTTP 请求，在当前
  WebSocket Session 中保持同一引用。
- Endpoint 处理普通 HTTP 协议路由时，传给 Service middleware 的是该 HTTP 请求的
  `ctx.customData`，不是自动取 Session `customData`。

`customData` 只在内存中传递，不会自动发送给浏览器、写入协同数据库或记录日志。

## 在宿主应用中挂载

Express 等框架可以继续处理应用自己的产品路由，只把 Collaboration 协议路径转交给
`handleRequest()`。底层 HTTP server 还必须转交对应的 WebSocket `upgrade`：

```ts
app.use('/universer-api', (request, response) => {
  // Express 挂载会改写 request.url，Transport 需要看到完整协议路径。
  request.url = request.originalUrl;
  transport.handleRequest(request, response);
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === '/universer-api/comb/connect') {
    transport.handleUpgrade(request, socket, head);
  }
});
```

Express 集成必须在 `express.json()` 等 body parser 消费请求流之前把协议路径交给
Transport。Fastify、Nest 等框架同样需要转交原始 Node request、socket 和 head。

Collaboration、History、Comment 和 Worktree Endpoint 可以按路由前缀注册在同一个
Transport 上，共享同一组 HTTP 认证 middleware。Endpoint 没有匹配当前请求时会
继续调用 `next()`；所有已注册 Endpoint 都未处理的 HTTP 请求由 Transport 返回纯文本
404，未处理的 WebSocket upgrade 也在建立连接前返回 HTTP 404。

## API 分层

```ts
transport.use(httpMiddleware);
transport.useUpgrade(upgradeMiddleware);
transport.register(endpoint);
```

- `use()`：仅普通 HTTP request；回调直接获得 `incomingMessage`、`response`、
  `userID` 和请求级 `customData`。
- `useUpgrade()`：仅 WebSocket handshake；可读取 `incomingMessage`，或调用
  `reject(status, message)`。
- `register()`：注册并管理协议 Endpoint，由 Endpoint 处理匹配的 HTTP 请求和 WebSocket
  连接。

## 请求限制与资源释放

HTTP body 和 WebSocket message 限制默认都是 16 MiB。`readBody()` 和 `readJson()` 会
执行大小限制，并保证请求流只消费一次。

停止时从网络入口向持久化层反向释放：

```ts
await transport.dispose();
await collabService.dispose();
await database.dispose();
```

Transport 会终止活动连接并释放它通过 `register()` 拥有的 Endpoint；`register()` 返回的
registration 也可提前注销并释放该 Endpoint。Endpoint 不释放 Service，Service 也不释放
外部注入的 Database Adapter。

完整服务端装配、middleware 和生产环境要求见 SDK 用户手册中的《搭建协同服务》、
《身份与 middleware》和《生产运行》。
