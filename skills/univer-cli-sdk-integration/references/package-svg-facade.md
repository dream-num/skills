<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/svg-facade

把 SVG source 确定性编译为 Univer Slide Facade code。它将 SVG 的图形、路径、文本、图片、渐变、引用和
viewport 映射为假定 `slide` 与 `univerAPI` 已在作用域内的 plain JavaScript，并返回结构化 diagnostics。

本 package 是与 Commander、文件系统和具体 target 无关的 capability。它可以被 CLI、server、build tool、
测试或自定义 adapter 单独使用。

## 安装

```bash
pnpm add @univer-cli/svg-facade
```

Node.js 版本要求为 `>=22.12.0`。

## 编译 SVG

```ts
import { compileSvgToFacade } from "@univer-cli/svg-facade";

const result = await compileSvgToFacade(`
  <svg viewBox="0 0 960 540">
    <rect x="40" y="40" width="240" height="120" rx="16" fill="#2563eb" />
    <text x="72" y="112" font-size="28" fill="#ffffff">Hello</text>
  </svg>
`);

console.log(result.code);
console.log(result.viewport);
console.log(result.warnings, result.lints, result.textMeasure);
```

`result.code` 是可直接执行的 plain JavaScript，不包含 TypeScript-only syntax。调用方可以把它交给自己的
Facade executor，也可以先用 `wrapSlideScript()` 绑定目标页：

```ts
import { compileSvgToFacade, wrapSlideScript } from "@univer-cli/svg-facade";

const compiled = await compileSvgToFacade(svg);
const program = wrapSlideScript(compiled.code, {
  page: 2,
  mode: "replace",
  ...compiled.viewport,
});

await runtime.execute({ code: program, mode: "write" });
```

Wrapped program 假定 `presentation` 与 `univerAPI` 已在作用域。它会按 SVG viewport 设置页面尺寸，使用
1-based page 定位现有页，允许 `pageCount + 1` 追加一页，并在 `replace` mode 中先清空目标页。

## 外部资产

Capability 不读取文件。SVG 使用本地 `<image href>` 或外部 SVG sprite 时，调用方必须注入同步
`SvgAssetResolver`：

```ts
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { compileSvgToFacade } from "@univer-cli/svg-facade";

const sourcePath = "/work/pages/page-1.svg";
const compiled = await compileSvgToFacade(readFileSync(sourcePath, "utf8"), {
  assetResolver: (href) => ({
    bytes: readFileSync(resolve(dirname(sourcePath), href)),
  }),
});
```

Resolver 返回原始 bytes；compiler 按内容识别 SVG、PNG、JPEG、GIF 或 WebP，不信任扩展名。路径基准、允许访问的
目录、文件大小和其他安全策略属于 adapter。HTTP(S) image URL 不会被 compiler 下载，而会保留给后续 Facade
runtime。

## 文本量字

缺省 `builtinTextMeasurer` 使用确定性的字符类别估算，适合离线构建、测试和无浏览器环境。需要与 Univer 渲染
引擎同源的字体几何时，注入 `SvgTextMeasurer`：

```ts
const compiled = await compileSvgToFacade(svg, {
  textMeasurer: {
    source: "my-render-runtime",
    async measureLine({ runs }) {
      return await measureWithMyRuntime(runs);
    },
  },
});
```

Measurer 必须返回一行 rich-text runs 的 width、ascent 与 descent，单位均为 SVG px。所用
`source` 会原样写入 `result.textMeasure`，便于追踪生成几何的量字环境。

## Diagnostics 与错误

- `warnings`：转换有损，生成结果会与浏览器中的 SVG 不同；调用方应视为必须处理。
- `lints`：没有丢失可见内容，但源码写法或可编辑性值得复查。
- `SvgFacadeError`：SVG 无法解析、引用无法解析，或命中了无法表达的特性；`code` 为
  `SVG_FACADE_COMPILE_FAILED`。

可以使用 `isSvgFacadeError(error)` 在 adapter 边界识别 capability error。

## Public API

- `compileSvgToFacade(svg, options)`
- `wrapSlideScript(body, options)`
- `builtinTextMeasurer`
- `SvgAssetResolver`、`SvgTextMeasurer` 及其 input/result types
- `SvgFacadeError`、`isSvgFacadeError()`

SVG parser tree、mapping IR、path normalization、blacklist、mapper 和 emitter 都是内部实现，不属于 Public API。

## 职责边界

本 package 不负责 Commander 参数、stdin/stdout、文件路径寻址、Workspace/Worktree、`.univer` lifecycle、
runtime 创建、mutation capture、commit、图片上传、SVG sanitizer、远程下载或截图。默认 CLI 交互由
`@univer-cli/svg-facade-command` 提供；target-specific compile-and-apply workflow 由 application 组装。
