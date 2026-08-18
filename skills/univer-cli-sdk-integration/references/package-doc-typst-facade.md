<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/doc-typst-facade

把一个受约束的 Typst Source Bundle 编译为创建完整 Univer Doc 的 plain JavaScript Facade
program，同时返回结构化 diagnostics 和可选的 Typst PNG previews。

本 package 是 target-neutral capability，不依赖 Commander，也不理解 Workspace、Worktree、Space、
Node、`.univer` path、runtime lease 或 commit。

## 安装

```bash
pnpm add @univer-cli/doc-typst-facade
```

Node.js 版本要求为 `>=22.12.0`。运行时需要 package 声明的官方
`@univerjs-pro/doc-typst-native-binding`；compiler 不会回退到系统 `typst` executable。

## Source Bundle

Bundle root 包含 `typst.json`、一个或多个 Typst page source、可选 prelude 和可选 `assets/`：

```text
paper/
├── typst.json
├── common.typ
├── pages/01.typ
└── assets/logo.png
```

最小 manifest：

```json
{
  "schemaVersion": 1,
  "targetUnitId": "report",
  "pages": ["pages/01.typ"]
}
```

`pages` 也可以使用 `{ "id": "cover", "source": "pages/01.typ" }`。Manifest 还可以声明
`title` 和有序的 `prelude` paths。Page、prelude 和 asset 必须位于 bundle root 内；绝对路径、URL、
parent traversal 和逃逸 root 的 symlink 会被拒绝。

## 编译

```ts
import { compileDocTypstBundle } from "@univer-cli/doc-typst-facade";

const result = await compileDocTypstBundle("./paper", {
  previewDir: "./review/typst",
});

console.log(result.javascript);
console.log(result.diagnostics);
console.log(result.previews);
```

第一个参数既可以是 bundle directory，也可以直接是 `typst.json`。`javascript` 假定执行环境注入
`univerAPI`，执行后应创建 manifest `targetUnitId` 指定的完整 Doc。`targetUnitId` 是 compiler program
内部 identity，不是 Workspace 等产品分配的真实 content identity。

`previewDir` 未提供时不会生成 PNG。提供后，preview 由同一个官方 native binding 渲染，结果记录
page ID、source path 和输出 path。

## Diagnostics 与错误

成功结果中的 diagnostics 可能包含 `info`、`warning` 或 `error`：

- warning 表示生成结果可用，但存在 fidelity 限制或需要人工复核；
- error 表示调用方不得把生成 program 应用于持久化 target；
- compiler 无法产生 program 时抛出 `DocTypstFacadeError` 或带 diagnostics 的
  `DaCTypstTranslationError`。

可以使用 `isDocTypstFacadeError()` 在 adapter 边界识别 capability error。错误 code、diagnostic source
path/span 和 preview metadata 可用于 CLI 或 server presentation。

## Public API

- `compileDocTypstBundle()`；
- `DocTypstBundleManifest`、`CompileDocTypstBundleOptions`、`CompileDocTypstBundleResult`；
- `DocTypstDiagnostic`、`DocTypstPreview`；
- `DocTypstFacadeError`、`DaCTypstTranslationError`、`isDocTypstFacadeError()`。

Typst semantic IR、mapping records、asset traversal、translator、printer 和 native binding loader 都是内部
实现，不属于 Public API。

## 职责边界

本 package 不负责 command 参数、stdout/stderr、Workspace authentication、Worktree/Space/Node、Unit
创建、idempotency、runtime 创建、program 执行、mutation capture、commit、最终 Univer screenshot 或
Office export。默认 compile-only CLI 由 `@univer-cli/doc-typst-facade-command` 提供；具体产品的
compile-and-apply workflow 由 application 组装。
