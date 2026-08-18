<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/content-inspection

从已经加载的 Univer Sheet、Doc 或 Slide 读取稳定、结构化的内容概览与详情。Capability 与 Commander、
target 寻址、Runtime pool 和 presentation 无关。

## 安装

```bash
pnpm add @univer-cli/content-inspection
```

Node.js 版本要求为 `>=22.12.0`。

## Runtime Interface

调用方只需提供只读 execution：

```ts
interface ContentInspectionRuntime {
  readonly unitId: string;
  readonly unitType: "sheet" | "doc" | "slide" | "base" | "board";
  execute(input: { code: string; mode: "read" }): Promise<{ value: JsonValue }>;
}
```

Collaboration Runtime lease 的 `execute()` 满足读取要求；application 只需把 Univer 的 numeric
`UniverInstanceType` 映射为 inspection 使用的稳定 Unit type 字符串。

下面的可选集成示例还需要安装 Runtime Pool：

```bash
pnpm add @univer-cli/univer-collaboration-runtime-pool
```

```ts
import { inspectContent, type ContentInspectionUnitType } from "@univer-cli/content-inspection";
import type { UniverCollaborationRuntimeLease } from "@univer-cli/univer-collaboration-runtime-pool";

export async function inspectWorkbook(
  lease: UniverCollaborationRuntimeLease,
  unitType: ContentInspectionUnitType,
) {
  return await inspectContent(
    {
      unitId: lease.unitId,
      unitType,
      execute: async (input) => await lease.execute(input),
    },
    { kind: "workbook" },
  );
}
```

`inspectContent()` 不 acquire 或结束 Runtime lease。调用方可以在同一个 lease 上执行多次 inspection。

## Queries

Canonical targets：

- `workbook`、`worksheet`、`worksheet-range`
- `presentation`、`slide`
- `document`、`paragraph`

Worksheet、Slide 和 Paragraph selector 可以按 ID、name（适用时）或 0-based index 选择。一个 query
可以携带多个同类 selectors；任一 selector 失败时整次调用失败，不返回部分结果。

```ts
const worksheets = await inspectContent(runtime, {
  kind: "worksheet",
  worksheets: [{ name: "Plan" }, { index: 1 }],
});

const ranges = await inspectContent(runtime, {
  kind: "worksheet-range",
  ranges: [{ worksheet: { id: "sheet-1" }, range: "A1:C20" }],
});
```

Result 保留完整结构化数据。文本缩写、分页和终端表格属于 command 或其他 presentation Adapter。

## Errors

`ContentInspectionError` 表达 Unit type mismatch、selector invalid/not found/ambiguous、range out of bounds
和无效 runtime result。Runtime execution error 原样传播，具体 runtime pool 决定该 instance 是否失效。

## 公共导出

- `inspectContent(runtime, query)`。
- `ContentInspectionRuntime`。
- query、selector 和 result types。
- `ContentInspectionError`。

本 package 不负责 Unit 寻址、path、认证、Worktree、数据加载、Runtime pool、lease 生命周期、mutation
提交、文本输出或 Commander command。
