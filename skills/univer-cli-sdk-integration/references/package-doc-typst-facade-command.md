<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/doc-typst-facade-command

`doc-typst-facade` capability 的可选 Commander 预设。它读取 Typst bundle，将生成的 Facade JavaScript
写到文件，并可输出 diagnostics 与 PNG preview。

```ts
import { Command } from "commander";
import { createCompileTypstCommand } from "@univer-cli/doc-typst-facade-command";

const program = new Command("my-cli");
program.addCommand(createCompileTypstCommand());
await program.parseAsync();
```

```bash
my-cli compile-typst ./paper --out ./generated/paper.js --diagnostics-out ./generated/diagnostics.json
```

该 command 只负责本地编译产物的 presentation，不创建 Univer runtime，也不连接 Workspace、
Worktree 或远程 API。需要直接复用编译能力时，使用
`@univer-cli/doc-typst-facade` 的 `compileDocTypstBundle()`。

使用者需要安装兼容的 `commander@^15`。
