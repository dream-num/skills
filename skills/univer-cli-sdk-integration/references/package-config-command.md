<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/config-command

`@univer-cli/config-command` 是 `@univer-cli/config` 的可选 Commander 预设。它返回原生
Commander `Command`，提供 `config path/list/get/set/unset`，并支持适合 Agent 消费的 `--json` 输出。

配置定义、验证、默认值解析和持久化属于 config capability；本 package 只负责 argv normalization、默认终端
文本和 Commander failure behavior。

## 安装

```bash
pnpm add @univer-cli/config @univer-cli/config-command commander
```

`commander` 是 peer dependency，支持 `^15.0.0`。
Node.js 版本要求为 `>=22.12.0`。

## 使用

```ts
import { join } from "node:path";
import { Command } from "commander";
import { configCodecs, createFileConfig, defineConfig } from "@univer-cli/config";
import { createConfigCommand } from "@univer-cli/config-command";

const applicationConfigPath = join(process.cwd(), ".my-cli", "config.json");

const config = createFileConfig({
  path: applicationConfigPath,
  definitions: defineConfig({
    "runtime.enabled": {
      description: "Enable the runtime.",
      defaultValue: true,
      codec: configCodecs.boolean(),
    },
  }),
});

const program = new Command("my-cli");
program.addCommand(createConfigCommand({ config }));
await program.parseAsync();
```

预设包含：

```text
config path
config list
config get <key>
config set <key> <value>
config unset <key>
```

每个子命令都支持 `--json`。例如：

```json
{
  "entry": {
    "key": "runtime.enabled",
    "description": "Enable the runtime.",
    "source": "default",
    "value": true,
    "defaultValue": true
  }
}
```

`set` 使用 definition codec 的 `parseText()`。`unset` 输出删除显式值后的 effective entry，因此结果可能是
`default`，也可能是 `unset`。

## 自定义交互

使用者可以不安装本 package，直接调用 config capability 编写自己的 Commander command、Agent tool、server
adapter 或其他 presentation：

```ts
const entry = await config.get({ key: "runtime.enabled" });
renderWithMyOwnFormat(entry);
```

本 package 不创建 root program、不决定配置文件路径、不声明产品 key，也不处理 credential、环境变量或 flag
precedence。
