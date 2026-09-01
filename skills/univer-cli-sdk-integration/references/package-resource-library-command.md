<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/resource-library-command

为 `@univer-cli/resource-library` 提供原生 Commander `resources` command preset。它负责 arguments、
options、默认文本/JSON presentation 和失败退出；目录、下载、cache 与导出规则仍由 capability 实现。

## 安装

```bash
pnpm add commander @univer-cli/resource-library @univer-cli/resource-library-command
```

Commander 是 peer dependency，支持 `^15.0.0`。Node.js 版本要求为 `>=22.12.0`。

## 使用

```ts
import { createResourcesCommand } from "@univer-cli/resource-library-command";
import type { ResourceLibrary } from "@univer-cli/resource-library";
import { Command } from "commander";

export async function runCli(openLibrary: () => ResourceLibrary): Promise<void> {
  const program = new Command("my-cli");
  program.addCommand(createResourcesCommand({ openLibrary }));
  await program.parseAsync();
}
```

使用 factory 而不是 eager `ResourceLibrary`，可以避免 application 启动或执行其他 command 时解析大型
manifest。

## Command surface

```text
resources registries [--json]
resources find <query...> [--registry <id>]... [--limit <number>] [--json]
resources export <handle...> [--out <directory>] [--json]
resources cache path [--json]
resources cache clear [--json]
```

- `find` 默认最多返回 30 项；重复 `--registry` 使用 OR 语义。
- 单个 `export` 且没有 `--out` 时，stdout 只写 SVG 内容。
- 多个 handle 必须提供 `--out`。
- 批量导出会输出所有成功与失败，存在任一失败时以非零状态退出；`--json` 成功输出仍保留完整
  `exported`/`failed` result。
- Capability coded error 通过 Commander `error()` 转成非零退出。

Application 可以使用原生 Commander 的 `configureOutput()`、`exitOverride()`、hook 和 help customization。

本 package 不负责 manifest 或 cache 路径、默认 assets 安装、application home、网络策略、全局 JSON error
envelope、daemon/runtime 或产品 target。需要统一 machine failure envelope 的 application，应在自己的顶层
presentation boundary 实现。
