# SDK 边界

[English](./sdk-boundaries.md)

| 需求 | Owner | Skill |
| --- | --- | --- |
| 嵌入和配置 Univer | Univer/Core | `univer-integrate` |
| 增加 Pro 能力 | Univer Pro | `univer-pro-integrate` |
| 扩展 Univer | Plugin system | `univer-plugin-dev` |
| 在 Node.js 中直接运行 Univer | Univer/Core/Pro | `univer-node-backend` |
| 持久化并同步协同内容 | Collaboration SDK | `univer-collaboration-integration` |
| 构建 headless 或 Agent 应用能力 | CLI SDK | `univer-cli-sdk-integration` |
| 操作本地 `.univer` 文件 | Univer CLI application | `univer-cli` |
| 操作远程 Workspace 文件 | Workspace CLI application | `univer-workspace-cli` |

产品应用负责用户、认证、ACL、租户、层级、分享、target resolution、持久化业务流程、备份和部署
策略。

受支持的协同链路是：

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History、Thread Comment 与 Worktree 是独立的可选领域。它们可以复用基础设施，但各自保留 service、
middleware、storage 和生命周期。

CLI SDK package 是与 target 无关的 capability 和可选 command preset，不是产品 framework。Host
application 负责 command composition、credential、target 与业务 policy。

能力证据只适用于明确的 Unit。不要把 Sheet、Doc、Slide、Board 或 Base 的 recipe 推广到其他 Unit。
所有版本耦合 package 使用同一个精确 cohort；无法消除的 API drift 必须停止并报告。
