# 架构

本章解释 Univer Office Suite application 的稳定边界。Package API 的变化通常比这些所有权规则
更快，因此应先建立心智模型，再选择具体调用。

[English](./architecture.md)

## 四层职责

| 层 | 主要职责 | 示例 |
| --- | --- | --- |
| Univer/Core/Pro | 运行并扩展 Office 内容 | Unit model、plugin、preset、Facade、command、mutation、UI、render |
| Collaboration SDK | 维护权威协同状态 | snapshot、changeset、revision、OT、幂等、协议、room、Worktree |
| CLI SDK | 执行有边界的 Node 与 Agent 内容任务 | headless factory、手动 runtime、pool、inspection、exchange、render、screenshot |
| 产品应用 | 把内容能力组织成产品 | 用户、认证、ACL、租户、Space、Node、Resource、分享、target、持久化 operation |

依赖方向跟随所有权。产品代码组合 SDK；Collaboration Service 不依赖产品、Endpoint、Transport
或具体 Database Adapter；CLI capability 只使用公开内容与协同契约，不成为产品数据模型。

## 两类 client，一个内容权威

人类编辑与 Agent 编辑不是两套文档系统：

```text
浏览器
  Univer/Core/Pro UI
  自动 Collaboration Client
             │
             ├── 认证后的 snapshot / changeset HTTP
             └── ticket WebSocket Session
                                  │
                                  ▼
                    Collaboration Endpoint
                            │
                    Collaboration Service
                            │
              snapshot + changeset + revision store
                            ▲
                                  │
Agent
  产品 target resolver
  CLI 手动 collaboration runtime
  headless Univer/Core/Pro
```

浏览器 client 优化持续交互、realtime presence、ACK 与 replay；CLI runtime 优化显式 fetch、
pull、execute、commit 的有界任务。在 headless 手动 runtime 中注册自动 Collaboration Client
会形成两个互相竞争的同步所有者，因此禁止这样组合。

## 内容状态与 command

Univer 基于 plugin，可以通过不同 plugin 组合运行在浏览器、Electron、Node、worker 或测试
环境。应用行为优先使用 Facade API；只有 Facade 无法覆盖的扩展才下沉到 plugin、依赖注入与
command API。

Snapshot 是持久化表达，不会随 live model 自动更新，直接修改也不会更新应用。所有 live change
都应通过 Facade 或 command；command system 产生 mutation，而 mutation 是协同转换的最小单元。

```text
intent → Facade/command → mutation → changeset → OT/CAS → confirmed revision
```

## Collaboration 服务链

自托管服务端是一套装配，不是四个备选方案：

```text
Node Transport
└── Collaboration Endpoint
    └── Collaboration Service
        └── Database Adapter
```

- **Transport** 处理原始 HTTP/WebSocket 入口和通用 request middleware。
- **Endpoint** 实现 client 协议并拥有 Session、room、presence、ACK 与 broadcast。
- **Service** 拥有无网络依赖的 OT、revision、Unit lifecycle 与 collaboration middleware。
- **Database Adapter** 原子持久化 snapshot、changeset、revision CAS 与幂等状态。

Legacy Univer Server integration 已经废弃且不受支持。它不是第二条受支持的部署路线，新应用
不得选择它。

## Control plane 与 content plane

产品 API 构成 control plane：身份、Space/Node 层级、Resource metadata、ACL、分享、trash、
recent、Worktree catalog、task state 与 durable operation。Collaboration routes 构成 content
plane：Unit snapshot、block、confirmed changeset、submit、Session、room、presence 与 Worktree
scoped content。

两条 plane 复用进程内身份与访问策略模块，但不应为了向同一进程查询权限而互相发 HTTP 请求。
这样既保持策略一致，也不混淆协议所有权。

## 身份词汇

| 名称 | 含义 |
| --- | --- |
| application user ID / `userID` | 稳定、已认证的业务身份，也是 confirmed author |
| `memberID` | 一次 Endpoint 在线 Session；重连后变化 |
| `sid` + `reqId` | changeset 提交幂等身份；重试时保持不变 |
| Unit ID | Collaboration Service/database 内的全局内容身份 |
| Resource ID | 指向 Unit 的产品 metadata 身份 |
| Node ID | Space 中的产品层级节点 |
| Worktree ID | 隔离 draft 与 review scope |

Client payload 不能建立可信用户身份、member 归属或 confirmed revision。服务端必须从已认证状态
解析这些事实。

## 认证与 ACL 路径

普通 collaboration HTTP request 在 Transport middleware 中认证。Session-ticket request 把
可信上下文保存到 opaque one-time ticket；WebSocket open 消费它并创建 Endpoint Session。
Ticket 字符串本身不暴露身份。

所有相关路径都必须授权：

- Endpoint JOIN 保护进入 realtime room。
- Service read middleware 保护 snapshot 与 missing-changes HTTP read。
- Service submit middleware 保护权威内容修改。
- Create、delete、restore、History、Comment 与 Worktree 分别需要策略覆盖。

只检查 JOIN 不能保护 HTTP read；client-side readonly UI 也不能替代服务端授权。

## 持久化与投递保证

Collaboration database 是权威状态，WebSocket 是低延迟投递通道。即使 realtime send 失败，
commit 仍可能成功；client 根据已知 revision 拉取 confirmed changeset 完成恢复。

产品数据和协同数据拥有不同所有者，即使开发环境把它们放在同一个物理 SQLite 文件中。创建
Resource、ACL、Node 与 Unit 的流程必须使用 idempotency key、durable operation state、显式步骤
与恢复逻辑，不能宣称存在跨所有者 transaction。

Revision 竞争可能让可重试 apply/commit stage 执行多次，因此不可在其中产生不可逆副作用。
进程内副作用使用 committed event；可靠外部投递使用 transactional outbox。

## 进程拓扑与生命周期

Database CAS 可以保证多个 Service instance 的权威数据正确性。当前 room、presence、ACK 与
broadcast 保证只覆盖单个 Endpoint process；除非显式设计 realtime distribution，否则不能
水平扩展 Endpoint 并承诺跨进程 realtime 行为。

从网络边缘向内释放资源。Transport 释放已注册 Endpoint；Endpoint 不释放 Service；Service
不释放外部注入的 Database Adapter。外部注入的 credential、logger、metrics、adapter 等资源
默认由应用拥有，除非创建它的组件另有说明。
