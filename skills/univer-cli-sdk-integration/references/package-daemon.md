<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/daemon

适合让多个短生命周期进程访问同一个长期运行的本地进程。Client 优先连接已经存在且身份兼容的
daemon；如果 socket 尚不可用，则启动指定 entry，等待 compatibility handshake 成功，再发送请求。

如果调用方只需要在当前进程执行函数，或者服务已经通过 HTTP、队列等方式运行，不需要本 package。

本 package 统一处理本地 socket framing、daemon 按需启动、显式 lifecycle control、JSON
request/response、timeout 和错误传播。它不规定 daemon 保存什么业务状态，也不定义 application RPC。

## 安装

需要 Node.js 22.12 或更高版本。

```bash
pnpm add @univer-cli/daemon
```

## 核心概念

| 概念             | 含义                                                        |
| ---------------- | ----------------------------------------------------------- |
| Daemon server    | 长期运行的本地进程，按 method 注册异步 handler。            |
| Daemon client    | 连接 daemon、必要时启动 daemon entry，并发送请求。          |
| Daemon entry     | 一个可由 Node.js 直接执行、启动并监听 server 的构建后文件。 |
| Socket path      | Client 和 server 约定的本地 socket 地址。                   |
| Daemon identity  | Application 注入的 `id`、`version` 和可选 `buildId`。       |
| Protocol version | Package 定义的 control protocol 版本。                      |
| Request          | 一个 method 和一个 JSON payload。                           |

Client 与 server 必须使用相同的 socket path。Client 启动 entry 时，会通过
`UNIVER_CLI_SDK_DAEMON_SOCKET` 环境变量把这个地址传给 daemon。

`identity.id` 是跨版本稳定的 application ownership；`identity.version` 是 application 的发布版本；
可选 `identity.buildId` 用于区分同一版本下的不同构建。Client 配置 `buildId` 时要求 daemon 必须提供并
精确匹配；client 未配置时不比较 daemon 的 `buildId`。`DAEMON_PROTOCOL_VERSION` 独立表示 client 和
daemon 能否使用 control protocol，不应由 application 修改。

## 创建 daemon entry

下面的 daemon 在内存中保存一个 Counter。`daemon.status` 与 `daemon.shutdown` 是 package 内置的保留
control method；application 只注册自己的业务 method，并通过 `onShutdown` 释放长期资源：

```ts
// counter-daemon.ts
import { createDaemonServer, DAEMON_SOCKET_ENV, type JsonValue } from "@univer-cli/daemon";

const socketPath = process.env[DAEMON_SOCKET_ENV];
if (!socketPath) throw new Error(`${DAEMON_SOCKET_ENV} is required`);

const buildId = process.env["MY_CLI_BUILD_ID"];
const identity = {
  ...(buildId === undefined ? {} : { buildId }),
  id: "my-cli",
  version: "1.2.0",
};

let value = 0;

const server = createDaemonServer({
  identity,
  socketPath,
  onShutdown: async () => {
    value = 0;
  },
});

server.handle("counter.add", async (payload) => {
  const amount = readNumber(payload);
  value += amount;
  return value;
});

await server.listen();

function readNumber(value: JsonValue): number {
  if (typeof value !== "number") throw new Error("Expected a numeric payload");
  return value;
}
```

`handle()` 必须在 `listen()` 之前调用，而且不得注册保留的 `daemon.*` method。`close()` 停止接收
请求、关闭现有连接、执行一次 `onShutdown`，并清理 server 创建的 socket。

## 发送请求

调用进程使用构建后的 daemon entry：

```ts
// client.ts
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDaemonClient } from "@univer-cli/daemon";

const client = createDaemonClient({
  entry: new URL("./counter-daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath: join(tmpdir(), "counter-daemon.sock"),
});

const first = await client.request("counter.add", 2); // 2
const second = await client.request("counter.add", 3); // 5
```

第一次请求在 socket 不存在或拒绝连接时启动 daemon。之后创建的 client 只要使用相同 socket path，
就会连接同一个进程并访问同一份状态。

## 显式 lifecycle control

`createDaemonControl()` 使用同一组 entry、socket 和 environment 提供非业务的进程控制：

