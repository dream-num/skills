<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 生产运行

上线前需要同时确认持久化、网络入口、身份、进程模型和资源释放。数据库提交成功与实时消息
送达是两种不同保证：Database Adapter 保存权威数据，WebSocket 负责低延迟反馈，客户端在
断线后通过 HTTP 补齐 confirmed changesets。

## 选择 Database Adapter

| Adapter | 适合场景 | 需要知道的限制 |
| --- | --- | --- |
| Memory | 测试、本地教学、临时数据 | 进程退出后数据丢失，进程之间不共享 |
| SQLite | 本地应用和中小规模单 Node 部署 | Node.js 22+；应用负责目录、文件、备份和运行参数 |
| 自定义 Adapter | 已有共享数据库或更大部署 | 必须实现 `IDatabaseAdapter` 并通过共享 contract tests |

SQLite Adapter 保证初始 snapshot、revision CAS、提交幂等、snapshot 可见性和 Unit 生命周期
写入的原子契约。它只保存协同核心数据，不保存用户、ACL、目录、History、Comment 或
Worktree 数据。

```ts
import { mkdir } from 'node:fs/promises';
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';

await mkdir('./data', { recursive: true });

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
  busyTimeoutMs: 5_000,
});
```

空库会自动初始化 schema；不完整或不支持的 schema 会被拒绝，不会自动迁移旧结构。SQLite
Adapter 不主动修改 `journal_mode`，WAL、checkpoint、备份和恢复策略由应用管理。

## 推荐的第一版拓扑

```text
Browser
  │ HTTPS / WSS
Reverse proxy
  │
One Node application process
  ├── Product API、authentication 和 ACL
  ├── Transport + Endpoint
  ├── Collaboration Service
  └── SQLite Adapter → persistent volume
```

Session、Unit room、Presence、ACK 和广播当前只在一个 Endpoint 进程内共享。多个 Service
实例使用正确的 Database Adapter 时仍可通过 revision CAS 保证数据正确，但多个 Endpoint
进程不会自动共享在线成员和实时房间；sticky session 也不能补齐这项能力。因此当前应按
单 Endpoint 进程部署实时入口。

## 反向代理和网络

代理至少需要转发以下协议入口：

- `/universer-api/snapshot`：snapshot、block 和缺失 changesets；
- `/universer-api/comb`：HTTP changeset 提交；
- `/universer-api/user/session-ticket`：一次性 WebSocket ticket；
- `/universer-api/comb/connect`：WebSocket upgrade 和实时消息。

代理必须保留 query string，并为 `/comb/connect` 开启 WebSocket upgrade。HTTPS 页面使用
WSS；跨域部署还要同时处理 Cookie/credentials、CORS 和 WebSocket origin。

Transport 的 HTTP body 和 WebSocket message 默认上限均为 16 MiB。应用框架和代理的限制
不能更小于实际 snapshot 或 changeset；WebSocket idle timeout 也要允许客户端保持长连接。

## 数据、事件和备份

| 结果 | 保证方式 |
| --- | --- |
| confirmed changeset 和 revision | Database Adapter 原子持久化 |
| 客户端重复提交 | `(unitID, sid, reqId)` 幂等 |
| ACK、Presence 和广播 | 当前 Endpoint 进程内实时发送；失败后由客户端通过 HTTP 恢复 |
| Service event 和 History `attach()` | 进程内执行；失败不回滚已提交数据 |
| webhook、消息队列等可靠外部投递 | 应用与具体 Adapter 使用 transactional outbox |

备份范围不能只有 core SQLite 表。产品用户、ACL、目录以及启用的 History、Comment、
Worktree 都有独立存储边界。hard delete 或跨模块清理也应由应用统一协调。

## 启动、就绪和停止

启动时先准备数据库目录和配置，再创建 Adapter、Service、Endpoint、Transport，最后开始
监听端口。就绪检查应确认 schema 初始化和完整组装已经成功，而不只是进程仍在运行。

停止时先从负载均衡器移除实例并停止新流量，再按以下顺序释放：

```text
Transport
→ optional Services
→ Collaboration Service
→ optional Database Adapters
→ Collaboration Database Adapter
```

Transport 拥有并释放它注册的 Endpoint；Endpoint 不释放 Service；Service 不释放应用注入
的 Adapter。突然终止不会写入半个数据库事务，但客户端可能没有收到响应，并会使用原幂等
键重试。

## 按现象定位问题

| 现象 | 首先检查 |
| --- | --- |
| 所有协议请求都是 `401` | Transport HTTP middleware 是否识别 Cookie/Header，并在成功后调用 `next()` |
| session ticket 成功，WebSocket 返回 `401` | ticket 是否过期、已消费，连接 URL 是否携带刚取得的 ticket |
| HTTP 可加载，始终没有在线协同 | Node server 和代理是否转发 `/comb/connect` upgrade |
| 能加载但 JOIN 被拒绝 | Endpoint `joinUnit` middleware 和 Session 中的 `userID` |
| 能进入房间但 snapshot 被拒绝 | Service `readUnitData`；JOIN 权限不能替代读取权限 |
| 能读取但不能编辑 | Service `submitChangeset` 和前端只读提示对应的应用 Authz API |
| 编辑者本地成功，其他窗口不更新 | 是否部署了多个 Endpoint 进程，或提交是否发生在另一个 Service 进程 |
| 重启后 Unit 消失 | 是否仍使用 Memory Adapter，SQLite 文件是否位于持久化卷 |
| 协议请求返回 `404` | Express 是否恢复完整 `request.originalUrl`，Endpoint 是否已注册 |

定位时按 Transport HTTP → session ticket → WebSocket upgrade → Endpoint JOIN → Service read/
submit → Database 的顺序检查，通常比从客户端错误栈反推更快。
