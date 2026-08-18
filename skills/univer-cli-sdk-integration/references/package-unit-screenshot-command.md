<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-screenshot-command

为 `@univer-cli/unit-screenshot` 提供原生 Commander `screenshot` command preset。它负责解析
target-neutral 的 Unit ID 和截图 options、调用 capability、交给注入的 writer 保存 PNG，并输出路径或 JSON
摘要。

## 安装

```bash
pnpm add commander @univer-cli/unit-screenshot-command
```

Commander 是 peer dependency，支持 `^15.0.0`。Node.js 版本要求为 `>=22.12.0`。Application 必须提供三个
依赖：已经创建的 `UnitScreenshot` capability、按可选 Unit ID 加载最终 `unitType + unitData` 的 loader，以及
保存结构化 PNG 结果的 writer。

```ts
import {
  createUnitScreenshotCommand,
  type UnitScreenshotCommandDependencies,
} from "@univer-cli/unit-screenshot-command";
import { Command } from "commander";

export async function runCli(dependencies: UnitScreenshotCommandDependencies): Promise<void> {
  const program = new Command("my-cli");
  program.addCommand(createUnitScreenshotCommand(dependencies));
  await program.parseAsync();
}
```

`dependencies.screenshot` 可由 `@univer-cli/unit-screenshot` 创建；`loadUnit()` 和 `writeImages()` 是
application port。Writer 必须按输入顺序返回 `{ name, location }[]`，且每个 `name` 与对应输入图片一致。
如果 application 直接创建标准 screenshot capability，还应把它声明为直接依赖：

```bash
pnpm add @univer-cli/unit-screenshot @univer-cli/univer-render-runtime
```

## Command

```text
screenshot [--unit <unit-id>] [--out <destination>] [--json]
screenshot setup [--force] [--json]
```

Unit 类型专用 options：

- Sheet：`--range <a1-range>`，可配合 `--sheet <name>`。
- Doc：没有类型专用 option，按 capability 的页数上限捕获 layout 后的页面。
- Slide：`--pages <pages>` 支持 `1,3-5,cover-slide`；省略或传 `all` 表示全部页面。可用
  `--contact-slide` 追加总览图，并用 `--tile <columns>x<rows>` 指定网格。
- Board：`--region <left,top,width,height>` 或 `--elements <id,...>`，两者互斥；可传
  `--padding <pixels>` 和 `--scale <factor>`，但两者都要求 selector。
- Base：没有类型专用 option。

未传类型专用 option 时，command 不构造 target，直接使用 screenshot capability 的默认行为。
`--unit` 省略时 command 调用 `loadUnit({})`，是否允许自动选择唯一 Unit、以及歧义时返回什么错误由 application
loader 决定。
`--out` 是不透明字符串，command 不解释它是目录、object key 还是其他目的地。默认文本输出 writer 返回的
location，每行一个；`--json` 输出 `{ ok, unitId, unitKind, outputs }`，包含图片元数据和 location，但不包含 PNG
bytes。

`screenshot setup` 先发现并真实启动已有 browser；没有可用 browser 时安装与 Puppeteer 匹配的固定 Chromium。
`--force` 跳过发现，直接确保固定版本存在。也可以单独使用
`createUniverRenderBrowserSetupCommand()`，或者通过 `browserSetup` dependency 注入自定义发现、安装和探活实现。

## 边界

这个 package 不读取 `.univer` 文件、不访问 Workspace、不解析 Snapshot/changeset、不创建 render runtime，也不
决定 PNG 如何持久化。Application 可以用本地文件、Collaboration Worktree、Workspace API 或其他数据源实现
`loadUnit()`，并用任意存储实现 `writeImages()`。Browser 本身的解析、安装和探活能力由
`@univer-cli/univer-render-runtime` 提供；本 package 只提供相应 Commander preset。
