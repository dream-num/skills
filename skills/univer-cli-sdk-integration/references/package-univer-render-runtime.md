<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-render-runtime

在 Node.js 中启动本地浏览器，加载 application 构建的 Render Page，并把已经物化的 Univer UnitData 交给页面
渲染。这个 package 是多项上层 capability 共用的 browser runtime，不是大多数用户的首选入口。

## 先选择你需要的入口

| 你的目标                                     | 应从哪个 package 开始               |
| -------------------------------------------- | ----------------------------------- |
| 传入 UnitData，按默认或指定 target 得到 PNG  | `@univer-cli/unit-screenshot`       |
| 检查 Slide 的文字越界、逃逸和重叠            | `@univer-cli/unit-layout-lint`      |
| 自己控制 Sheet range、Doc/Slide page 等操作  | `@univer-cli/univer-render-runtime` |
| 构建 runtime 要加载的 browser 页面或定制插件 | `@univer-cli/univer-render-page`    |

`unit-screenshot` 和 `unit-layout-lint` 都接收一个 runtime，因此 application 可以创建一次并在多个 capability 间
复用。调用关系是：

```text
unit-screenshot / unit-layout-lint / application adapter
  -> univer-render-runtime
  -> application 的静态 Render Page
  -> browser 内的 Univer / Univer Pro SDK
```

Runtime 提供 render、Document 文本量字和 Slide layout capture primitives。只有需要直接控制这些 primitives 或
为上层 capability 提供依赖时，才需要使用本 package 的 interface。

## 安装与运行条件

直接使用 runtime 时安装：

```bash
pnpm add @univer-cli/univer-render-runtime @univer-cli/univer-render-page
pnpm add -D vite
```

如果从 `unit-screenshot` 或 `unit-layout-lint` 开始，请同时按对应 README 安装 capability；这里的两个 package
分别负责 Node runtime 和 browser 页面组装。

调用方必须提供：

- 已物化到当前 head state 的 `unitData`；
- application 自己构建的 Render Page 目录，目录根部包含 `index.html`；
- Chrome、Chromium 或 Edge executable。

Runtime 和 browser probe 当前都会以 Chromium `--no-sandbox` 模式启动。不要在承载敏感数据的共享宿主机上
直接渲染不可信 UnitData；应使用权限受限的独立用户、container 或其他进程级隔离，并限制该进程可访问的文件和
网络。

package 不携带 Univer plugins、locale 或预构建 browser bundle。先按照
[`@univer-cli/univer-render-page`](./package-univer-render-page.md) 创建 browser entry，并用 Vite 或其他 bundler
构建出根目录包含 `index.html` 的静态目录。Application 可以使用 SDK 预设的完整 Univer composition，也可以只
注册业务需要的 plugins。构建结果通过 `renderPageRoot` 传给 runtime。

这种分工让 application 拥有最终 browser bundle，而 runtime 只负责静态托管、可选 license bootstrap、browser
lifecycle 和 page RPC。Render Page 应在 application build 阶段生成，而不是每次截图或 lint 时现场构建。

浏览器按以下顺序解析：`browserExecutablePath`、`UNIVER_RENDER_BROWSER`、SDK browser cache、常见系统
安装路径。若机器没有浏览器，可显式安装与当前 Puppeteer 版本匹配的 Chromium：

```ts
import {
  installUniverRenderBrowser,
  probeUniverRenderBrowser,
} from "@univer-cli/univer-render-runtime";

const installation = await installUniverRenderBrowser();
await probeUniverRenderBrowser({ executablePath: installation.executablePath });
console.log(installation.executablePath);
```

默认 cache 为 `~/.cache/univer-cli-sdk/browsers`，可用 `UNIVER_RENDER_BROWSER_CACHE` 修改。安装函数会访问
Chromium 下载源；可通过 `UNIVER_RENDER_BROWSER_DOWNLOAD_BASE_URL` 或
`PUPPETEER_DOWNLOAD_BASE_URL` 指定镜像。创建 runtime 本身不会隐式下载浏览器。

## 使用

下面的 `workbookData` 表示 application 已经物化到 head state 的 `IWorkbookData`。

```ts
import { fileURLToPath } from "node:url";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const renderPageRoot = fileURLToPath(new URL("../dist/render-page", import.meta.url));
const runtime = await createUniverRenderRuntime({
  renderPageRoot,
});

try {
  const image = await runtime.render({
    unitType: "sheet",
    unitData: workbookData,
    operation: {
      kind: "sheet-range",
      range: "A1:F20",
      sheetName: "Sheet1",
      scale: 2,
    },
  });

  // image.bytes: PNG Uint8Array
  console.log(image.width, image.height);
} finally {
  await runtime.close();
}
```

上面的相对路径以 Node entry 位于 application 的 `src/` 为例；构建后的 application 应按最终 entry 与静态目录
位置计算 `renderPageRoot`。

`license` 始终是可选字段。`@univer-cli/univer-render-page` 的 `createPresetRenderUniver` 是完整 Pro 预设；不提供
license 时仍可渲染，但输出会按 Univer Pro SDK 的规则带水印。提供有效 license 后由 Pro SDK 处理授权展示。

