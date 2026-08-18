<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-layout-lint

使用浏览器渲染产生的 Slide layout facts，对一份已经物化到明确内容状态的 Slide Unit 执行保守的布局检查。
当前只提供已经验证的 Slide 规则，不声明 Sheet、Doc、Base 或 Board lint。

如果你的目标是检查 Slide 内容，应从这个 package 开始。它通过同一套渲染基础设施取得真实 glyph ink：

```text
Slide UnitData
  -> @univer-cli/unit-layout-lint       根据 layout facts 产生 findings
  -> @univer-cli/univer-render-runtime 启动浏览器并捕获 layout
  -> application 构建的 Render Page   创建 Univer 并完成实际排版
       ^
       @univer-cli/univer-render-page  提供 mount 函数和预设 Univer factory
```

这套 runtime 和 Render Page 也可以被 `@univer-cli/unit-screenshot` 复用，因此同一份 Slide 可以先 lint 再截图，
不需要创建两套 browser composition。

## 安装

```bash
pnpm add @univer-cli/unit-layout-lint @univer-cli/univer-render-runtime @univer-cli/univer-render-page
pnpm add -D vite
```

Node.js 版本要求为 `>=22.12.0`。第一次接入时，先按照
[`@univer-cli/univer-render-page`](./package-univer-render-page.md) 创建 browser entry，并构建出根目录包含
`index.html` 的静态目录。再把该目录交给
[`@univer-cli/univer-render-runtime`](./package-univer-render-runtime.md)。Render Page 通常只需随 application
构建一次；lint 时复用构建产物和 runtime。

License 是可选的；包含 Pro plugins 的 Render Page 在无 license 时仍可执行，并按 Univer Pro SDK 的规则显示
水印。Browser 查找、安装和运行隔离要求由 render runtime 说明。

## 使用

```ts
import { fileURLToPath } from "node:url";
import { createUnitLayoutLint } from "@univer-cli/unit-layout-lint";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const renderPageRoot = fileURLToPath(new URL("../dist/render-page", import.meta.url));
const runtime = await createUniverRenderRuntime({
  renderPageRoot,
});

try {
  const lint = createUnitLayoutLint({ runtime });
  const report = await lint.lint({
    unitType: "slide",
    unitData: slideData,
    pages: [1, "closing-slide"],
  });
  console.log(report.findings);
} finally {
  await runtime.close();
}
```

`renderPageRoot` 应根据 Node entry 与构建目录的实际相对位置调整。若 application 同时截图，可把同一个 `runtime`
传给 `createUnitScreenshot({ runtime })`，最后统一调用一次 `close()`。

省略 `pages` 时检查全部 Slide pages。Page number 是 1-based；字符串 selector 必须是 `slideOrder` 中的 page
ID。重复 selector 会按第一次出现的位置去重。

## 当前规则

- `text-off-page`：实际文字墨迹超出页面；
- `text-escapes-container`：文字明显冲出较小、不透明的矩形卡片；
- `text-overlaps-text`：两段实际文字墨迹发生显著重叠。

这些 findings 是带证据的复查建议，不是必须清零的内容错误。规则使用浏览器捕获的实际 glyph ink，而不是只看
模型声明的文本框。每条 finding 包含稳定 fingerprint、页身份、相关元素身份和解释该 finding 所需的最小几何
证据；完整 layout capture 不进入公开结果。

Capability 会在返回结果前验证 requested pages、page identity 和 element identity 的完整性。Render evidence
缺失、重复或混入未请求页面时会抛出 `UnitLayoutLintError`，不会用空 findings 表示检查干净。Browser/runtime
错误保持为 `UniverRenderError`。

## 职责边界

本 package 不解析 CLI 参数，不读取 Workspace、Worktree、文件或 Snapshot，不创建 render runtime，不输出文本，
也不提交 mutation。调用方负责提供最终 `ISlideData` 和 runtime，并决定目标身份与内容版本如何固定。

`UnitLayoutLintInput` 当前是只有 `unitType: "slide"` 的判别联合，module 不接受其他 Unit 类型。若将来其他类型
出现经过验证的 lint 行为，再增加对应的真实联合成员；当前 package 不预留未实现类型、规则或空结果。
