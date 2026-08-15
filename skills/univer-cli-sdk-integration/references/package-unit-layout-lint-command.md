<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-layout-lint-command

为 `@univer-cli/unit-layout-lint` 提供原生 Commander `lint` command preset。当前 command 明确只接受
Slide Unit，不声明 Sheet、Doc、Base 或 Board lint。

## 安装

```bash
pnpm add commander @univer-cli/unit-layout-lint @univer-cli/unit-layout-lint-command
```

Commander 是 peer dependency，支持 `^15.0.0`。Node.js 版本要求为 `>=22.12.0`。

Application 显式组装 preset：

```ts
import { createUnitLayoutLint } from "@univer-cli/unit-layout-lint";
import { createUnitLayoutLintCommand } from "@univer-cli/unit-layout-lint-command";

program.addCommand(
  createUnitLayoutLintCommand({
    lint: createUnitLayoutLint({ runtime: slideLayoutRuntime }),
    loadUnit: async ({ unitId }) => await loadSlideUnitData(unitId),
  }),
);
```

对应 CLI：

```text
lint --unit <slide-unit-id> [--pages <1,3-5,page-id>] [--json]
```

`--pages` 使用 1-based 页码、闭区间或 Slide page ID；省略时检查全部页面。Command 负责参数解析与文本/JSON
presentation，capability 负责 selector resolution、render evidence 完整性校验和 lint 规则。

本 package 不加载 UnitData，不创建 browser runtime，不解释 Worktree、trunk、Workspace 或文件路径。Application
可以给返回的原生 `lint` Command 增加自己的 target options。
