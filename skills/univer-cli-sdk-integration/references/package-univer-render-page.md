<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-render-page

帮助 application 构建一个供 `@univer-cli/univer-render-runtime` 加载的 browser 页面。它在页面内创建 Univer、
实现渲染操作并挂载 page protocol，同时提供一套可直接使用的完整 Univer / Univer Pro composition。

这个 package 本身不启动浏览器，也不提供 Node 截图函数。完整链路是：

```text
@univer-cli/unit-screenshot 或 @univer-cli/unit-layout-lint
  -> @univer-cli/univer-render-runtime     Node 侧启动浏览器、托管静态目录
  -> application 构建的 Render Page       browser 侧真正渲染 Unit
       ^
       @univer-cli/univer-render-page      提供 mount 函数、渲染操作和预设 factory
```

如果目标是获得 PNG，请从
[`@univer-cli/unit-screenshot`](./package-unit-screenshot.md) 开始；如果目标是 Slide layout 检查，请从
[`@univer-cli/unit-layout-lint`](./package-unit-layout-lint.md) 开始。只有在第一次接入渲染能力或需要调整 Univer
plugins 时，才需要关注本 package。

## 安装

```bash
pnpm add @univer-cli/univer-render-page @univer-cli/univer-render-runtime
pnpm add -D vite
```

## 构建 Render Page

下面以 Vite 为例。Application 需要拥有这三个文件；文件名和目录可以自行调整。

`src/render-page.ts`：

```ts
import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("#app is required");

await mountUniverRenderPage({
  container,
  createUniver: createPresetRenderUniver,
});
```

对应的 HTML 仍由 application 拥有：

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html,
      body,
      #app {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      body {
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/render-page.ts"></script>
  </body>
</html>
```

`vite.config.ts`：

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist/render-page",
  },
});
```

执行 `vite build` 后会得到 `dist/render-page/index.html`。把整个静态目录随 application 发布，并在 Node 侧
创建 runtime：

```ts
import { fileURLToPath } from "node:url";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";

const renderPageRoot = fileURLToPath(new URL("../dist/render-page", import.meta.url));
const runtime = await createUniverRenderRuntime({
  renderPageRoot,
});
```

上面的路径以 Node entry 位于 application 的 `src/` 为例；发布时应根据最终 entry 与静态目录的位置调整，并确保
Render Page 构建产物进入 application 的发布文件。

这个 runtime 可以注入 [`@univer-cli/unit-screenshot`](./package-unit-screenshot.md)、
[`@univer-cli/unit-layout-lint`](./package-unit-layout-lint.md)，也可以直接调用低层 `render()`、
`measureText()` 或 `captureSlideLayout()`。浏览器安装、生命周期和运行隔离要求见
[`@univer-cli/univer-render-runtime`](./package-univer-render-runtime.md)。

`createPresetRenderUniver` 注册 Sheet、Doc、Slide、Board、Base、Embed 及相应 Pro/UI plugins、Facade extensions、
locale 和样式，适合希望直接支持全部标准 screenshot 和 layout-lint 行为的 application。大多数用户应先使用这个
预设；只有需要缩小 bundle、替换 adapter 或改变 plugins 时再提供自定义 factory。

## 使用自定义 factory

Application 可以替换预设，只组装自己需要的 Univer plugins：

```ts
import { Univer } from "@univerjs/core";
import { mountUniverRenderPage } from "@univer-cli/univer-render-page";

await mountUniverRenderPage({
  container,
  createUniver: ({ container }) => {
    const univer = new Univer({});
    registerCommunityPlugins(univer, { container });
    return univer;
  },
});
```

`CreateRenderUniver` 可以同步或异步返回 `Univer`。自定义 composition 必须注册实际 Unit 类型和 render operation
所需的 plugins；`mountUniverRenderPage()` 只负责共享操作实现、Unit lifecycle 和 page protocol，不补齐缺失的
Univer plugins。

## License bootstrap

Application 不需要读写 `window.__univerRenderLicense`，也不需要把 license 显式传给
`mountUniverRenderPage()`。Node runtime 会在页面脚本执行前安装只读的
`window.__univerRenderPageBootstrap`；配置了 license 时，mount 函数才通过 factory context 传递它。没有
license 时，自定义 community-only factory 仍可正常创建，预设 Pro factory 也可以运行并按 Univer Pro SDK 的
规则显示水印。页面就绪后，mount 函数把 versioned RPC API 发布为 `window.__univerRenderPage`。

这个 bootstrap 是 runtime 与 Render Page 之间的内部传输接口，并不是保密存储；Render Page 不应加载不可信的
第三方脚本。

## 公共 API

- `mountUniverRenderPage(options)`：创建 Univer，挂载 Render Page protocol，并返回 `UniverRenderPageApi`。
- `createPresetRenderUniver(context)`：创建 SDK 预设的完整 browser Univer composition。
- `CreateRenderUniver`、`CreateRenderUniverContext`、`MountUniverRenderPageOptions`：自定义 factory 与 mount
  options 的类型。

## 职责边界

本 package 不创建 HTML、不运行 bundler、不启动浏览器、不读取环境变量或文件，也不加载 Snapshot、changeset
或远程资源。Application 负责 browser entry、构建产物路径与外部数据 adapter；
`@univer-cli/univer-render-runtime` 负责静态托管、可选 license bootstrap、browser lifecycle 和 Node 到页面的
RPC。
