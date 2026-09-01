# Univer Office Suite 架构

本指南说明产品应用如何组合三个 SDK 系统：Univer Engine / Runtime SDK（内核层）、面向 Agent 的
Univer CLI SDK，以及 server-side Univer Collaboration SDK。这里只描述跨系统架构；每个
Integration Skill 负责其 SDK 的具体细节。

英文是权威正文；本页与[英文入口](./README.md)同步维护。

## 三个 SDK 系统

```text
浏览器用户 → Univer Engine / Runtime + Browser Collaboration Client ─┐
                                                                      ├→ 产品应用
Agent 任务 → Univer CLI SDK + headless Engine / Runtime ──────────────┘   ├→ 产品存储
                                                                          └→ server-side Collaboration SDK
                                                                              → 协同存储
```

- **Univer Engine / Runtime SDK（内核层）**是基础，负责 Unit model、plugin、Facade、command、
  mutation、浏览器 UI、渲染，以及 browser/Node runtime；也包括 Browser Collaboration Client
  等 Univer Pro 能力。
- **Univer CLI SDK** 面向 Agent，在 Engine / Runtime SDK 上提供 execution、inspection、Office
  exchange、render、screenshot、lint 与 runtime helper。
- **Univer Collaboration SDK** 位于 server-side，负责权威 snapshot、changeset、revision、OT、
  idempotency、HTTP/WebSocket 协议、room 与持久化契约。
- **产品应用**组合三者，并负责身份、ACL、租户、层级、target resolution、分享、blob storage、
  workflow 与部署策略。

新应用唯一受支持的协同后端是自托管 Univer Collaboration SDK。Legacy Univer Server
integration 已经废弃且不再支持。

## 按目标阅读

- 阅读[架构](./architecture.zh-CN.md)，了解 runtime 位置、数据流、身份、存储与生命周期边界。
- 阅读 [SDK 边界](./sdk-boundaries.zh-CN.md)，了解职责和 Skill 路由。
- 资料权威性相关问题参见[资料来源](./sources.md)。

## Agent 入口

跨系统架构使用 `build-univer-app`。Engine / Runtime 工作路由到 `univer-integrate`、
`univer-pro-integrate`、`univer-plugin-dev` 或 `univer-node-backend`；Agent 能力路由到
`univer-cli-sdk-integration`；server-side collaboration backend 路由到
`univer-collaboration-integration`。
