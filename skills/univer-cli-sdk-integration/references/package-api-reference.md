<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/api-reference

提供 Univer Facade API 的离线结构化查询。它解决两类问题：用关键词发现“应该调用哪个 API”，以及用
准确 symbol 查看 class、member、type 和 enum 的详细信息。

查询结果是普通 TypeScript 数据，不包含终端排版或 I/O。Package 自带由当前 Univer SDK declarations
预生成的标准 reference。

如果只需要默认的终端命令，可以使用 `@univer-cli/api-reference-command`；本 package 适合需要
直接控制查询输入和结构化结果的调用方。

## 安装

需要 Node.js 22.12 或更高版本。

```bash
pnpm add @univer-cli/api-reference
```

## 核心概念

| 概念        | 含义                                                        |
| ----------- | ----------------------------------------------------------- |
| Reference   | 已加载、可以执行 `find()` 和 `show()` 的只读查询对象。      |
| Artifact    | 预生成的完整字符串；loader 会校验 JSON、schema 和必要字段。 |
| Find        | 用一个或多个关键词发现可能相关的 API。                      |
| Show        | 按准确 symbol 读取 API 详情。                               |
| Unit filter | 把 find 结果限制为一个 Unit，同时保留 shared API。          |

## 使用标准 reference

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";

const reference = createStandardApiReference();

const matches = reference.find({
  terms: ["setValues", "conditional formatting"],
  unit: "sheet",
  limit: 20,
});

const details = reference.show(["FRange", "FRange.setValues", "ICellData.v"]);
```

`find()` 按 term 分别返回匹配项，适合搜索和发现。`show()` 按 symbol 返回结构化详情，适合生成说明、
校验用户输入或向 Agent 提供精确上下文。

## 查询范围与结果

- `find()` 大小写不敏感，支持 substring、camelCase 分词和模糊匹配。
- `unit` 可以限制为 `sheet`、`slide` 或 `doc`，同时保留 shared API。
- `limit` 应用于每个 term，而不是全部 terms 的总和。
- `show()` 返回继承、组合、overload、相关类型和拼写 suggestion。
- 常见 class 名支持别名，例如 `range` 对应 `FRange`。
- 未找到 symbol 不会抛错，而是返回 `status: "not-found"` 的结果。

## 加载预生成 reference

```ts
import { readFile } from "node:fs/promises";
import { loadApiReferenceArtifact } from "@univer-cli/api-reference";

const serialized = await readFile("dist/api-reference.json", "utf8");
const reference = loadApiReferenceArtifact(serialized);
```

Artifact 可以来自 application asset、网络或 bundler import；调用方把它作为 opaque value 保存和传递。
Artifact 的生成属于 application build，本仓库的 compiler 是 private development tool，不构成 npm 公共
合同。Artifact 无效、损坏或 schema 不受支持时会抛出 `ApiReferenceArtifactError`。

## 公共导出

- `createStandardApiReference()`：创建使用标准 Univer declarations 的 `ApiReference`。
- `loadApiReferenceArtifact(serialized)`：从 artifact 字符串创建 `ApiReference`。
- `ApiReference.find(input)`：按关键词查询 API。
- `ApiReference.show(symbols)`：按准确 symbol 查询详情。
- `ApiReferenceArtifactError`：artifact 加载错误。
- `API_REFERENCE_UNITS`：可用的 Unit 过滤值。

查询输入、结果及 symbol 结构通过 `ApiReference*`、`FindApiReferencesInput` 等 named types 导出。

本 package 不编译 declarations，不读取文件或网络，也不规定 CLI presentation。
