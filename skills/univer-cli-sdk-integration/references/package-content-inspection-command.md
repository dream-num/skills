<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-inspection-command

为 `@univer-cli/content-inspection` 提供原生 Commander `inspect` command preset。它负责 CLI
arguments/options、selector 解析、默认文本或 JSON presentation，以及 Runtime lease 的 acquire/release。

## 安装

```bash
pnpm add commander @univer-cli/content-inspection @univer-cli/content-inspection-command
```

Commander 是 peer dependency，支持 `^15.0.0`。Node.js 版本要求为 `>=22.12.0`。Application 提供
`acquireRuntime()`，决定 Unit ID 如何映射为自己的
Instance key、init 和数据源：

下面示例是只加载 Sheet 的 application；支持多种 Unit type 时，application 应根据自己的 target metadata
映射 `unitType`。示例使用 Runtime Pool，因此还需要安装：

```bash
pnpm add @univer-cli/univer-collaboration-runtime-pool
```

```ts
import { createContentInspectionCommand } from "@univer-cli/content-inspection-command";
import type { UniverCollaborationRuntimePool } from "@univer-cli/univer-collaboration-runtime-pool";
import { Command } from "commander";

export function createProgram(
  runtimes: UniverCollaborationRuntimePool<{ unitId: string }>,
): Command {
  const program = new Command("my-cli");
  program.addCommand(
    createContentInspectionCommand({
      async acquireRuntime({ unitId }) {
        const lease = await runtimes.acquire({
          key: `unit:${unitId}`,
          init: { unitId },
        });
        return {
          unitId: lease.unitId,
          unitType: "sheet",
          execute: async (input) => await lease.execute(input),
          invalidate: async () => await lease.invalidate(),
          release: async () => await lease.release(),
        };
      },
    }),
  );
  return program;
}
```

普通 preset：

```text
inspect <target> [selectors...] --unit <unit-id> [--json]
```

Selectors 使用 `id:`、`name:` 或 `index:` 前缀；CLI index 是 1-based，并由 command Adapter 转换为
capability 的 0-based index。公开 target `range` 通过 `--worksheet` 选择 Worksheet，并映射为 capability 的
`worksheet-range` query kind。

## Worktree preset

`createWorktreeContentInspectionCommand()` 增加 `--trunk` / `--worktree <id>` 严格二选一，并调用：

```ts
acquireRuntime({ unitId });
acquireRuntime({ unitId, worktreeID: "wt-42" });
```

Command 不解释 Worktree，也不生成 Instance key。

## 自定义 target command

当 application 的 target 不是单独的 Unit ID，例如本地文件路径时，可以复用公开的
`parseInspectionQuery()` 和 `renderContentInspection()`，自行定义薄 Commander command。这样文件参数和路径
生命周期仍由 application 所有，同时 selector 规则和默认文本 presentation 不会重复实现。

## 生命周期与输出

- 成功、query failure 或 runtime failure 都会在 presentation 前调用 `lease.release()`。
- Runtime pool 负责把 poisoned lease 的 release 转换为 invalidate。
- 默认文本适合终端阅读，可能明确缩写大矩阵或长文本。
- `--json` 输出完整 capability result，不缩写。
- Coded capability/runtime errors 通过 Commander error 和非零退出状态呈现。

本 package 不负责数据加载、Runtime pool 创建、Instance key、mutation commit、认证、daemon transport
或 application composition。
