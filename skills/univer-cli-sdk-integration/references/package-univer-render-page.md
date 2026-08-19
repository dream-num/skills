<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-render-page

English | 简体中文

Helps the application build a browser Render Page for `@univer-cli/univer-render-runtime` to load.

The package creates Univer inside the page, implements render operations, mounts the page protocol, and provides a ready-to-use Univer / Univer Pro composition. It does not start the browser itself.

## Installation

```bash
pnpm add @univer-cli/univer-render-page
pnpm add -D vite
```

Requires Node.js 22.12 or higher. The application must build the final page as a static directory with `index.html` at its root.

## Quick Start

Browser entry:

```ts
import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("#app is required");

await mountUniverRenderPage({
  container,
  createUniver: createPresetRenderUniver,
});
```

Minimal HTML:

```html
<!doctype html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

After building with Vite or other bundler, set the output directory as `renderPageRoot` for the render runtime.

## Custom Univer composition

If the preset registers unnecessary plugins, or the application has custom plugins, inject your own `createUniver`:

```ts
await mountUniverRenderPage({
  container,
  createUniver: async (context) => createApplicationUniver(context),
});
```

The factory must register the content, rendering, UI, and Facade extensions required by the target Unit. The mount function handles only shared operations, Unit lifecycle, and the page protocol; it does not add missing plugins.

## License bootstrap

The preset includes Pro plugins. The Node runtime can inject a license through read-only bootstrap before the page script runs, so the license does not need to be written into the static bundle. Rendering remains available without a valid license, but the output follows the Univer Pro SDK watermark rules.

## Security and boundaries

The Render Page processes incoming UnitData. Do not render untrusted content in a high-privilege browser environment with access to sensitive files or networks. The application should restrict the browser process's system permissions and network access.

The package does not install or launch a browser, host static directories, or provide a Node.js screenshot API. Those responsibilities belong to
[`@univer-cli/univer-render-runtime`](./package-univer-render-runtime.md).
