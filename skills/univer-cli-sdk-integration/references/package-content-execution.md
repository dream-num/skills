<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-execution

把调用者提供的 Facade code 准备为面向一个明确 Univer Unit 的 execution program。Capability 根据 Unit
type 注入稳定 bindings、使用明确 Unit ID 绑定 root Facade，并在进入 runtime 前拒绝用户代码重新声明
bindings。它不依赖 Commander、Collaboration runtime 或具体 target。

## 安装

```bash
pnpm add @univer-cli/content-execution
```

Node.js 版本要求为 `>=22.12.0`。

## 使用

```ts
import { prepareContentExecutionProgram } from "@univer-cli/content-execution";

const program = prepareContentExecutionProgram({
  code: 'workbook.getActiveSheet().getRange("A1").setValue("done");',
  unitId: "book-1",
  unitType: "sheet",
});

const result = await runtime.execute({ code: program, mode: "write" });
```

`runtime` 可以是 `@univer-cli/univer-collaboration-runtime`、其他进程内 executor，或调用方自己的
adapter。Capability 只返回 program 字符串，不获取或结束 runtime lease。

## Bindings

| Unit type | bindings                           |
| --------- | ---------------------------------- |
| sheet     | `univerAPI`、`api`、`workbook`     |
| doc       | `univerAPI`、`api`、`doc`          |
| slide     | `univerAPI`、`api`、`presentation` |
| base      | `univerAPI`、`api`                 |
| board     | `univerAPI`、`api`、`board`        |

`api` 始终是 `univerAPI` 的 alias。除 Base 外，type-specific root 通过传入的 `unitId` 显式获取，不依赖
active Unit。Base 特意不提供 `base` alias；调用者可以使用 `api.getBase(unitId)`。

这些名字是预留 bindings，用户 code 不能在 program 顶层重新声明。嵌套函数或 block 可以拥有自己的同名
局部变量。Capability 不执行 code；与预留 bindings 无关的 JavaScript syntax/runtime error 由实际 executor
报告。

## Errors

`ContentExecutionError` 使用以下 code：

- `CONTENT_EXECUTION_INVALID_INPUT`：Unit ID 为空或输入 shape 无效。
- `CONTENT_EXECUTION_UNIT_TYPE_UNSUPPORTED`：不是 Sheet、Doc、Slide、Base 或 Board。
- `CONTENT_EXECUTION_RESERVED_BINDING`：用户 code 重新声明预设 binding。

## 边界

本 package 不负责 target/path/Worktree 寻址、runtime 创建与加载、mutation capture、图片上传、commit、retry、
lease lifecycle、daemon transport 或 CLI presentation。Application 应先解析自己的 target，再准备 program，
最后把 program 交给所选 executor。
