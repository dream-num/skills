<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/headless-univer

提供面向 Node.js 的标准 headless Univer factory。它集中维护 Univer / Univer Pro 内容插件以及固定的
locale、formula 和 network 生产装配，并返回尚未加载目标 Unit 的独占 `Univer` 实例。

本 package 不加载 Snapshot 或 UnitData，不捕获 mutation，也不负责 revision、OT、commit、worker pool、
daemon、Workspace 认证或 server transport。上述能力由 runtime 或 application 组合。

## 安装

```bash
pnpm add @univer-cli/headless-univer
```

需要 Node.js 22.12 或更高版本，以及与本 package 版本兼容的 Univer / Univer Pro license。

## 与 Collaboration Runtime 组合

这个组合示例还需要安装 Collaboration Runtime：

```bash
pnpm add @univer-cli/univer-collaboration-runtime
```

```ts
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createUniverCollaborationRuntimeFactory,
  type CollaborationRuntimeBackend,
  type UniverCollaborationRuntimeFactory,
} from "@univer-cli/univer-collaboration-runtime";

export function createRuntimeFactory(
  backend: CollaborationRuntimeBackend,
): UniverCollaborationRuntimeFactory {
  return createUniverCollaborationRuntimeFactory({
    backend,
    createUniver: createStandardHeadlessUniverFactory({
      license: process.env.UNIVER_LICENSE ?? "",
    }),
  });
}
```

返回的 factory 与 collaboration runtime 的 `UniverFactory` 结构兼容，但本 package 不依赖
`@univer-cli/univer-collaboration-runtime`。它也可以用于其他需要用户提供 `Univer` factory 的模块。

## Interface

默认 factory：

- 注册 Sheet、Doc、Slide、Base 和 Board 的标准内容插件、Facade extensions 及 Pro 扩展。
- 使用 Rust formula engine，并把 `initialFormulaComputing` 固定为 `NO_CALCULATION`。
- 按 Univer Node headless 标准配置注册 network plugin。
- 使用标准英文 locale。

公开 options 只保留实际存在的组合需求：license，以及可选的 Embed plugin 配置。需要修改 locale、formula、
network、Univer 配置或标准插件集合的高级用户应直接实现自己的 factory。

## Embed 配置

普通 Univer application 通过 `UniverEmbedPlugin` 的 config 注册 ResourceRef Provider。标准 headless
factory 保持同一 interface：把现有 plugin config 原样传给 `embedPluginConfig` 即可。

`embedPluginConfig` 的类型直接来自 `UniverEmbedPlugin` constructor config；字段含义、Provider matching
和错误语义均由 `@univerjs-pro/embed` 定义。Snapshot Adapter、
`SnapshotService` 以及依赖它们的 Provider 创建属于 collaboration runtime 或 application 的组合职责。

Factory 成功返回后，所有权转移给调用者；调用者负责最终 dispose。

如果 application 需要直接执行 Facade program，可使用
`createStandardHeadlessUniverFacade(univer)`。该函数从与 factory 相同的依赖图创建 `FUniver`，避免 package
manager 的不同 peer dependency context 产生彼此未注册 extension 的 Facade class。它不改变 Unit 生命周期或
权限；调用方仍需按自身 target 规则限制 `createDocument()`、`disposeUnit()` 等方法。

## 公共导出

- `createStandardHeadlessUniverFactory()`。
- `createStandardHeadlessUniverFacade()`。
- `HeadlessUniverFactory` 与 `HeadlessUniverFactoryContext`。
- `StandardHeadlessUniverFactoryOptions`。
