# Univer Office Suite 架构

本指南说明产品应用如何组合 Univer/Core/Pro、自托管 Collaboration SDK 与 Univer CLI SDK。这里只
描述跨层架构；各 SDK Integration Skill 负责具体实现。

英文是权威正文；本页与[英文入口](./README.md)同步维护。

## 技术栈

```text
浏览器用户 → Univer/Core/Pro + Collaboration Client ─┐
                                                      ├→ 产品应用
Agent 任务 → CLI SDK + headless Univer/Core/Pro ──────┘   ├→ 产品存储
                                                          └→ Collaboration SDK → 协同存储
```

- **Univer/Core/Pro** 负责内容模型、plugin、Facade、command、UI 和渲染。
- **Collaboration SDK** 负责权威 snapshot、changeset、revision、OT 和协议。
- **Univer CLI SDK** 提供 headless execution、inspection、exchange 和 render 能力。
- **产品应用**负责身份、ACL、租户、层级、target、业务流程和部署策略。

新应用唯一受支持的协同后端是自托管 Collaboration SDK。Legacy Univer Server integration
已经废弃且不再支持。

## 按目标阅读

- 阅读[架构](./architecture.zh-CN.md)，了解数据流、身份、存储与生命周期边界。
- 阅读 [SDK 边界](./sdk-boundaries.zh-CN.md)，选择负责该任务的 Skill。
- 版本或资料权威性相关问题参见[资料来源](./sources.md)。

完整可运行应用继续保留在 `dream-num/univer-collaboration-examples`，本指南不复制其实现。

## Agent 入口

跨 SDK 架构使用 `build-univer-app`。具体实现路由到 `univer-integrate`、
`univer-pro-integrate`、`univer-plugin-dev`、`univer-node-backend`、
`univer-collaboration-integration` 或 `univer-cli-sdk-integration`。操作成品应用使用
`univer-cli` 或 `univer-workspace-cli`。
