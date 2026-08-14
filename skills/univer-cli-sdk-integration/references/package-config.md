<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/config

`@univer-cli/config` 提供面向 CLI、Agent 和其他 adapter 的结构化本地配置能力。Application 声明
可用 key、内存默认值、描述和 codec；package 负责校验、读取 effective value、持久化用户显式值，以及返回
稳定的结构化结果。

package 内部使用 `conf` 完成 JSON 文件读写和原子替换，但不向使用者暴露 `conf`、配置 document 或 storage
interface。

## 安装

```bash
pnpm add @univer-cli/config
```

Node.js 版本要求为 `>=22.12.0`。

## 定义并创建配置

```ts
import { join } from "node:path";
import { configCodecs, createFileConfig, defineConfig } from "@univer-cli/config";

const applicationHome = join(process.cwd(), ".my-cli");

const definitions = defineConfig({
  "workspace.origin": {
    description: "Workspace service origin.",
    defaultValue: "https://workspace.univer.plus",
    codec: configCodecs.httpOrigin(),
  },
  "runtime.enabled": {
    description: "Enable the runtime.",
    codec: configCodecs.boolean(),
  },
});

const config = createFileConfig({
  definitions,
  path: join(applicationHome, "config.json"),
});
```

`path` 必须是 application 决定的绝对 `.json` 文件路径。`description`、`defaultValue` 和 codec 只保存在
内存中；配置文件只包含用户显式设置的值。

```json
{
  "workspace": {
    "origin": "https://example.com"
  }
}
```

## 读取与修改

```ts
const origin = await config.get({ key: "workspace.origin" });
const entries = await config.list();

await config.set({ key: "runtime.enabled", value: true });
await config.setFromText({ key: "runtime.enabled", text: "false" });
await config.unset({ key: "workspace.origin" });
```

`ConfigEntry.source` 明确表示 effective value 的来源：

- `config`：配置文件中存在用户显式值；
- `default`：没有显式值，读取内存中的默认值；
- `unset`：既没有显式值，也没有默认值。

`unset()` 只删除显式值，并返回删除后的 effective entry。默认值不会写入文件，因此 application 更新默认值
不需要改写用户配置。

## Codec

Codec 分别处理结构化值和文本值：

```ts
import type { ConfigCodec } from "@univer-cli/config";

const portCodec: ConfigCodec<number> = {
  parse(value) {
    if (typeof value !== "number" || !Number.isSafeInteger(value)) {
      throw new Error("Expected an integer port.");
    }
    return value;
  },
  parseText(text) {
    const value = Number(text);
    if (!Number.isSafeInteger(value)) throw new Error("Expected an integer port.");
    return value;
  },
};
```

内置 `configCodecs` 提供 `nonEmptyString`、`boolean`、`integer`、`enumeration`、`httpUrl` 和
`httpOrigin`。

## 持久化约束

- 新配置目录使用 `0700`，新配置文件使用 `0600`；
- mutation 在同一个 `Config` instance 内串行；
- 修改注册 key 时保留未注册字段；
- malformed JSON、无效持久化值和 dot-path shape conflict 不会被静默覆盖；
- package 不承诺多个进程同时写同一文件的正确性，application 应指定单一 writer；
- Cookie、token、登录 session 等 credential 不应存入普通 config。

## 不负责什么

本 package 不决定 application home、产品 key、环境变量/flag precedence、credential persistence、跨进程
锁、migration 或 Commander presentation。默认 Commander 交互由可选的
`@univer-cli/config-command` 提供。
