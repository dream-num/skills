<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 搭建协同服务

本章先启动一个独立的、可持久化的协同服务，再通过 Transport、Endpoint 和 Service
middleware 接入应用的用户、日志、权限和其他业务逻辑。

## 1. 安装服务端 package

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-sqlite \
  @univerjs/protocol
```

SQLite Adapter 支持 Node.js 22 及以上。所有 Univer 与 Collaboration package 必须使用
同一匹配 release cohort 的精确版本。

## 2. 启动基本服务

下面使用 SQLite 保存数据，并用固定的 `local-user` 跑通独立 Node 服务：

```ts
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';
import { createNodeTransport } from '@univerjs-pro/collaboration-transport-node';

await mkdir('./data', { recursive: true });

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
const collabService = new UniverCollabService({ dbAdapter: database });
const collabEndpoint = new UniverCollabEndpoint(collabService);
const transport = createNodeTransport();

// 固定用户只用于先独立跑通服务，下一节会替换为应用认证。
transport.use(async (ctx, next) => {
  ctx.userID = 'local-user';
  await next();
});

transport.register(collabEndpoint);

const server = createServer((request, response) => {
  transport.handleRequest(request, response);
});
server.on('upgrade', (request, socket, head) => {
  transport.handleUpgrade(request, socket, head);
});
server.listen(3010);
```

这四个对象组成完整服务端。Transport 是网络入口，Endpoint 处理 Univer 前端协议，Service
处理协同数据，Database Adapter 保存权威状态。普通 HTTP request 和 WebSocket upgrade 都
必须交给 Transport；否则 snapshot 可以读取，但实时 Session 无法建立。

固定用户不适合正式环境。确认基本服务能够启动后，再用下一节的 middleware 接入应用。

## 3. 使用 middleware 接入应用

下面假设应用提供 `authenticate()`、`applicationAcl` 和 `logger`。在正式服务中，删除上一节
固定 `local-user` 的 middleware，改为按 Transport、Endpoint、Service 的顺序安装以下
middleware，再调用 `transport.register(collabEndpoint)`。

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

// 每个 Collaboration HTTP 请求进入 SDK 时先经过认证 middleware。
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

// 认证成功后，每个 Collaboration HTTP 请求经过日志 middleware。
transport.use(async (ctx, next) => {
  const startedAt = performance.now();
  try {
    await next();
  } finally {
    logger.info({
      userID: ctx.userID,
      method: ctx.incomingMessage.method,
      url: ctx.incomingMessage.url,
      durationMs: performance.now() - startedAt,
    });
  }
});

// WebSocket Session 首次 JOIN 一个 Unit、尚未进入实时房间时经过这里。
// ctx.session 的身份来自签发 session ticket 的那次 Transport HTTP 请求。
collabEndpoint.use('joinUnit', async (ctx, next) => {
  if (!await applicationAcl.canRead(ctx.session.userID, ctx.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Cannot join this Unit');
  }
  await next();
});

// Endpoint 通过 HTTP 读取 snapshot、block 或 changesets，Service 读库前经过这里。
// ctx.userID/customData 来自当前 Transport HTTP 请求，不是 WebSocket Session。
collabService.use('readUnitData', async (ctx, next) => {
  if (!await applicationAcl.canRead(ctx.userID, ctx.request.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is not accessible');
  }
  await next();
});

// Endpoint 通过 HTTP 提交 changeset，Service 进入提交生命周期时经过这里。
collabService.use('submitChangeset', async (ctx, next) => {
  const unitID = ctx.request.changeset.unitID;
  if (!await applicationAcl.canEdit(ctx.userID, unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is read-only');
  }
  await next();
});

transport.register(collabEndpoint);
```

这里用认证、日志和权限说明三层 middleware 的作用，但 middleware 并不只用于权限控制，
也可用于 trace、限流、指标和外部系统集成。示例只展示读取、JOIN 和提交；应用还应根据
自身策略保护 Unit 创建、删除和恢复等 Service action。

完整 action、触发时机和重试语义见 `@univerjs-pro/collaboration-service` 和
`@univerjs-pro/collaboration-endpoint` README。

## 4. 创建第一个 Unit

