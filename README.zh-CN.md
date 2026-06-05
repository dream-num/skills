# Official Univer Skills for Workbook Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-5-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer workbook automation skills。

这个仓库目前提供 canonical Univer product skills：

- [`using-univer-cli`](./skills/using-univer-cli/SKILL.md): workbook 任务的强制入口 skill
- [`univer-cli`](./skills/univer-cli/SKILL.md): 通过 `univer` 进行 path-first workbook work
- [`writing-univer-plans`](./skills/writing-univer-plans/SKILL.md): 写入 `<univerfile>.sac/plans/` 的 SaC workbook behavior plan
- [`executing-univer-plans`](./skills/executing-univer-plans/SKILL.md): plan review 和 pack-by-pack execution
- [`test-driven-univer-development`](./skills/test-driven-univer-development/SKILL.md): assertion-backed SaC TDD 和 verify repair loop

## 亮点

- **🧮 住在终端里的电子表格引擎**  
  直接从 CLI 驱动真实 workbook 语义：公式、格式、条件格式、图表、形状、布局、导入/导出和实时预览。

- **✅ 面向 workbook state 的 commits**  
  Agent 负责高速修改，人类 review 渲染后的结果；只有验证过的变更才会成为明确、可同步的 changeset。

- **☁️ 云端 workbook multiplayer**  
  基于 Univer 的 OT 协同层 clone、pull、sync 共享 workbook state，让跨机器、跨地域的 agents 可以协作处理同一份工作簿。

- **🔁 对 cells 做 pipeline，而不是拆文件**  
  通过 `pipe out` / `pipe in` 流式处理 sheet ranges，接入 shell 工具链，再把有边界的矩阵写回 workbook，不需要打开 univerfile 内部结构。

- **📊 Excel 兼容交付**  
  支持 `.xlsx` import/export；agent 内部处理的是结构化 Univer workbook state。

## 为什么是这些 Skills

这些 skills 覆盖互补的 workbook workflow：

- `using-univer-cli` 是 workbook 任务的强制入口，先把 agent 锁定在 Univer CLI 路径上，避免临时改用 spreadsheet libraries，再判断普通 workbook work 还是 SaC plan/execution/TDD workflow
- `univer-cli` 负责 workbook-visible work：`new`、`import`、`export`、`inspect`、`search`、`fill`、`run` 和 `pipe`
- `writing-univer-plans` 负责复杂 SaC workbook behavior planning，把 range roles、Migration Pack boundaries 和 assertion gates 写入 `<univerfile>.sac/plans/`
- `executing-univer-plans` 负责 review 已写好的 plan，并一次执行一个 Migration Pack
- `test-driven-univer-development` 负责 assertion-backed SaC TDD、`univer sac verify <univerfile> --json` 和 evidence-driven repair

用 `univer-cli` 做 workbook inspection、bounded edits、formula review、shell-native roundtrips 和 handoff verification。
当任务可能是普通 workbook automation，也可能是 SaC source authoring 时，先使用 `using-univer-cli`。
当 workbook behavior 应该作为 SaC source 构建，并通过 `assertions.ts` 验证时，使用 `writing-univer-plans`、`executing-univer-plans` 和 `test-driven-univer-development`。
Benchmark solver tasks 应该由 harness 提供 task-local `AGENTS.md` 约束，然后进入 `using-univer-cli` 和 SaC plan/execution/TDD skills。

## 快速安装

安装 workbook CLI：

```bash
npm install -g univer-cli@latest
```

安装这个 skill repository：

```bash
npx skills add dream-num/skills
```

手动安装官方 workflow skills：

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/using-univer-cli ~/.claude/skills/
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/writing-univer-plans ~/.claude/skills/
cp -R skills/executing-univer-plans ~/.claude/skills/
cp -R skills/test-driven-univer-development ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/using-univer-cli ~/.codex/skills/
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/writing-univer-plans ~/.codex/skills/
cp -R skills/executing-univer-plans ~/.codex/skills/
cp -R skills/test-driven-univer-development ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/using-univer-cli ~/.cursor/skills/
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/writing-univer-plans ~/.cursor/skills/
cp -R skills/executing-univer-plans ~/.cursor/skills/
cp -R skills/test-driven-univer-development ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`using-univer-cli`](./skills/using-univer-cli/SKILL.md) | workbook 任务的强制入口，把 workbook engine 固定为 Univer CLI，并在需要时 handoff 到 SaC TDD | 行动前选择正确 Univer 路径 | canonical |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`writing-univer-plans`](./skills/writing-univer-plans/SKILL.md) | Univerfile sidecar success criteria and SaC plans with workbook intent, range roles, Migration Pack sequence, and assertion gates | 修改 migration source 之前拆解复杂 workbook behavior | canonical |
| [`executing-univer-plans`](./skills/executing-univer-plans/SKILL.md) | Plan review and pack-by-pack execution for SaC workbook behavior | 不跳过 assertion gates 地执行已写好的 Univer plans | canonical |
| [`test-driven-univer-development`](./skills/test-driven-univer-development/SKILL.md) | Univerfile sidecar SaC TDD with assertion coverage, apply/verify, returned assertion evidence repair, and handoff gates | 用强 workbook-visible evidence 实现 Facade Migration Packs | canonical |

## 示例 Prompts

```text
Use using-univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use using-univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use using-univer-cli to build this complex workbook behavior as SaC source. Route through writing-univer-plans, executing-univer-plans, and test-driven-univer-development, write success criteria under <univerfile>.sac/success-criteria/ and the plan under <univerfile>.sac/plans/, add assertions.ts coverage, and complete only after univer sac verify <univerfile> --json passes with returned assertion evidence.
```


## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`
- SaC workflow skills: requires `univer` with experimental SaC enabled for `univer sac` workflows
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
