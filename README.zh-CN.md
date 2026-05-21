# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer workbook automation skills。

这个仓库目前提供一个 canonical skill：

- [`univer-cli`](./skills/univer-cli/SKILL.md): 通过 `univer` / `unv` 进行 path-first workbook work

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

## 快速安装

安装 workbook CLI：

```bash
npm install -g univer-cli@latest
```

安装这个 skill repository：

```bash
npx skills add dream-num/skills
```

手动安装：

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |

## 示例 Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`; `unv` is the short alias
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
