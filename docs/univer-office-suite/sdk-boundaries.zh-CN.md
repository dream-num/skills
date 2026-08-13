# SDK 边界

选择 package 或编写 adapter 前，先用本章判断一项能力属于哪一层。
[English](./sdk-boundaries.md)

## 所有权矩阵

| 产品需求 | 所有者 | 原因 |
| --- | --- | --- |
| Office 内容模型与编辑 | Univer/Core/Pro | 定义 Unit model、plugin、Facade、command 与 mutation |
| 浏览器 Office UI | Univer/Core/Pro | 拥有内容 UI 与 rendering plugin |
| 权威协同状态 | Collaboration SDK | 拥有 snapshot、changeset、revision、OT 与幂等 |
| Collaboration HTTP/WebSocket 协议 | Collaboration SDK | Transport 与 Endpoint 实现受支持 client 协议 |
| Headless 内容执行 | CLI SDK | 组合标准 Node 内容 plugin 与显式执行能力 |
| Agent 协同状态 | CLI SDK runtime + Collaboration SDK authority | Runtime 管理有界 client 状态机，server 仍是权威 |
| Office import/export | CLI SDK unit exchange | 转换 Office wire format 与 UnitData |
| Inspection 与视觉证据 | CLI SDK | Inspection、render runtime、screenshot 与 Unit-specific lint |
| 用户与认证 | 产品应用 | SDK 消费可信身份，但不定义账号策略 |
| ACL 与租户 | 产品应用 | 策略通过产品 API 与 SDK middleware 生效 |
| Space/Node/Resource 层级 | 产品应用 | 产品导航不是协同内容状态 |
| Worktree catalog 与 review 产品 | 产品应用 | Worktree SDK 负责 draft 机制，不负责 task management UX |
| 备份、部署、可观测性 | 产品应用 | 运维策略属于被部署的产品 |

## Univer/Core/Pro

Univer 是 plugin-based 内容引擎。Preset 是预先组合的 plugin；显式 plugin mode 提供更多控制。
不要通过两种方式重复注册同一能力。所有耦合的 `@univerjs/*` 与 `@univerjs-pro/*` package 必须
使用同一个精确版本。

普通应用创作优先使用 Facade；Facade 会准备并执行 command。只有 plugin 开发或 Facade 尚未
覆盖的能力才下沉到底层。不能把 snapshot 当作可变 live state。

`univer-sdk-skills` 与官方 documentation 是这一层的权威资料。如果其 API 示例与目标 release
cohort 不同，应保留架构知识，但必须通过当前 declaration 或 cohort-matched canonical
application 核实具体调用。

## Collaboration SDK

唯一受支持的协同路线是：

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

它们是互补层，不是备选方案。Legacy Univer Server integration 已废弃且不受支持，新应用不得
使用。

可选协同领域仍然彼此独立：

- **History** 从 confirmed revision 派生面向用户的历史，不是内容权威。
- **Thread Comment** 拥有 thread 与 reply；anchor 可以引用内容，但不会转移内容所有权。
- **Worktree** 拥有 isolated draft、ready/reopen/discard/evaluate/merge lifecycle；产品应用拥有
  task catalog 与 review experience。

每个可选领域都有自己的 Service、Endpoint、Adapter 与 middleware 边界，即使复用 Transport、
认证或同一个物理数据库文件。

## CLI SDK

CLI SDK packages 是显式 capability，不是完整 product framework：

| Capability | 职责 | 重要限制 |
| --- | --- | --- |
| headless Univer | 标准 Node 内容 plugin 组合 | 不拥有 snapshot/revision/commit |
| collaboration runtime | 显式单 Unit load、pull、execute、commit | 不拥有产品 auth、target 或 background sync policy |
| runtime/worker pool | 独占复用昂贵有状态 runtime | 应用拥有 opaque key 与 target |
| content execution | 把 Facade code 绑定到明确 Unit | 不解析产品 target |
| content inspection | 读取结构化 Sheet、Doc、Slide 内容 | 不宣称未支持的 Unit 范围 |
| unit exchange | Office ↔ UnitData 转换 | 应用选择 collaborative 或 offline destination |
| render runtime | 渲染已物化 UnitData | 不加载权威内容 |
| unit screenshot | 生成结构化图片输出 | 使用 Unit-specific capture target |
| layout lint | 保守布局检查 | 当前验证规则仅覆盖 Slide |

Command packages 只是 capability packages 的薄 presentation preset。产品命令、认证与 target
resolution 继续留在应用层。

## 五类 Unit 不是同一套 API

整体架构支持 Sheet、Doc、Slide、Board 与 Base，但单项能力的证据范围更窄：

- Sheet 有 range、cell、table、chart、formula 与 sheet block。
- Doc 有 document structure、paragraph、pagination 与 rich text behavior。
- Slide 有 page、shape、layout fact 和当前已验证的 layout lint surface。
- Board 有 open-canvas model 与独立 render target。
- Base 有 table、field、record、view 与 formula-shape behavior。

不能因为一项能力在某类 Unit 上通过验证，就推断其他 Unit 也支持。每个 runnable recipe 都应
明确 Unit scope 与 release cohort。

## 防止所有权泄漏的规则

- Collaboration Database Adapter 不做认证、OT 或 broadcast。
- Collaboration Service 不依赖 Endpoint、Transport 或具体 adapter。
- CLI runtime 不成为 Workspace catalog 或 credential store。
- 产品 ACL 不信任 client payload 携带的身份或 revision。
- 产品存储与协同存储不假设共享 transaction。
- 浏览器自动 collaboration 与 CLI 手动 collaboration 不运行在同一个 headless instance。
- 没有 idempotent/outbox 设计时，不在可重试 collaboration stage 产生外部副作用。
