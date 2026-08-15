<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/svg-facade-command

为 `@univer-cli/svg-facade` 提供默认的原生 Commander `compile-svg` command。它读取 SVG 与本地引用、
调用 compiler、输出 Facade code 或 JSON，并把有损 warnings 与 authoring lints 写到 stderr。

## 安装

```bash
pnpm add commander @univer-cli/svg-facade @univer-cli/svg-facade-command
```

Commander `^15.0.0` 是 peer dependency。Node.js 版本要求为 `>=22.12.0`。

## 使用

```ts
import { createCompileSvgCommand } from "@univer-cli/svg-facade-command";
import { createMySvgTextMeasurer } from "./text-measurer.js";
import { Command } from "commander";

const program = new Command("my-cli");
program.addCommand(
  createCompileSvgCommand({
    textMeasurer: createMySvgTextMeasurer(),
  }),
);

await program.parseAsync();
```

`textMeasurer` 是必需 dependency。默认 preset 不会在真实量字器失败时静默回落；若调用方明确接受离线估算，
可以注入 `builtinTextMeasurer`，或让用户使用 `--estimate-text-size`。

## 命令

```text
compile-svg <file.svg> [--json] [--estimate-text-size]
compile-svg <file.svg> --page <n> [--add] [--out <path>] [--json]
```

- 无 `--page`：输出假定 `slide` 与 `univerAPI` 已存在的 Facade snippet。
- `--page <n>`：输出假定 `presentation` 与 `univerAPI` 已存在的自闭合 Slide page program。
- `--add`：保留目标页现有 elements；缺省为 replace。
- `--out`：把生成 code 写入文件；必须与 `--page` 一起使用。
- `--json`：输出 `code`、`warnings`、`lints`、`viewport`、`textMeasure`，以及可选 page/out metadata。
- `--estimate-text-size`：显式使用内置估算并产生一条 lint。

本地 image 和 SVG sprite 引用相对输入 SVG 所在目录解析。HTTP(S) URL 保留给后续 Facade runtime。

## 输出与错误

普通模式下，生成 code 写 stdout；warning/lint 写 stderr，避免污染可重定向的 code。Compiler error 通过
Commander 以 `compile-svg.failed` 和非零退出码报告。调用方仍可使用 Commander 的 `configureOutput()`、
`exitOverride()`、hook 和 help customization。

## 职责边界

本 package 不定义 Workspace、Worktree、`.univer` path、Unit ID、authentication、runtime lease、commit、
upload 或 `--apply`。需要 compile-and-apply 的 application 应直接使用 `svg-facade` capability 定义自己的
target-specific Commander command，并将生成 program 交给自己的 content execution adapter。
