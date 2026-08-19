<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Univer CLI SDK

一套面向 TypeScript 开发者的 Univer CLI 基础设施，帮助开发者快速构建符合自身业务的 Univer CLI 应用。

[快速开始](#快速开始) · [功能包一览](#功能包一览) · [SDK 边界](#sdk-边界) · [应用示例](#应用示例)

Univer CLI SDK 把 [Univer](https://github.com/dream-num/univer) 的 headless 内容执行、协同编辑、结构化内容读取、
Office 文件转换、截图和本地进程管理整理成可单独安装的功能包，并为常用功能提供现成的 Commander 命令预设。

开发者可以按需组合这些功能，将精力放在业务逻辑、产品交互和外部系统集成上。

这是一个 SDK，不是固定形态的产品 CLI，也不引入新的 CLI framework。业务应用仍然使用原生 Commander
`addCommand()` 选择需要的命令，并保留对命令名称、参数、输出和错误处理的完整控制。

## 它能帮助你做什么

- **快速搭建业务 CLI**：复用通用的 Univer CLI 功能和运行基础设施。
- **按需选择功能**：只安装需要的 package；命令预设不会创建或接管你的根 CLI。
- **灵活设计交互**：既可以使用现成 Commander 命令，也可以基于结构化 TypeScript API 编写自己的业务命令。
- **自主完成外部集成**：业务应用决定如何连接外部系统，SDK 不限制具体集成方式。
- **复用稳定的 runtime**：headless、协同、渲染和进程运行基础设施由 SDK 统一维护。

## 快速开始

需要 Node.js 22.12 或更高版本。

> **发布状态：** 当前 packages 通过 Univer Insiders registry 发布。安装前需要为 `@univer-cli` scope
> 配置对应 registry；具体版本以所使用的 release 通道为准。

```ini
@univer-cli:registry=https://insider-npm-registry.univer.work/
```

以给业务 CLI 加入离线 Univer Facade API 查询为例。只需要查询功能时，可以直接调用基础功能包：

```bash
pnpm add @univer-cli/api-reference
```

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";

const reference = createStandardApiReference();
const matches = reference.find({
  terms: ["conditional formatting"],
  unit: "sheet",
  limit: 10,
});
```

需要现成的终端交互时，再安装对应的命令预设包，并把它加入现有 Commander 应用：

```bash
pnpm add commander @univer-cli/api-reference @univer-cli/api-reference-command
```

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

const program = new Command("my-cli");

program.addCommand(
  createApiCommand({
    reference: createStandardApiReference(),
  }),
);

await program.parseAsync();
```

构建应用后即可使用：

```bash
my-cli api find conditional formatting --unit sheet
my-cli api show FRange.setValues
```

如果默认命令不适合产品交互，可以跳过 `@univer-cli/api-reference-command`，直接使用
`@univer-cli/api-reference` 的结构化查询 API，自行设计命令名称、参数与输出。其他功能也遵循相同模式。

## 两种集成方式

```text
业务 CLI 应用
├── 直接调用基础功能包 ───────────────> 结构化结果 ──> 自定义业务交互
└── addCommand(命令预设) ──> 原生 Command ──> 基础功能包
```

基础功能包包含完整的功能、规则和输入校验，接收结构化输入并返回结构化结果，不依赖 Commander 或终端。
名称以 `-command` 结尾的命令预设包负责参数、选项、help、默认输出和退出行为，并返回原生 Commander
`Command`。业务应用在组装入口中注入依赖并选择需要的命令：

```ts
program.addCommand(createSomeCommand(dependencies));
```

调用方仍然可以使用 Commander 的 `configureOutput()`、`exitOverride()`、hooks、aliases 和自定义 help。

## 功能包一览

### Univer 内容与协同 runtime

| 业务需求                      | 基础功能包                                                                                                    | 可选命令预设包                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 创建标准 headless Univer      | [`@univer-cli/headless-univer`](./package-headless-univer.md)                                     | —                                                                                               |
| 离线查询 Univer Facade API    | [`@univer-cli/api-reference`](./package-api-reference.md)                                         | [`@univer-cli/api-reference-command`](./package-api-reference-command.md)           |
| 准备并绑定 Facade execution   | [`@univer-cli/content-execution`](./package-content-execution.md)                                 | —                                                                                               |
| 读取 Sheet、Doc 或 Slide 内容 | [`@univer-cli/content-inspection`](./package-content-inspection.md)                               | [`@univer-cli/content-inspection-command`](./package-content-inspection-command.md) |
| 运行单个协同 Unit             | [`@univer-cli/univer-collaboration-runtime`](./package-univer-collaboration-runtime.md)           | —                                                                                               |
| 在 worker 中复用协同 runtime  | [`@univer-cli/univer-collaboration-runtime-pool`](./package-univer-collaboration-runtime-pool.md) | —                                                                                               |

### 转换

| 业务需求                        | 基础功能包                                                                  | 可选命令预设包                                                                              |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Office 文件与 UnitData 互转     | [`@univer-cli/unit-exchange`](./package-unit-exchange.md)       | —                                                                                           |
| SVG 到 Slide Facade code        | [`@univer-cli/svg-facade`](./package-svg-facade.md)             | [`@univer-cli/svg-facade-command`](./package-svg-facade-command.md)             |
| Typst bundle 到 Doc Facade code | [`@univer-cli/doc-typst-facade`](./package-doc-typst-facade.md) | [`@univer-cli/doc-typst-facade-command`](./package-doc-typst-facade-command.md) |

### 渲染与诊断

| 业务需求                      | 基础功能包                                                                            | 可选命令预设包                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Unit PNG 截图                 | [`@univer-cli/unit-screenshot`](./package-unit-screenshot.md)             | [`@univer-cli/unit-screenshot-command`](./package-unit-screenshot-command.md)   |
| Slide layout lint             | [`@univer-cli/unit-layout-lint`](./package-unit-layout-lint.md)           | [`@univer-cli/unit-layout-lint-command`](./package-unit-layout-lint-command.md) |
| 托管 Render Page 并驱动浏览器 | [`@univer-cli/univer-render-runtime`](./package-univer-render-runtime.md) | —                                                                                           |
| 组装并构建 Render Page        | [`@univer-cli/univer-render-page`](./package-univer-render-page.md)       | —                                                                                           |

### 进程与生命周期基础设施

| 业务需求                              | 基础功能包                                                                                        | 可选命令预设包                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 按 key 独占、缓存和回收有状态对象     | [`@univer-cli/generic-keyed-instance-pool`](./package-generic-keyed-instance-pool.md) | —                                                                       |
| 让多个 CLI 进程访问同一个本地常驻进程 | [`@univer-cli/daemon`](./package-daemon.md)                                           | [`@univer-cli/daemon-command`](./package-daemon-command.md) |

### 应用辅助功能

| 业务需求                   | 基础功能包                                                                  | 可选命令预设包                                                                              |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 声明、读取和持久化应用配置 | [`@univer-cli/config`](./package-config.md)                     | [`@univer-cli/config-command`](./package-config-command.md)                     |
| 查询、缓存和导出视觉资源   | [`@univer-cli/resource-library`](./package-resource-library.md) | [`@univer-cli/resource-library-command`](./package-resource-library-command.md) |

不知道该选择哪个 package 时，先按业务需求找到对应的基础功能包；如果希望快速获得默认 CLI 交互，再安装同一行的
命令预设包。每个 package README 都包含安装方式、公共 API、最小示例、行为限制以及运行依赖。

## SDK 边界

一个完整的业务 CLI 通常由三个 SDK 和业务应用共同组成：

| 层                       | 负责什么                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Univer / Univer Pro SDK  | Unit 数据模型、Facade API、mutation、render 与内容格式。                           |
| Univer Collaboration SDK | Snapshot、changeset、revision、OT、Worktree、协同 Service 与持久化 SPI。           |
| Univer CLI SDK           | 标准 headless factory、通用 CLI 功能、runtime pool、daemon 和 Commander 命令预设。 |
| 业务 CLI 应用            | 业务逻辑、产品交互与外部系统集成。                                                 |

Univer CLI SDK 只通过另外两个 SDK 的公开 API 使用它们，不复制内容模型、协同协议或存储实现。通用 CLI
基础设施由本仓库提供；业务逻辑和外部集成由具体应用实现。

## 应用示例

完成基础接入后，你可以通过以下完整应用了解这些功能如何组合使用：

- [`univer-cli`](https://github.com/dream-num/univer-cli)：面向本地 `.univer` 文件。
- [`univer-workspace/apps/cli`](https://github.com/dream-num/univer-workspace/tree/main/apps/cli)：面向远程 Workspace。

可以根据自己的本地或远程使用场景，参考相应项目的结构和集成方式。
