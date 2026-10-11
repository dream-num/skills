# Build with Univer

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

语言：[English](./README.md) | [简体中文](./README.zh-CN.md)

用 [Univer Office SDK](https://docs.univer.ai) 构建应用的 agent skill。
[`build-with-univer`](./skills/build-with-univer/SKILL.md) 告诉你的 coding agent 该用哪个
Univer SDK、从哪里起步、哪些东西不要用，避免它凭过时的训练数据瞎猜。

## 覆盖范围

| 你要做的 | 对应 SDK |
| --- | --- |
| 嵌入式表格、文档、幻灯片编辑器 | Web SDK |
| 基于自有鉴权和存储的实时协同，Office 导入导出 | Server SDK |
| 让 agent 读写 Office 内容的 CLI 或工具 | AI SDK |
| 绑定实时表格数据的纯 HTML 页面 | Binding SDK |

skill 会在构建时解析 package 版本，不会因为缺少 license 而卡住 POC，并列出模型仍然会推荐的
已被取代的服务端、package 和 API 名称。

## 安装

```bash
npx skills add dream-num/skills --skill build-with-univer
```

加 `-g` 安装到用户级目录，或用 `-a claude-code -a codex -a opencode` 指定 agent。
更新时重新执行同一条命令。

### 手动安装

把 `skills/build-with-univer` 复制到 agent 的 skills 目录：

```bash
git clone https://github.com/dream-num/skills.git && cd skills
mkdir -p ~/.claude/skills && cp -R skills/build-with-univer ~/.claude/skills/              # Claude Code
mkdir -p ~/.agents/skills && cp -R skills/build-with-univer ~/.agents/skills/              # Codex
mkdir -p ~/.config/opencode/skills && cp -R skills/build-with-univer ~/.config/opencode/skills/   # OpenCode
mkdir -p ~/.cursor/skills && cp -R skills/build-with-univer ~/.cursor/skills/              # Cursor
```

## 示例 Prompts

```text
在这个 React 应用里嵌入一个表格编辑器，并能用代码读写单元格。
```

```text
让多人实时编辑同一份表格，使用我们自己的登录和数据库。
```

```text
做一个 CLI，让我的 coding agent 能查看和修改表格与幻灯片。
```

```text
给这个 Node API 加上 xlsx 导入导出接口。我们还没有 license。
```

```text
做一个纯 HTML 看板，把团队表格里的数据画成图表，并能修改单元格。
```

不必提到 Univer 或这个 skill 的名字，任务匹配时 agent 会自行加载。

## 环境要求

- Node.js 和 npm
- 能访问 `docs.univer.ai` 和 npm registry，skill 用它们获取最新文档和版本

## 参与贡献

- skill 位于 `skills/build-with-univer`：`SKILL.md` 负责路由，`references/` 为每个 SDK 各一页，
  另有版本说明和避坑清单。
- `SKILL.md` 保持在 500 行以内，正文不写死版本号，发布变更前运行 `npm run validate`。

## License

本仓库使用 [Apache-2.0 License](./LICENSE)。
