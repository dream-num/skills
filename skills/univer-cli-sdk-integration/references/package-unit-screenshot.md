<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-screenshot

把已经物化的 Univer UnitData 转换为一组结构化 PNG 结果。如果你的目标是“把一个 Sheet、Doc、Slide、Board
或 Base 截成图片”，应从这个 package 开始，而不是直接调用底层 render runtime。

支持 Sheet、Doc、Slide、Board 和 Base，并统一处理默认 target、分页、输出命名、scale 和像素/页数限制。

截图链路由三个 package 共同完成：

```text
UnitData
  -> @univer-cli/unit-screenshot       选择页面、range、命名和限制
  -> @univer-cli/univer-render-runtime 启动浏览器并调用页面协议
  -> application 构建的 Render Page   在浏览器内创建 Univer 并真正渲染
       ^
       @univer-cli/univer-render-page  提供 mount 函数和预设 Univer factory
```

`unit-screenshot` 是用户侧 capability；`univer-render-runtime` 和 `univer-render-page` 是它的运行基础设施。SDK
不会发布一个固定的 browser bundle，因为 application 需要决定使用预设还是自定义 Univer composition，并拥有
最终 HTML 与构建产物。

## 安装

```bash
pnpm add @univer-cli/unit-screenshot @univer-cli/univer-render-runtime @univer-cli/univer-render-page
pnpm add -D vite
```

需要 Node.js 22.12 或更高版本，以及 Chrome、Chromium 或 Edge。Runtime 的浏览器查找与安装方式见
[`@univer-cli/univer-render-runtime`](./package-univer-render-runtime.md)。本 capability 继承 runtime 的 Chromium
`--no-sandbox` 启动方式；渲染不可信 UnitData 时必须使用进程或 container 隔离。

## 第一次接入

先创建 application 的 browser entry：

```ts
import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("#app is required");

await mountUniverRenderPage({
  container,
  createUniver: createPresetRenderUniver,
});
```

再用 Vite 或其他 browser bundler 把它构建成根目录包含 `index.html` 的静态目录，例如
`dist/render-page`。完整的 HTML、Vite 配置、自定义 factory 和 license 说明见
[`@univer-cli/univer-render-page`](./package-univer-render-page.md)。Render Page 通常只需随 application 构建一次；
截图时不需要重复构建。

然后在 Node application 中创建一个 runtime，并把它注入 screenshot capability：

```ts
import { fileURLToPath } from "node:url";
import { createUnitScreenshot } from "@univer-cli/unit-screenshot";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const renderPageRoot = fileURLToPath(new URL("../dist/render-page", import.meta.url));
const runtime = await createUniverRenderRuntime({
  renderPageRoot,
});
const screenshot = createUnitScreenshot({ runtime });

try {
  const result = await screenshot.capture({
    unitType: "sheet",
    unitData: workbookData,
  });

  for (const image of result.images) {
    console.log(image.name, image.width, image.height, image.bytes);
  }
} finally {
  await runtime.close();
}
```

`workbookData` 是 application 已经加载并物化到目标版本的 `IWorkbookData`。调用方最少只需传
`unitType + unitData`；target 是可选的截图控制，不承担数据加载语义。Runtime 可以被同一进程中的多次截图复用，
也可以同时注入 `@univer-cli/unit-layout-lint`。`renderPageRoot` 应根据 Node entry 与构建目录的实际相对位置调整；
使用结束后必须调用 `close()`。

License 是可选的。预设 Render Page 在无 license 时仍可截图，并按 Univer Pro SDK 的规则显示水印；若有有效
license，把它传给 `createUniverRenderRuntime({ license })` 即可。

省略 target 时采用以下规则：

| Unit  | 默认截图                                              |
| ----- | ----------------------------------------------------- |
| Sheet | 第一个 Sheet 的 used range；空表使用有限默认 viewport |
| Doc   | layout 后最多 `maxPages` 页；首页命名为 `view.png`    |
| Slide | `slideOrder` 中的全部页面                             |
| Board | active page 的全部可见内容                            |
| Base  | 打开后的 active table/view                            |

需要精确控制时传可选 target：

```ts
await screenshot.capture({
  unitType: "sheet",
  unitData: workbookData,
  target: { kind: "sheet-range", sheetName: "Data", range: "B2:H40", scale: 2 },
});

await screenshot.capture({
  unitType: "slide",
  unitData: slideData,
  target: {
    kind: "slide-pages",
    pages: [1, "closing-slide"],
    contactSheet: { tile: { columns: 2, rows: 1 } },
  },
});

await screenshot.capture({
  unitType: "board",
  unitData: boardData,
  target: {
    kind: "board-content",
    elementIds: ["shape-1", "shape-2"],
    padding: 16,
    scale: 2,
  },
});
```