`render()` 支持的 operation：

| Unit  | operation       | 作用                                             |
| ----- | --------------- | ------------------------------------------------ |
| Sheet | `sheet-range`   | 渲染一个 A1 range，可指定 sheet name             |
| Doc   | `doc-page`      | 渲染 layout 后的单页，页码从 1 开始              |
| Slide | `slide-page`    | 渲染 `slideOrder` 中的单页，页码从 1 开始        |
| Board | `board-content` | 渲染全部可见内容、指定 region 或一组 element IDs |
| Base  | `base-view`     | 渲染打开后的 active table/view                   |

`UniverRenderRuntime` 保持只描述 Unit render primitives；文本量字由独立的 `UniverTextMeasureRuntime`
interface 描述，Slide layout capture 由独立的 `UniverSlideLayoutRuntime` interface 描述，避免要求只实现
screenshot 的 adapter 提供无关方法。`createUniverRenderRuntime()` 返回同时满足这三个 interface 的浏览器 runtime。

`measureText()` 接收 `IDocumentData`，返回实际宽高、行数和首行 ascent/descent。可选 `wrapWidth` 会使用指定
宽度排版；不提供时返回无约束排版宽度。该 primitive 使用与 Univer 内容渲染同源的 Document skeleton，适合
需要精确文本几何的 compiler 或 adapter：

```ts
const metrics = await runtime.measureText({ doc: documentData });
console.log(metrics.actualWidth, metrics.firstLineAscent, metrics.firstLineDescent);
```

`captureSlideLayout()` 返回选定 Slide pages 的页面尺寸、element 声明框和实际文字墨迹框。Page number 是
1-based；省略 `pages` 时捕获全部页面。该 primitive 只提供可复用的渲染事实，不判断哪些几何关系属于问题：

```ts
const capture = await runtime.captureSlideLayout({
  unitType: "slide",
  unitData: slideData,
  pages: [1, 3],
});
console.log(capture.pages[0]?.elements);
```

当前没有 Sheet、Doc、Base 或 Board layout capture interface。它们各自需要经过验证的渲染事实和规则后，才会
增加对应的真实 API。

Doc 分页前可调用 `getDocumentPageCount()`。`composeContactSheet()` 可以把多张带 page number 的 PNG
组合为总览图。基础图片结果是 `{ bytes: Uint8Array, width, height }`；Board 结果另外携带 `board` evidence：
active page ID、content bounds、实际 scale 和 rendered layout analysis。`layoutAnalysis` 包含 connector 的实际
rendered route、overlap/crossing issues、focus bounds 和汇总计数，可直接作为 Board 截图对应的布局证据。
Connector issue 还可能包含 endpoint/marker/terminal diagnostics、`endpoint` 和结构化
`suggestedAction`；它们是上游 Board analyzer 产生的 evidence，不是 render runtime 自己定义的 hard validation。

Host Unit 引用了其他 Sheet/Base 公式数据时，可以提供可选 reference Units：

```ts
await runtime.render({
  unitType: "board",
  unitData: boardData,
  formulaReferenceUnits: [
    { unitType: "sheet", unitData: sourceWorkbookData },
    { unitType: "base", unitData: sourceBaseData },
  ],
  operation: { kind: "board-content", scale: 1 },
});
```

Reference Units 会先于 Host Unit 发送给 Render Page。具体 composition 可注册 Sheet `IMPORTRANGE`、
Base table ResourceRef 等所需 plugins。每个 `unitData.id` 必须存在且互不重复。package 不发现或加载外部引用，
不选择 plugins，不决定文件路径，也不写文件。

Host Unit 包含 Embed child Units 时，调用方同样显式提供已经物化的 child UnitData：

```ts
await runtime.render({
  unitType: "slide",
  unitData: hostSlideData,
  embeddedUnits: [
    { unitType: "sheet", unitData: embeddedWorkbookData },
    { unitType: "doc", unitData: embeddedDocumentData },
  ],
  operation: { kind: "slide-page", page: 1, scale: 2 },
});
```

Embed child Units 会先于 Host 发送给 Render Page。具体 composition 负责 Embed plugin 和最终渲染行为。
与 formula references 一样，本 package 不解析持久化 Embed resource，也不决定 child 属于哪个
Workspace/Worktree；这些发现和加载职责属于 application adapter。

同一个 runtime 的操作会串行执行，以避免 Unit focus、viewport 和 browser page 状态互相覆盖。调用方应在
使用结束后调用 `close()`。

## 职责边界

本 package 不提供具体 Univer composition、Render Page mount 实现或 browser bundle，不加载 Snapshot、changeset 或远程资源，不重放
mutation，不管理 worker pool、daemon、CLI 参数或输出文件。Application 应先通过 Univer / Univer Pro SDK 或
Collaboration SDK 得到最终 UnitData，构建符合 `UniverRenderPageApi` 的 Render Page，再把两者交给 factory。