Collaboration 协议负责打开和编辑已有 Unit，不负责产品的“新建文档”流程。应用通常先创建
产品记录和 ACL，再调用 Service 创建协同 Unit：

```ts
import { randomUUID } from 'node:crypto';
import { UniverType } from '@univerjs/protocol';

// workbookData 和 user 来自应用的“新建文档”流程。
const unitID = randomUUID();

await collabService.createUnitFromData(
  {
    type: UniverType.UNIVER_SHEET,
    data: { ...workbookData, id: unitID, rev: 1 },
  },
  {
    userID: user.userId,
    customData: { traceId: randomUUID() },
  }
);
```

`unitID` 在一个 Service 和数据库范围内必须唯一，初始 revision 必须为 `1`。产品记录、ACL
和协同 Unit 属于不同存储边界；应用需要用事务或补偿逻辑处理跨存储失败。

直接使用更多 Service API 封装应用 API 或后台任务属于高级集成，参见
`@univerjs-pro/collaboration-service` README。

## 5. 配置 Univer 前端

```bash
pnpm add \
  @univerjs-pro/collaboration \
  @univerjs-pro/collaboration-client \
  @univerjs-pro/collaboration-client-ui
```

```ts
import { UniverCollaborationPlugin } from '@univerjs-pro/collaboration';
import { UniverCollaborationClientPlugin } from '@univerjs-pro/collaboration-client';
import '@univerjs-pro/collaboration-client/facade';
import {
  BrowserCollaborationSocketService,
  UniverCollaborationClientUIPlugin,
} from '@univerjs-pro/collaboration-client-ui';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import { createUniver } from '@univerjs/presets';

const wsOrigin = location.origin.replace(/^http/, 'ws');

const { univerAPI } = createUniver({
  collaboration: true,
  presets: [UniverSheetsCorePreset({ container: 'app' })],
  plugins: [
    UniverCollaborationPlugin,
    [UniverCollaborationClientPlugin, {
      socketService: BrowserCollaborationSocketService,
      snapshotServerUrl: '/universer-api/snapshot',
      collabSubmitChangesetUrl: '/universer-api/comb',
      collabWebSocketUrl: `${wsOrigin}/universer-api/comb/connect`,
      wsSessionTicketUrl: '/universer-api/user/session-ticket',
      // 应用提供 Authz API 时再配置：
      // authzUrl: '/universer-api/authz',
    }],
    UniverCollaborationClientUIPlugin,
  ],
});

await univerAPI.getCollaboration().loadSheetAsync(unitID);
```

Collaboration plugins 必须在 `createUniver({ plugins })` 时注册。Doc、Slide、Board 和 Base
使用对应 loader，类型必须与服务端创建 Unit 时保存的类型一致。

`authzUrl` 是应用提供的前端权限查询接口，可用于呈现只读 UI；它不是本 SDK Endpoint 的
路由，也不能替代服务端 Service middleware。若应用不使用该能力，可以不配置。

## 6. 集成已有 Web 框架

已有 Express、Fastify 或 Nest 应用时，不需要改变前面的 SDK 组装。只把 Collaboration
协议路径的原始 Node request 交给 `transport.handleRequest()`，并把底层 HTTP server 的
`upgrade` 事件交给 `transport.handleUpgrade()`。

Express 挂载会改写 `request.url`，转交前需要恢复 `request.originalUrl`；同时要在
`express.json()` 等 body parser 消费请求流之前交给 Transport。具体代码见
`@univerjs-pro/collaboration-transport-node` README。

## 7. 验证和停止

用两个独立浏览器身份打开同一 `unitID`，依次确认：能加载 snapshot、能建立 WebSocket、能
JOIN、编辑后另一个窗口能收到变更、重启服务后数据仍在。

停止接收新流量后，按网络入口到持久化层反向释放：

```ts
await transport.dispose();
await collabService.dispose();
await database.dispose();
```

Transport 释放它注册的 Endpoint；Endpoint 不释放 Service；Service 不释放应用注入的
Database Adapter。

下一步阅读[身份与 middleware](./guide-identity-and-middleware.md)，进一步理解 HTTP context、
WebSocket Session 和各 lifecycle action。