Board 的 `region` 与 `elementIds` 互斥；显式 `padding` 或 `scale` 必须同时提供其中一种 selector。Slide page
支持从 1 开始的 page number 和 `slideOrder` 中的 page ID，显式顺序会保留，重复 page 会去除。
Sheet/Doc/Slide/Base 默认 scale 为 2；Board 完整内容默认 scale 为 1。允许范围均为 0.1 到 4。

Host Unit 包含跨 Unit 公式时，可以在最小输入之外增加
`formulaReferenceUnits: [{ unitType: "sheet" | "base", unitData }]`。Reference 是可选增强项，不改变普通调用仍只需
`unitType + unitData` 的合同。

Host Unit 包含 Embed 时，可以提供
`embeddedUnits: [{ unitType: "sheet" | "doc" | "slide" | "board" | "base", unitData }]`。
Capability 会把这些 child Units 无损转交给 render runtime；它不解析 Embed resource，也不负责按 Workspace、
Worktree 或本地文件 scope 加载 child UnitData。

## 外置图片

如果 application 提供的 UnitData 用 UUID 引用外置图片，可在 capture 前通过 target-neutral resolver 生成
render-only clone：

```ts
import {
  resolveUnitScreenshotImageAssets,
  type ScreenshotImageAssetResolver,
} from "@univer-cli/unit-screenshot";

const resolver: ScreenshotImageAssetResolver = {
  async resolve({ source, signal }) {
    const asset = await myApplicationAssetAdapter.read(source, signal);
    return {
      bytes: asset.bytes,
      mediaType: asset.mediaType,
      ...(asset.contentLength === undefined ? {} : { contentLength: asset.contentLength }),
    };
  },
};

const renderUnit = await resolveUnitScreenshotImageAssets(unit, resolver);
const result = await screenshot.capture(renderUnit);
```

Capability 会在 Host、formula reference 与 Embed child 之间按 `source` 去重，识别普通 UnitData 字段以及
`resources[].data` 中的 JSON 字符串，把成功解析的 `UUID` 引用改写成 BASE64 data URI。原始 UnitData 不会被修改；
下载失败、空内容、非图片 MIME、错误 `contentLength`、非 JSON resource 和未匹配引用均保持原值。

Resolver 只接收 opaque `source`、可选 `declaredMediaType` 与 `AbortSignal`。Workspace sign URL、Cookie、Worktree、
本地文件路径和其他 target 语义由 application adapter 负责。

## 结果与限制

`capture()` 返回：

```ts
interface UnitScreenshotResult {
  unitId: string;
  unitType: "sheet" | "doc" | "slide" | "board" | "base";
  images: readonly {
    name: string;
    mediaType: "image/png";
    bytes: Uint8Array;
    width: number;
    height: number;
    page?: number;
    range?: string;
    sheetName?: string;
    role?: "contact-slide" | "board-content";
    tiles?: number;
    pageId?: string;
    contentBounds?: ScreenshotBoundingBox;
    layoutAnalysis?: UniverBoardLayoutAnalysis;
    boardSelector?: { kind: "region" | "elements" /* selector data */ };
    padding?: number;
    scale?: number;
  }[];
}
```

Board `layoutAnalysis.issues` 可包含 connector endpoint、marker 与 terminal diagnostics，并通过可选
`endpoint` / `suggestedAction` 提供机器可读修复方向。这些字段会原样保留在截图结果中。

默认最多 30 页，每张图片的 `width × height` 最多为 `16,777,216` pixels（即 `4096 × 4096` 的面积），
但不要求宽和高分别小于 4096。可以在创建 capability 时覆盖：

```ts
const screenshot = createUnitScreenshot({
  runtime,
  limits: { maxPages: 10, maxPixels: 8_000_000 },
});
```

输入、页数、像素、render result 和 abort 错误分别使用 `UnitScreenshotError` 的结构化 `code`。底层浏览器和 render
错误由 `UniverRenderError` 表示。

## 调用方负责的内容

调用方负责提供最终 head-state UnitData。这个 package 不接受 path、Workspace resource、Snapshot provider
或 mutation stream，也不读取 Server、本地文件或 Collaboration Service；这些 target-specific 数据加载和
持久化行为应由 application adapter 完成。可选图片 resolver 只消费 adapter 返回的 bytes 与 media type，不拥有
asset transport。Capability 同样不写 PNG 文件、不输出终端文本，也不依赖 Commander。
