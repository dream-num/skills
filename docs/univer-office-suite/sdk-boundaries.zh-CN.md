# SDK 边界

[English](./sdk-boundaries.md)

## 职责映射

| 系统 | 负责 | Skill |
| --- | --- | --- |
| Univer Engine / Runtime SDK（内核层） | Unit model、plugin、Facade、command、mutation、UI、render、browser/Node runtime | `univer-integrate`、`univer-pro-integrate`、`univer-plugin-dev`、`univer-node-backend` |
| Univer CLI SDK | 面向 Agent 的 execution、inspection、Office exchange、render、screenshot、lint、runtime/process helper | `univer-cli-sdk-integration` |
| Univer Collaboration SDK | Server-side snapshot、changeset、revision、OT、idempotency、HTTP/WebSocket 协议、room、持久化 | `univer-collaboration-integration` |
| 产品应用 | 身份、ACL、租户、层级、target、blob、workflow、部署策略 | 跨系统组合使用 `build-univer-app` |

Engine / Runtime SDK 是内核基础。CLI SDK 在其 headless runtime 上构建面向 Agent 的能力。
Collaboration SDK 是浏览器与 Agent client 共同使用的 server-side authority。产品应用连接这些
系统，但不会把产品 policy 转移到 SDK internals。

受支持的 server-side collaboration 链路是：

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History、Thread Comment 与 Worktree 是独立的可选 collaboration domain。它们可以复用基础设施，
但各自保留 service、middleware、storage 和生命周期；产品仍负责面向用户的 catalog 与 policy。

CLI SDK package 是与 target 无关的 capability 和可选 command preset，不是产品 framework。Host
application 负责 command composition、credential、target、storage 与业务 policy。

能力证据只适用于明确的 Unit。不要把 Sheet、Doc、Slide、Board 或 Base 的 recipe 推广到其他
Unit。API 问题应通过 owning Skill 与 installed public exports 解决，不要在跨系统指南中发明兼容性
规则。
