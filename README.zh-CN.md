# Univer CLI Skill

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer CLI Skill。把 `.univer` 文件交给 agent，并描述
期望的结果，Skill 会引导 agent 使用 Univer CLI 完成内容创作、结果验证和可视化检查。

访问 [univer.ai](https://univer.ai) 了解 Univer。

## 能做什么

- **构建电子表格** — 编辑值和公式，设置格式，以及操作表格、图表和形状。
- **创作文档和幻灯片** — 编写富文本内容、安排布局并检查渲染结果。
- **管理结构化数据** — 创建 Base 的表、字段、记录和视图。
- **使用开放画布** — 创建 Board 画布并添加可视化元素。
- **安全地与 agent 协作** — 使用 worktree 隔离修改、读回持久化模型，并交付浏览器 review 链接。
- **交换 Excel 文件** — 导入和导出 `.xlsx`，同时使用结构化 `.univer` 文件承载工作模型。

## 与 CLI 版本匹配的指引

这个仓库安装 Univer CLI 入口 Skill。它会引导 agent 从已安装的 CLI 加载 core 指引和对应的 Unit
Skill，使 command 和 Facade API 始终与当前版本一致。

Unit Skills 覆盖 Sheet、Doc、Slide、Base 和 Board：

```bash
univer skills list
univer skills get core
univer skills get board
```

## 安装

安装 Univer CLI：

```bash
npm install -g univer-cli@latest
univer doctor
```

安装 Skill：

```bash
npx skills add dream-num/skills
```

### 手动安装

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

## 示例 Prompts

```text
Use univer-cli to inspect this .univer file and update the formulas and formatting on its pricing sheet.
```

```text
Use univer-cli to create a Board, insert a shape, and open the viewer for review.
```

```text
Use univer-cli to create a Base with a contacts table, add a record, and verify the stored model.
```

## 环境要求

- Linux 或 macOS
- Node.js 和 npm
- 可通过 `univer` 命令使用 Univer CLI

## 参与贡献

- 入口 Skill 位于 [`skills/univer-cli/SKILL.md`](./skills/univer-cli/SKILL.md)。
- 与版本匹配的 operational Skills 和 resources 随 Univer CLI package 分发。
- 发布 Skill 变更前运行 `npm run validate`。

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
