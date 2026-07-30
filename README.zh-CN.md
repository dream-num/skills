# Univer CLI Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer CLI Skills。把本地 `.univer` 文件或远程
Workspace 任务交给 agent，并描述期望的结果；对应 Skill 会引导 agent 完成内容创作、结果验证和
可视化检查。

访问 [univer.ai](https://univer.ai) 了解 Univer。

## 能做什么

- **构建电子表格** — 编辑值和公式，设置格式，以及操作表格、图表和形状。
- **创作文档和幻灯片** — 编写富文本内容、安排布局并检查渲染结果。
- **管理结构化数据** — 创建 Base 的表、字段、记录和视图。
- **使用开放画布** — 创建 Board 画布并添加可视化元素。
- **安全地与 agent 协作** — 使用 worktree 隔离修改、读回持久化模型，并交付浏览器 review 链接。
- **自动化远程 Workspace 文件** — 在 Personal 或 Team Space 中发现文件，将其加入 task
  Worktree，并在不自动 merge 的前提下交付 review URL。
- **交换 Excel 文件** — 导入和导出 `.xlsx`，同时使用结构化 `.univer` 文件承载工作模型。

## 与 CLI 版本匹配的指引

这个仓库安装两个入口 Skills：

- [`univer-cli`](./skills/univer-cli/SKILL.md) 用于本地 `.univer` 文件。
- [`univer-workspace-cli`](./skills/univer-workspace-cli/SKILL.md) 用于远程 Workspace 文件。

每个入口都会引导 agent 从已安装的 CLI 加载 core 指引和对应的 Unit Skill，使 command 和
Facade API 始终与当前版本一致。Univer CLI 覆盖 Sheet、Doc、Slide、Base 和 Board；Workspace
CLI 当前覆盖 Sheet、Doc 和 Slide。

```bash
univer skills list
univer skills get core
univer-workspace-cli skills list
univer-workspace-cli skills get core
```

## 安装

按任务安装对应 CLI：

```bash
npm install -g univer-cli@latest
univer doctor

npm install -g univer-workspace-cli@latest
univer-workspace-cli config set-origin https://workspace.example.com
univer-workspace-cli doctor
```

安装 Skills：

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
cp -R skills/univer-workspace-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/univer-workspace-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/univer-workspace-cli ~/.cursor/skills/
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

```text
Use univer-workspace-cli to find the quarterly report in my Team Space, update it in a new Worktree, verify the result, and give me the review URL without merging.
```

## 环境要求

- Linux 或 macOS
- Node.js 和 npm
- 可通过 `univer` 或 `univer-workspace-cli` 命令使用对应 CLI

## 参与贡献

- 入口 Skills 位于 `skills/<cli-name>/SKILL.md`。
- 与版本匹配的 operational Skills 和 resources 随对应 CLI package 分发。
- 发布 Skill 变更前运行 `npm run validate`。

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
