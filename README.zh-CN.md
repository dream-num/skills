# Univer Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-7-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言：[English](./README.md) | [简体中文](./README.zh-CN.md)

面向 SDK 集成、Pro 产品、插件与主题开发、后端处理和 CLI 操作的官方 Univer Skills。

## Skills

| Skill | 用途 |
| --- | --- |
| [`univer-integrate`](./skills/univer-integrate/SKILL.md) | 嵌入 Univer Sheets、Docs 或 Slides，并使用当前 Facade API |
| [`univer-pro-integrate`](./skills/univer-pro-integrate/SKILL.md) | 集成授权版 Sheets、Docs、Slides、Bases、Boards、PDFs、协同、交换和 Pro 功能 |
| [`univer-node-backend`](./skills/univer-node-backend/SKILL.md) | 在 Node.js 中运行无头 Univer 模型和公式工作流 |
| [`univer-plugin-dev`](./skills/univer-plugin-dev/SKILL.md) | 开发插件、Commands、UI 扩展、事件和 Facade 扩展 |
| [`univer-customize-theme`](./skills/univer-customize-theme/SKILL.md) | 定制调色板、暗色模式、主题感知 UI 和 Pro Chart 主题 |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | 操作本地 `.univer` 文件 |
| [`univer-workspace-cli`](./skills/univer-workspace-cli/SKILL.md) | 操作远程 Workspace 文件 |

SDK Skills 跟随当前 Univer OSS 与 Pro 源码，覆盖 Sheets、Docs、Slides、Bases、Boards 和
PDFs。修改已有应用时应保留它实际安装的精确 package 版本，并在使用源码新增 API 前检查对应
exports 和 Facade 声明。

两个 CLI Skill 是彼此独立的 discovery 入口，并非核心与变体：`univer-cli` 操作本地
`.univer` 文件，`univer-workspace-cli` 操作远程 Workspace 文件。它们会从已安装的 CLI
加载版本匹配的 operational Skills：

```bash
univer skills get core
univer-workspace-cli skills get core
```

## 安装

安装全部 Skills：

```bash
npx skills add dream-num/skills
```

安装单个 Skill：

```bash
npx skills add dream-num/skills --skill univer-integrate
```

仅在任务需要操作对应应用时安装 CLI：

```bash
npm install -g univer-cli@latest
univer doctor

npm install -g univer-workspace-cli@latest
univer-workspace-cli config set-origin https://workspace.example.com
univer-workspace-cli doctor
```

### 手动安装

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/* ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/* ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/* ~/.cursor/skills/
```

## 示例 Prompts

```text
Use univer-integrate to embed a themed spreadsheet editor in this React application.
```

```text
Use univer-pro-integrate to add collaboration and XLSX exchange to this Sheets application.
```

```text
Use univer-plugin-dev to scaffold a command-driven plugin with a Facade extension.
```

```text
Use univer-cli to update this local .univer file and verify the result.
```

```text
Use univer-workspace-cli to edit this Workspace file in a new Worktree and return a review URL.
```

## 环境要求

- 使用 Node.js 和 npm 安装 Skills
- CLI 任务需要对应的 `univer` 或 `univer-workspace-cli` 命令
- SDK 任务需要目标应用实际安装的 Univer packages 和对应 release line

## 参与贡献

- CLI discovery Skills 位于 `skills/univer-cli` 和 `skills/univer-workspace-cli`；与版本匹配
  的 operational resources 随对应 CLI 分发。
- SDK Skills 的 `agents/`、`references/`、`assets/` 和 `scripts/` 资源保留在各自
  skill 目录中。
- 发布 Skill 变更前运行 `npm run validate`。

## License

本仓库使用 [Apache-2.0 License](./LICENSE)。