```ts
import { createDaemonControl } from "@univer-cli/daemon";

const control = createDaemonControl({
  entry: new URL("./counter-daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath: join(tmpdir(), "counter-daemon.sock"),
});

await control.status(); // stopped；不会启动进程
await control.start(); // running，started: true
await control.start(); // 同一个进程，started: false
await control.restart(); // 新进程，restarted: true，包含 previousPid
await control.stop(); // stopped，stopped: true
await control.restart(); // 未运行时直接启动，restarted: false
await control.stop(); // 仍为 stopped，stopped: false
```

`status()` 和 `stop()` 在 daemon 未运行时不会启动 entry。`start()` 等待 daemon 内置 status handshake
成功才返回；`stop()` 在内置 shutdown method ACK 后等待 socket 停止接受连接。`restart()` 在 daemon
运行时先完成同样的优雅停止，再启动新进程，并返回 `previousPid`；未运行时等同于 `start()`。如果停止
成功但重新启动失败，daemon 会保持停止状态。

`status()` 返回以下结构化状态：

- `running`：handshake 与期望 identity 完全兼容，包含 `protocolVersion`、`identity`、`pid`、
  `startedAt` 和 `socketPath`。
- `stopped`：socket 不存在或拒绝连接。
- `incompatible`：socket 可达，但 control protocol、identity、version 或所要求的 build 不兼容；包含
  `reason`、`expected`，以及能够安全解析时的 `actual` health。
- `unreachable`：socket 可达但 handshake 未完成，例如 request timeout 或连接提前关闭；包含 diagnostic。

同一 `id` 且 protocol 相同的 version/build mismatch 可以由用户显式 `stop()` 或 `restart()`；identity、
protocol、legacy 或 malformed mismatch 不会被控制，避免 application 关闭不属于自己的进程。Client 的
业务请求只在 `running` 状态发送，不会自动替换不兼容 daemon。

## 启动参数与 timeout

```ts
const client = createDaemonClient({
  entry: new URL("./counter-daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath,
  env: {
    COUNTER_MODE: "strict",
  },
  startTimeoutMs: 10_000,
  requestTimeoutMs: 30_000,
});
```

- `entry` 必须是绝对 `file:` URL。
- `startTimeoutMs` 默认 10 秒，限制等待 daemon 开始监听的时间。
- `requestTimeoutMs` 默认 30 秒，限制 client 等待单次 response 的时间；超时不会取消仍在 daemon 中
  执行的 handler。
- `env` 会与当前 `process.env` 和 socket 环境变量合并后传给 daemon。

## 错误行为

- 未注册 method 以 `DAEMON_METHOD_NOT_FOUND` 失败。
- 业务请求遇到 `incompatible` daemon 时以 `DAEMON_INCOMPATIBLE` 失败，不执行业务 handler。
- 业务请求遇到 `unreachable` daemon 时以 `DAEMON_UNREACHABLE` 失败。
- Application 尝试注册保留的 `daemon.*` method 时立即失败。
- 启动超时以 `DAEMON_START_TIMEOUT` 失败。
- 停止超时以 `DAEMON_STOP_TIMEOUT` 失败。
- 请求超时以 `DAEMON_REQUEST_TIMEOUT` 失败。
- Handler 抛出的 `Error` 会把 `name`、`message` 和可选字符串 `code` 返回 client。
- 已有进程正在监听同一 socket 时，新的 server 不会替换它，并以
  `DAEMON_ALREADY_RUNNING` 失败。
- Socket path 指向非 socket 文件时，server 拒绝覆盖。

Payload 和 result 必须是 `JsonValue`。本 package 不提供认证、加密、远程网络 transport、自动进程升级或
日志管理；identity 的具体值、build ID 生成、socket 命名、业务 method、handler、active work/drain policy
和 application cleanup 由调用方决定。

## 公共导出

- `createDaemonClient(options)`：创建支持连接与按需启动的 client。
- `createDaemonControl(options)`：创建带 status/start/restart/stop 的 lifecycle control。
- `createDaemonServer(options)`：创建本地 daemon server。
- `DAEMON_SOCKET_ENV`：daemon entry 读取 socket path 的环境变量名。
- `DAEMON_PROTOCOL_VERSION`：package 当前 control protocol version。
- `DAEMON_STATUS_METHOD`、`DAEMON_SHUTDOWN_METHOD`：内置保留 control method 名称。
- `DaemonIdentity`、`DaemonHealth`、`DaemonClient`、`DaemonControl`、`DaemonServer`、status、options 和
  handler types。
