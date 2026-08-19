<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-endpoint

[English](./package-collaboration-history-endpoint.md) | [简体中文](./package-collaboration-history-endpoint.zh-CN.md)

Univer History HTTP Protocol 的 Node Transport Endpoint。前端 History UI 通过它读取历史
条目、创建者和 changesets。

```text
History HTTP 请求
→ Transport authentication middleware
→ UniverHistoryEndpoint
→ History Service middleware
→ History Database Adapter / Collaboration Service
```

## 安装与注册

```bash
pnpm add \
  @univerjs-pro/collaboration-history-service \
  @univerjs-pro/collaboration-history-endpoint \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node
```

```ts
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverHistoryEndpoint } from '@univerjs-pro/collaboration-history-endpoint';

const historyEndpoint = new UniverHistoryEndpoint(historyService);
const collabEndpoint = new UniverCollabEndpoint(collabService);

transport.use(authenticationMiddleware);
transport.register(historyEndpoint);
transport.register(collabEndpoint);
```

先注册认证，再注册 History Endpoint 和主协同 Endpoint。History Endpoint 使用应用通过
Transport 提供的 `userID`，调用 History Service API 处理协议请求；它不负责认证、ACL、
History 存储或分段策略。

## HTTP 路由

| Method | Path | Service action | 用途 |
| --- | --- | --- | --- |
| `GET` | `/universer-api/history/:unitID/list` | `getHistoryList` | 读取历史条目 |
| `GET` | `/universer-api/history/:unitID/creators` | `listHistoryCreators` | 读取历史创建者 |
| `GET` | `/universer-api/history/:unitID/cs` | `getHistoryChangesets` | 读取历史 revision 对应的 changesets |

三条路由都使用当前 HTTP 请求由 Transport middleware 设置的 `ctx.userID/customData`，并
进入对应 History Service middleware；History Endpoint 不创建或读取 WebSocket Session。

应用应在 History Service 的各 action 安装权限 middleware。Transport 拥有并释放
Endpoint；释放 Endpoint 不会释放 History Service 或 Database Adapter。
