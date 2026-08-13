# 构建 Univer Office Suite Application

本指南说明如何把 Univer/Core/Pro、自托管 Collaboration SDK、Univer CLI SDK 与产品应用组合
成一套 Office Suite 产品。它既服务于需要掌握架构的 developer，也帮助 developer 更准确地
指导使用 `build-univer-app` skill 的 Agent。

英文是权威正文；本页是[英文入口](./README.md)的完整简体中文版本。

## 一分钟理解整体技术栈

```text
浏览器用户
  → Univer/Core/Pro + Collaboration Client
  → 应用认证与 ACL
  → Collaboration Endpoint → Service → collaboration database

Agent 任务
  → 产品 target resolver
  → CLI SDK 手动 collaboration runtime + headless Univer
  → 同一个 Collaboration Endpoint、Service 和 collaboration database

产品 API
  → 用户、Space、Node、Resource、ACL、分享、Worktree catalog
  → product database
```

每一层只承担自己的职责：

- **Univer/Core/Pro** 是内容引擎，负责 Unit model、plugin、preset、Facade API、command、
  mutation、浏览器 UI 和渲染。
- **Collaboration SDK** 是协同权威，负责 snapshot、changeset、revision、OT、提交幂等、
  HTTP/WebSocket 协议、room 和 Worktree 协同。
- **Univer CLI SDK** 是 headless 与 Agent 工具箱，负责显式内容执行、collaboration runtime、
  pool、inspection、Office exchange、render、lint 和 screenshot。
- **产品应用**负责身份、认证、ACL、租户、产品层级、分享、target resolution、持久化业务操作
  和部署策略。

新应用唯一受支持的协同后端是自托管 Collaboration SDK。Legacy Univer Server integration
已经废弃且不再支持。

## 按目标阅读

1. 阅读[架构](./architecture.zh-CN.md)，理解 control plane、content plane、人类与 Agent 数据流、
   身份和持久化边界。
2. 选择 package 或划分职责前阅读 [SDK 边界](./sdk-boundaries.zh-CN.md)。
3. 按[构建 Workspace](./build-workspace.zh-CN.md)组合浏览器、产品后端、认证、ACL、协同和五类
   Unit。
4. 按[增加 Agent/CLI 编辑](./add-agent-cli.zh-CN.md)接入 headless 编辑、Worktree review、Office
   转换、inspection、render、screenshot 与 export。
5. 在[资料来源](./sources.md)查看本指南复核过的精确 revision 与 release cohort。

## Canonical applications

贯通三层的 reference implementation 位于 `dream-num/univer-collaboration-examples`：

- `univer-workspace` 展示浏览器 client、产品 API、身份与 ACL、产品数据、Collaboration SDK
  gateway、五类 Unit 和 Worktree 生命周期。
- `univer-workspace-cli` 展示认证后的 target resolution、CLI SDK headless runtime、连接同一
  协同权威状态的 Agent Worktree 编辑、review handoff、inspection、render、screenshot 与
  Office exchange。

把它们作为装配依据。完整可运行应用继续留在 examples 仓库，不复制到本指南或 skill。

## 与 Agent 协作

安装本仓库 skills 后，在跨 SDK 任务中显式调用 integration skill：

```text
Use $build-univer-app to explain the identity and storage boundaries in this Workspace.
```

```text
Use $build-univer-app to add reviewable Agent editing to this Univer Workspace through Worktree.
```

只读问题保持只读；设计任务先调查目标项目并给出决策；build 或 fix 请求通过公开 API 实施，
并执行与风险相称的验证。
