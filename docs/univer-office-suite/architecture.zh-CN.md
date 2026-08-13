# 架构

本章定义 Univer Office Suite application 的系统边界，以及 DreamNum SDK、developer-owned 产品
代码和第三方系统之间的所有权边界。

[English](./architecture.md)

## 系统上下文

```mermaid
C4Context
    title System Context — Univer Office Suite Application

    Person(user, "Office Suite 用户", "创建、编辑、review 与分享 Office 内容")
    Person(agentUser, "Agent 用户", "在客户端运行 Univer CLI SDK、发起任务并 review 结果")

    System_Boundary(productScope, "Developer scope") {
        System(product, "Office Suite application", "浏览器体验、产品 API、身份映射、ACL policy、Space、Node、Resource、Worktree catalog 与 durable workflow")
        SystemDb(productStore, "产品存储", "用户、ACL、层级、metadata、operation 与业务状态")
    }

    System_Boundary(sdkScope, "univer-*-sdk scope") {
        System(contentSdk, "Univer / Univer Pro SDK", "Office 内容模型、plugin、Facade、command、mutation、UI 与 render")
        System(collabSdk, "Univer Collaboration SDK", "权威 snapshot、changeset、revision、OT、HTTP/WebSocket 协议、room 与 Worktree collaboration")
        System(cliSdk, "Univer CLI SDK", "Headless 与 Agent execution、手动 collaboration runtime、inspection、Office exchange、render、lint 与 screenshot")
    }

    System_Boundary(integrationScope, "Developer-integrated third-party systems") {
        System_Ext(identity, "身份 / 用户系统", "Login、OAuth、SSO、directory 与稳定业务身份")
        System_Ext(policy, "授权 / 策略系统", "Role、permission、tenant policy 与 entitlement decision")
        System_Ext(blob, "对象存储", "Import、export、asset、preview 与其他 blob")
        System_Ext(operations, "运维集成", "Log、trace、metrics、queue、webhook 与下游 consumer")
    }

    Rel(user, product, "使用", "HTTPS / WebSocket")
    Rel(agentUser, cliSdk, "在客户端运行")
    Rel(cliSdk, product, "使用已认证的产品与 collaboration API", "HTTPS / WebSocket")
    Rel(product, contentSdk, "嵌入并扩展")
    Rel(product, collabSdk, "托管并调用")
    Rel(product, productStore, "读写")
    Rel(product, identity, "通过 developer-owned adapter 认证")
    Rel(product, policy, "通过 developer-owned adapter 授权")
    Rel(product, blob, "通过 developer-owned adapter 存取")
    Rel(product, operations, "发布 telemetry 与 post-commit effect")
```

SDK 边界提供内容与协同 primitive，但不定义产品用户、权限、层级、分享、target resolution 或
业务 workflow。Developer 拥有这些 policy，以及连接外部身份、授权、存储和运维系统的 adapter。
第三方服务可以执行认证或策略决策，但应用仍负责把结果映射成可信 SDK context，并在每条路径
执行这些决策。

## Runtime container 与 SDK 位置

产品应用是 composition root。每个 SDK 都运行在明确的 runtime 中；这些 SDK 本身不会组成一个
独立部署的成品应用。

```mermaid
C4Container
    title Container Diagram — SDK Placement in a Univer Office Suite Application

    Person(user, "Office Suite 用户", "编辑并 review 内容")
    Person(agentUser, "Agent 用户", "在客户端运行 Univer CLI SDK、发起任务并 review 结果")

    System_Boundary(app, "Developer-owned Office Suite application") {
        Container(browser, "浏览器 Office application", "Developer UI + Univer/Core/Pro SDK + Browser Collaboration Client", "渲染并编辑 Office 内容，自动同步 realtime collaboration")
        Container(backend, "Application backend", "Developer product APIs + Univer Collaboration SDK", "拥有产品 control plane，并托管权威 collaboration gateway")
        ContainerDb(productDb, "产品数据库", "Developer-selected database", "保存用户、ACL、层级、metadata 与 durable operation")
        ContainerDb(collabDb, "协同数据库", "Collaboration SDK Database Adapter", "保存权威 snapshot、changeset、revision 与幂等状态")
    }

    System_Ext(integrations, "Application integrations", "身份/用户系统、授权策略、对象存储、可观测性、queue、webhook 与下游 consumer")

    Rel(user, browser, "编辑与 review")
    Rel(browser, backend, "使用产品与 collaboration API", "HTTPS / WebSocket")
    Rel(agentUser, backend, "运行本地 CLI SDK", "HTTPS / WebSocket")
    Rel(backend, productDb, "保存产品状态")
    Rel(backend, collabDb, "保存协同状态")
    Rel(backend, integrations, "使用 developer-owned adapter")
```

因此，各 SDK 的运行位置非常明确：

- **Univer/Core/Pro SDK** 在浏览器中提供交互式编辑，并在本地 CLI runtime 中作为 headless
  内容引擎。
- **Browser Collaboration Client** 只运行在浏览器中，拥有自动 realtime sync。
- **Univer CLI SDK** 运行在 Agent 用户的客户端，拥有有边界的 manual execution loop。
- **Univer Collaboration SDK** 运行在 application backend 中，拥有权威协同状态。
- **产品后端代码**与 Collaboration SDK 共同运行，拥有产品 policy，并调用其公开 Service
  contract，但不拥有 collaboration internals。

为了保持 runtime 视图清晰，图中把 server-side product API 与 collaboration gateway 合并为一个
backend。它们可以共享同一进程，也可以分开部署。CLI runtime 保留在 Agent 用户的客户端，部署
方式不会改变所有权。

