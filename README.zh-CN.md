# Univer CLI Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言: [English](./README.md) | [简体中文](./README.zh-CN.md)

面向 Claude Code、Codex 和 Cursor 的官方 Univer CLI Skills。它们既可以引导 agent 操作
`.univer` 内容，也可以把 Univer CLI、Gateway 与 Cowork 集成到自己的系统。

访问 [univer.ai](https://univer.ai) 了解 Univer。

## 能做什么

- **构建电子表格** — 编辑值和公式，设置格式，以及操作表格、图表和形状。
- **创作文档和幻灯片** — 编写富文本内容、安排布局并检查渲染结果。
- **管理结构化数据** — 创建 Base 的表、字段、记录和视图。
- **使用开放画布** — 创建 Board 画布并添加可视化元素。
- **安全地与 agent 协作** — 使用 worktree 隔离修改、读回持久化模型，并交付浏览器 review 链接。
- **交换 Excel 文件** — 导入和导出 `.xlsx`，同时使用结构化 `.univer` 文件承载工作模型。
- **构建基于 Univer 的应用** — 在不预设产品形态的前提下，把 CLI 进程、Agent 指引、
  daemon/Gateway 与 Cowork UI 接入已有宿主。

## 选择 Skill

| Skill | 适用场景 |
| --- | --- |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | 创建、检查、编辑、验证、导入或导出 Univer 内容 |
| [`integrate-univer-cli`](./skills/integrate-univer-cli/SKILL.md) | 在宿主系统中选择、获取、连接、定制并交付 CLI/Gateway/Cowork 零部件 |

## 与 CLI 版本匹配的指引

`univer-cli` 入口会引导 agent 从已安装的 CLI 加载 core 指引和对应的 Unit Skill，使 command
和 Facade API 始终与当前版本一致。Builder 集成 Skill 同样以当前安装的 CLI 与 package
declarations 作为操作权威。

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
cp -R skills/integrate-univer-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/integrate-univer-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/integrate-univer-cli ~/.cursor/skills/
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
Use integrate-univer-cli to add Univer content operations and an embedded Cowork Viewer to this application.
```

## 环境要求

- Linux 或 macOS
- Node.js 和 npm
- 可通过 `univer` 命令使用 Univer CLI

## 参与贡献

- 内容操作 discovery 入口位于 [`skills/univer-cli/SKILL.md`](./skills/univer-cli/SKILL.md)。
- Builder 集成入口位于 [`skills/integrate-univer-cli/SKILL.md`](./skills/integrate-univer-cli/SKILL.md)。
- 与版本匹配的 operational Skills 和 resources 随 Univer CLI package 分发。
- 发布 Skill 变更前运行 `npm run validate`。

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
