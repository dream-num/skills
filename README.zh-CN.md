# Official Univer CLI Skill for Workbook Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer product skill。公共入口是
[univer.ai](https://univer.ai)。

这个仓库只分发一个 canonical product skill：

- [`univer-cli`](./skills/univer-cli/SKILL.md): 说明 public `univer` CLI 和 SaC 能力，包括
  `.univer` target、workbook evidence、managed inspect tools、migration packs、verify、preview、
  worktrees、import、export 和 handoff。

## 亮点

- **终端里的电子表格引擎**  
  通过 public `univer` CLI 驱动真实 workbook 语义：公式、格式、条件格式、图表、形状、布局、导入/导出和预览。

- **Evidence-first workbook work**  
  通过 managed inspect tools、readonly probes、view、verify 和 export/readback 理解并证明 workbook-visible state。

- **Source-backed durable changes**  
  通过 SaC sidecar、Facade Migration Packs、templates、apply、rollback 和 verify 构建可重复的 workbook behavior。

- **Excel 兼容交付**  
  支持 `.xlsx` import/export；agent 内部处理结构化 `.univer` workbook state。

## 为什么只保留一个 Skill

`univer-cli` 是 product skill，不是 agent workflow package。它解释 Univer CLI 和 SaC 的 public
surfaces、evidence boundaries 和 best practices。Agent 可以使用 runtime 或用户选择的任意 planning
方法。

这个 skill 使用 progressive disclosure：

- `skills/univer-cli/SKILL.md` 是唯一必读入口。
- `skills/univer-cli/references/` 存放更长的 capability notes 和 checked recipes。
- `skills/univer-cli/inspect-tools/` 存放 managed readonly inspect tool resources，通过
  `univer inspect --tool` 使用。

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

## Available Skill

| Skill | Best for | Status |
| --- | --- | --- |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | workbook inspection、`.univer` targets、managed inspect tools、SaC authoring、apply/rollback/verify、preview、worktrees、import/export 和 handoff | canonical |

## 示例 Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import --file ./input.xlsx into ./Budget.univer, inspect the target unit and relevant ranges, then create a durable SaC migration for the requested workbook change.
```

```text
Use univer-cli to create a migration from a suitable template if workbook-visible evidence matches one; otherwise create an ordinary migration pack, apply it, and verify the applied behavior.
```

## Requirements

- OS: Linux or macOS
- 已安装可执行命令 `univer`
- 常见 shell roundtrip 工具：`awk`、`sed` 和 Node.js

## Contributing

- product skill source 保持在 `skills/univer-cli/`
- `SKILL.md` 保持简洁，长 capability notes 放到一层 `references/`
- managed inspect tools 保持在 `skills/univer-cli/inspect-tools/`
- 发布 skill package 变更前运行 `npm run validate`

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