## 两类 client，一个内容权威

```mermaid
sequenceDiagram
    participant Human as 浏览器用户
    participant Browser as Browser + Collaboration Client
    participant Product as Product auth / ACL
    participant Collab as Collaboration Endpoint / Service
    participant Agent as Agent 用户 + 本地 CLI runtime

    Human->>Browser: 通过 Facade / command 编辑
    Browser->>Product: 认证并解析访问权
    Browser->>Collab: Load、JOIN 并提交 mutation
    Agent->>Product: 认证并解析 Unit / Worktree target
    Agent->>Collab: Fetch/pull confirmed revision
    Agent->>Agent: 在 headless Univer 执行 Facade code
    Agent->>Collab: Commit captured mutation
    Collab-->>Browser: ACK / broadcast 或后续 replay
    Collab-->>Agent: Confirmed revision 或 retry/conflict result
```

浏览器 client 拥有持续 realtime synchronization 与 presence；CLI runtime 拥有显式、有边界的
`fetch → pull → execute → commit` 状态机。不得在同一个 headless runtime 注册自动浏览器
Collaboration Client，否则会形成两个互相竞争的同步所有者。

## 内容状态与 command

Univer 基于 plugin，可运行在浏览器、Electron、Node、worker 与测试环境。应用行为优先使用
Facade API；更深的产品扩展使用 plugin、依赖注入与 command API。

```mermaid
flowchart LR
    Intent[用户或 Agent intent] --> Facade[Facade API / Command]
    Facade --> Mutation[Mutation]
    Mutation --> Changeset[Changeset + base revision + idempotency identity]
    Changeset --> OT[OT + revision CAS]
    OT --> Confirmed[Confirmed revision]
    Confirmed --> Delivery[ACK / realtime delivery / HTTP replay]
```

Snapshot 是持久化数据，不是可变 live state。修改 snapshot 不会更新运行中的应用。Live content
必须通过 Facade 或 command 修改；mutation 是协同转换的最小单元。

## Collaboration SDK 内部分层

```mermaid
flowchart LR
    Request[原始 HTTP / WebSocket] --> Transport[Node Transport<br/>网络入口]
    Transport --> Endpoint[Collaboration Endpoint<br/>协议 · Session · room · presence · ACK]
    Endpoint --> Service[Collaboration Service<br/>OT · revision · Unit lifecycle]
    Service --> Adapter[Database Adapter<br/>原子持久化 · CAS · deduplication]
    Adapter --> Store[(Collaboration database)]
```

这些层彼此互补，不是不同 integration 方案。Legacy Univer Server integration 已废弃且不受支持；
新应用必须使用 Collaboration SDK。

## Control plane 与 content plane

产品 API 构成 control plane：身份、Space/Node 层级、Resource metadata、ACL、分享、trash、recent、
Worktree catalog、task state 与 durable operation。Collaboration routes 构成 content plane：Unit
snapshot、block、confirmed changeset、submit、Session、room、presence 与 Worktree-scoped content。

两条 plane 可以复用同一组进程内身份与访问策略模块，但不应为了向同一进程查询权限而互相发
HTTP 请求。

## 身份词汇

| 名称 | 所有者与含义 |
| --- | --- |
| application user ID / `userID` | Developer-owned 稳定身份，映射到可信 SDK context；也是 confirmed author |
| `memberID` | Collaboration Endpoint 创建的一次在线 Session 身份；重连后变化 |
| `sid` + `reqId` | Collaboration client/runtime 提交幂等身份；重试时保持不变 |
| Unit ID | Collaboration 身份，在一个 Service/database 内全局唯一 |
| Resource ID | 指向 Unit 的产品 metadata 身份 |
| Node ID | Space 中的产品层级节点 |
| Worktree ID | 产品 catalog 与 Worktree service 共同使用的隔离 draft/review scope |

Client payload 不能建立可信用户身份、member 归属或 confirmed revision；必须从服务端认证状态解析。

## 认证与授权路径

普通 collaboration HTTP request 在 Transport middleware 中认证。Session-ticket request 把可信
context 保存到 opaque one-time ticket；WebSocket open 消费它并创建 Endpoint Session。

- Endpoint JOIN 保护进入 realtime room。
- Service read middleware 保护 snapshot 与 missing-changes HTTP read。
- Service submit middleware 保护权威内容修改。
- Create、delete、restore、History、Comment 与 Worktree 分别需要 policy 覆盖。

只检查 JOIN 不能保护 HTTP read；client-side readonly UI 也不能替代服务端授权。

## 持久化、投递与生命周期

Collaboration database 是权威状态，WebSocket 是低延迟投递通道。即使 realtime delivery 失败，
commit 仍可能成功；client 根据已知 revision 拉取 confirmed changeset 完成恢复。

产品数据和协同数据拥有不同所有者，即使开发环境使用同一个物理 SQLite 文件。跨存储 workflow
必须使用幂等、durable operation state、显式步骤与恢复，不能宣称共享 transaction。

可重试 apply/commit stage 可能执行多次。不可逆 effect 只能在 commit 后触发；可靠外部投递使用
transactional outbox。

Database CAS 可以保持多个 Service instance 的权威数据正确性。当前 room、presence、ACK 与
broadcast 保证只覆盖单个 Endpoint process，除非应用显式增加 realtime distribution design。

从网络边缘向内释放资源。Transport 释放已注册 Endpoint；Endpoint 不释放 Service；Service
不释放外部注入的 Database Adapter。
