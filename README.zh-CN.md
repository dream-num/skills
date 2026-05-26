# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer workbook automation skills。

这个仓库目前提供 canonical Univer product skills：

- [`univer-cli`](./skills/univer-cli/SKILL.md): 通过 `univer` / `unv` 进行 path-first workbook work
- [`univer-spreadsheet-tdd`](./skills/univer-spreadsheet-tdd/SKILL.md): 基于 SaC 的 Spreadsheet TDD，使用 `assertions.ts` 和 `univer sac verify`

## 亮点

- **🧮 住在终端里的电子表格引擎**  
  直接从 CLI 驱动真实 workbook 语义：公式、格式、条件格式、图表、形状、布局、导入/导出和实时预览。

- **✅ 面向 workbook state 的 commits**  
  Agent 负责高速修改，人类 review 渲染后的结果；只有验证过的变更才会成为明确、可同步的 changeset。

- **☁️ 云端 workbook multiplayer**  
  基于 Univer 的 OT 协同层 clone、pull、sync 共享 workbook state，让跨机器、跨地域的 agents 可以协作处理同一份工作簿。

- **🔁 对 cells 做 pipeline，而不是拆文件**  
  通过 `pipe out` / `pipe in` 流式处理 sheet ranges，接入 shell 工具链，再把有边界的矩阵写回 workbook，不需要打开 workbook 包内部结构。

- **📊 Excel 兼容交付**  
  支持 `.xlsx` import/export；agent 内部处理的是结构化 Univer workbook state。

## 为什么是这两个 Skills

这两个 skills 覆盖互补的 workbook workflow：

- `univer-cli` 负责 workbook-visible work：`new`、`import`、`export`、`inspect`、`search`、`fill`、`run` 和 `pipe`
- `univer-spreadsheet-tdd` 负责 SaC / Facade Migration Pack authoring，用 assertions 驱动 feedback loop

用 `univer-cli` 做 workbook inspection、bounded edits、formula review、shell-native roundtrips 和 handoff verification。
当 workbook behavior 应该作为 SaC source 构建，并通过 `assertions.ts` 验证时，使用 `univer-spreadsheet-tdd`。

## 快速安装

安装 workbook CLI：

```bash
npm install -g univer-cli@latest
```

安装这个 skill repository：

```bash
npx skills add dream-num/skills
```

手动安装一个或两个官方 skills：

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/univer-spreadsheet-tdd ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/univer-spreadsheet-tdd ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/univer-spreadsheet-tdd ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`univer-spreadsheet-tdd`](./skills/univer-spreadsheet-tdd/SKILL.md) | SaC-based Spreadsheet TDD with plan-first migration decomposition, `assertions.ts`, apply, verify, repair, and repeat | Facade Migration Pack authoring, assertion-backed migration feedback loops, multi-migration workbook source projects | canonical |

## 示例 Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use univer-spreadsheet-tdd to build this workbook behavior as SaC source, with focused migrations and assertions.ts verification gates.
```

## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`; `unv` is the short alias
- `univer-spreadsheet-tdd` skill: requires `univer` with experimental SaC enabled for `univer sac` workflows
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
