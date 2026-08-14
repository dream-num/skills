<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/daemon-command

为 `@univer-cli/daemon` 的显式 lifecycle control 提供原生 Commander preset。它只负责
`daemon status/start/restart/stop` 的参数、help、文本或 JSON presentation 和 Commander failure；daemon
entry、socket、environment 与 application shutdown cleanup 仍由 application 决定。

## 安装

```bash
pnpm add commander @univer-cli/daemon @univer-cli/daemon-command
```

Commander 是 peer dependency，支持 `^15.0.0`。Node.js 版本要求为 `>=22.12.0`。

## 使用

```ts
import { createDaemonControl } from "@univer-cli/daemon";
import { createDaemonCommand } from "@univer-cli/daemon-command";
import { Command } from "commander";

const control = createDaemonControl({
  entry: new URL("./daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath: "/tmp/my-cli.sock",
});

const program = new Command("my-cli");
program.addCommand(createDaemonCommand({ control }));
await program.parseAsync();
```

```text
my-cli daemon status [--json]
my-cli daemon start [--json]
my-cli daemon restart [--json]
my-cli daemon stop [--json]
```

`status` 和 `stop` 不会自动启动尚未运行的 daemon。`start` 与 `stop` 是幂等操作；JSON 结果中的
`started`/`stopped` 表示本次调用是否实际改变了进程状态。`restart` 对运行中的 daemon 先优雅停止再启动，
返回 `restarted: true` 和 `previousPid`；未运行时直接启动并返回 `restarted: false`。

`status` 会展示 `running | stopped | incompatible | unreachable`。Running 文本包含 identity、version、
可选 build ID 与 protocol；incompatible 文本包含 machine-readable reason、expected/actual compatibility
信息和可选 diagnostic。`--json` 直接输出 capability 的结构化结果。

## 边界

本 package 不启动 worker、不创建 runtime pool、不选择 socket、不读取 application config，也不定义业务 RPC。
对应 application 应使用 `createDaemonControl()` 注入 identity、entry、socket 和 environment，并在 daemon
server 的 `onShutdown` 中释放自己拥有的长期资源。Application 还负责生成 version/build ID，并决定何时允许
用户显式 restart；本 package 不实现自动升级策略。
