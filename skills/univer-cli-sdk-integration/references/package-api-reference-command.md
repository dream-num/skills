<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/api-reference-command

为 Univer Facade API 查询提供一套可直接使用的 Commander 命令。它适合希望快速获得 `api find` 和
`api show` 交互的 CLI；如果默认命令名称、参数或输出不符合产品需求，也可以直接使用
`@univer-cli/api-reference` 编写自己的 command。

这个 package 只提供可选的命令预设。返回值是原生 Commander `Command`，不会引入额外 CLI
framework，也不会创建 root program。

## 它解决什么问题

调用方提供一个 `ApiReference`，本 package 把它映射为 `api find`、`api show`、help、默认文本输出和
Commander exit behavior。它不读取 declaration，也不决定 reference 从标准 artifact 还是自定义
artifact 创建。

## 安装

需要 Node.js 22.12 或更高版本。

```bash
pnpm add commander @univer-cli/api-reference @univer-cli/api-reference-command
```

`commander` 是 peer dependency，支持 `^15.0.0`。

## 直接使用预设 command

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

预设提供以下命令：

```text
my-cli api find <term...> [--unit sheet|slide|doc]
my-cli api show <symbol...>
my-cli api <symbol...>
```

最后一种形式是 `api show` 的简写。`find` 用于按关键词发现 API；`show` 用于查看准确的 class、member
或 type。一次 `show` 可以接收多个 symbol；有效结果会正常输出，未找到的 symbol 会合并为一次
Commander 错误并使用退出码 `1`。

## 配置预设 command

因为返回的是原生 `Command`，可以继续使用 Commander 配置名称、输出、help、hook 和错误处理：

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

const program = new Command("my-cli");
const apiCommand = createApiCommand({
  reference: createStandardApiReference(),
})
  .name("reference")
  .alias("api");

apiCommand.configureOutput({
  writeOut: (text) => process.stdout.write(text),
  writeErr: (text) => process.stderr.write(text),
});
apiCommand.exitOverride();

program.addCommand(apiCommand);
```

## 编写自己的 command

如果需要不同参数、JSON 输出或产品特定交互，不必使用本 package。直接调用
`@univer-cli/api-reference` 的结构化查询能力即可：

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";
import { Command } from "commander";

const reference = createStandardApiReference();
const program = new Command("my-cli");
const lookup = new Command("lookup").argument("<terms...>").action((terms: string[]) => {
  const results = reference.find({ terms, limit: 10 });
  process.stdout.write(`${JSON.stringify(results)}\n`);
});

program.addCommand(lookup);
```

这样 capability 仍负责查询语义，调用方自己决定 Commander 交互和 presentation。

## 公共导出

- `createApiCommand({ reference }): Command`：创建预设 command group。
- `ApiReferenceCommandDependencies`：factory 的依赖类型，目前只包含一个 `ApiReference`。

本 package 不负责 reference 查询语义、declaration 编译或 root program 生命周期。
