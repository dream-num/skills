# Official Univer CLI Discovery Skill

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer CLI discovery skill。公共入口是
[univer.ai](https://univer.ai)。

这个仓库只分发一个 canonical product skill：

- [`univer-cli`](./skills/univer-cli/SKILL.md): 安装、诊断 public `univer` CLI，并从已安装
  package 加载版本匹配的 core 和 Unit Skills。

## 亮点

- **一个 CLI 覆盖全部 Unit 类型**
  在明确的 `.univer` target 中操作 Sheet、Doc、Slide、Base 和 Board Unit。

- **版本匹配的操作指引**
  从已安装 CLI 加载 core 和 Unit Skills，确保 command 和 Facade API 与版本一致。

- **Evidence-first authoring**
  handoff 前读回持久化 model，并检查渲染结果。

- **Excel 兼容交付**  
  支持 `.xlsx` import/export；agent 内部处理结构化 `.univer` workbook state。

## 为什么只保留一个 Skill

`univer-cli` 是隐藏的 discovery skill，不是 operational documentation 的第二份副本。它负责安装或
诊断 CLI，并引导 agent 加载 CLI 自带的 core 和 Unit Skills。运行时 Skills 才是 command、Facade API
和验证行为的权威来源。

这个 skill 使用 progressive disclosure：

- `skills/univer-cli/SKILL.md` 是这个仓库的完整 payload。
- `univer skills get core` 加载共享 operational Skill。
- `univer skills get sheet|doc|slide|base|board` 加载 Unit-specific guidance。

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
| [`univer-cli`](./skills/univer-cli/SKILL.md) | CLI 安装、诊断和版本匹配的 Skill discovery | canonical |

## 示例 Prompts

```text
Use univer-cli to inspect this .univer file and update its pricing sheet.
```

```text
Use univer-cli to create a Board, insert one shape, and open the viewer for review.
```

```text
Use univer-cli to create a Base, add a table and record, then verify the stored model.
```

## Requirements

- OS: Linux or macOS
- 已安装可执行命令 `univer`
- 用于安装的 Node.js 和 npm

## Contributing

- discovery skill source 保持在 `skills/univer-cli/SKILL.md`
- operational Skills 和 resources 在 Univer CLI package 内保持版本匹配
- 不要在这个仓库重复 runtime command 或 Facade guidance
- 发布 skill package 变更前运行 `npm run validate`

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
