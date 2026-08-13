# 构建自托管 Workspace

本章以 canonical `univer-workspace` application 为主线：产品 control plane 与 Collaboration SDK
content plane 共同服务 Sheet、Doc、Slide、Board 和 Base。

[English](./build-workspace.md)

## 编写 integration code 之前

先选择一个精确 SDK cohort，并明确产品模型：

- 稳定 application user ID 是什么？
- Space、Node、Resource、Unit 与 Worktree 如何关联？
- 哪些角色可以 read、edit、管理 ACL、创建 draft 与 merge？
- 启用哪些 Unit type，各自需要哪些产品 plugin？
- 哪个 deployment 拥有 product database、collaboration database、blob、job 与 backup？

不要从 endpoint URL 开始设计。只有先确定所有权与身份，这些配置才有意义。

## 1. 建立产品 control plane

Workspace 通常需要这些产品层概念：

- **User** — 登录、ACL 与 confirmed changeset author 使用的稳定身份。
- **Space** — personal 或 team scope。
- **Node** — 支持 folder、resource、trash、move 与展示排序的层级节点。
- **Resource** — 一个 Office object 的 metadata，以及它到 Unit ID/Unit type 的映射。
- **ACL** — owner/editor/viewer 或更丰富的产品策略。
- **Blob** — 不属于 collaboration changeset 的原始导入、asset、preview 或 export。
- **Operation** — 跨产品与协同存储 workflow 的持久化进度。
- **Worktree catalog** — 包围 SDK Worktree state 的产品 task 与 review metadata。

这些 schema 与 snapshot、changeset、revision table 保持独立。它们可以引用 Unit/Worktree ID，
但不会因此成为 collaboration storage。

## 2. 装配 collaboration content plane

依次创建持久化 Database Adapter、Collaboration Service、Endpoint 与 Node Transport。把原始
Node HTTP request 与 WebSocket upgrade 交给 Transport。如果 web framework 已消费 body 或
改写 URL，必须在转发前保存/恢复原始 collaboration request。

Memory 只适合测试或临时数据。SQLite 适合持久化单节点部署；其他共享数据库需要实现并通过
Collaboration SDK contract tests 的 Adapter。

Product ingress 与 collaboration ingress 可以位于同一个 Node process/container，也可以复用
identity、ACL、logging 或数据库基础设施，但协议与所有权仍然分离。

## 3. 共享身份与策略，不做协议回调

产品 API 与 Collaboration Transport 使用同一个产品 identity module 认证，把稳定业务 user ID
写入可信 collaboration context。

Product handler 与 SDK middleware 共用一个 access resolver：

| 路径 | 最低策略检查 |
| --- | --- |
| Product browse/open | Resource 与 Node visibility |
| Snapshot / missing changes HTTP | Service middleware 中的 Unit read access |
| WebSocket Session ticket | 已认证用户 |
| WebSocket JOIN | Endpoint middleware 中的 Unit read access |
| Changeset submit | Service middleware 中的 Unit edit access |
| Create/delete/restore Unit | 产品 lifecycle policy + Service action policy |
| History/Comment | 各自的 Service 或 Endpoint policy |
| Worktree manage/read/write/merge | Worktree membership、Unit permission 与 action policy |

不要信任浏览器声称的用户、`memberID`、revision 或 readonly UI。Product handler 不要为了复用
策略而调用同进程的 collaboration HTTP route；应通过公开 contract 调用进程内 Service 或共享
domain module。

## 4. 让创建流程可恢复

创建 Workspace 文档横跨多个所有者，使用 durable operation：

```text
reserve operation + idempotency key
→ 在 product store 创建 Resource/Node/ACL
→ 通过 Collaboration Service 创建匹配 Unit ID/type 的 Unit
→ 保存映射并把 operation 标记完成
```

如果任一存储 commit 后进程崩溃，用同一个 operation 重试并根据持久化状态继续。明确无法恢复的
partial result 是补全还是补偿。Delete、restore、import、Worktree create 与 merge 等跨所有者
workflow 同样遵守该规则。

Unit ID 在 Collaboration Service/database 内全局唯一；初始 UnitData 使用当前 cohort 规定的 type
与 revision，不能从旧 example 猜测这些规则。

## 5. 配置浏览器编辑器

按 Resource 的 Unit type 选择对应 Univer/Core/Pro content preset 或 plugin。所有耦合 package
保持精确 cohort，避免重复注册 preset 已包含的 plugin。

构造 Univer 时注册 Pro Collaboration plugin family，配置受支持的 snapshot、submit、WebSocket
与 Session-ticket route，再调用与已保存 Unit type 匹配的 loader。

产品编辑行为优先使用 Facade API。更深的产品扩展通过 plugin 与 command/mutation contract 实现，
不能修改 snapshot object。UI permission state 改善体验，但不能替代服务端 policy。

## 6. 把每类 Unit 当作独立内容领域

Workspace 可以通过同一个产品 shell 提供五类 Unit，但需要加载不同内容能力：

| Unit | 典型产品关注点 |
| --- | --- |
| Sheet | cell、formula、table、chart、sheet block、calculation |
| Doc | rich text、paragraph、pagination、image、document resource |
| Slide | page、shape、media、layout、presentation rendering |
| Board | open canvas、visual object、viewport-oriented rendering |
| Base | table、field、record、view、structured formula |

产品身份、导航、ACL、协同与 lifecycle pattern 可以共享；除非公开 API 明确支持多种类型，否则
不要共享 Unit-specific authoring code。

## 7. 有意识地增加 History、Comment 与 Worktree

History 消费 confirmed collaboration revision 并构建面向用户的派生索引。Thread Comment 拥有
thread data，通过 anchor 引用内容但不成为 Unit authority。Worktree 创建隔离 collaboration
scope，并对其执行 evaluate/merge。

每个领域都有自己的 Service、Endpoint、Adapter、middleware、lifecycle 与 disposal。它们可以
复用 Transport、authenticated identity、access resolver 与物理 SQLite 文件，但基础设施复用
不代表领域所有权复用。

产品应用拥有 Worktree catalog、task assignment、review page，以及用户对 merge/discard 的决策。

## 8. 生产拓扑

对于单节点产品，一种务实拓扑是：一个 Node process/container 同时承载 product API、
Collaboration Endpoint 与 background job，并使用持久化 product/collaboration database 和 blob
storage。Build-time license input 与 runtime secret/data 分离。

上线前确认：

- persistent path、schema migration、backup、restore 与 disaster recovery；
- reverse proxy 对原始 collaboration HTTP 与 WebSocket upgrade 的转发；
- request size、timeout、connection limit 与 graceful shutdown；
- 所有启用领域的认证与 ACL 覆盖；
- 不泄露 `customData` 的 log、trace、metrics 与错误分类；
- 单 Endpoint realtime 限制，或显式 distribution design；
- 跨存储 operation 的持久化恢复。

## 9. End-to-end 验收

最小 Workspace 验收路径应证明可观察行为：

1. 通过产品 API 创建 Resource 与 collaboration Unit。
2. 用两个认证浏览器 Session 打开同一个 Unit。
3. 验证 snapshot load、WebSocket Session、JOIN、edit、ACK 与 confirmed update。
4. 验证 viewer 与 unauthorized user 在 HTTP/WebSocket 两条路径的行为。
5. 重启进程并重新加载 confirmed content。
6. 注入 partial create/delete/restore failure 并恢复 durable operation。
7. 为每个启用 Unit type 打开至少一个已验证 example。
8. 如果启用 History、Comment 或 Worktree，分别验证其 policy 与 lifecycle。

完成这条主线后，继续[增加 Agent/CLI 编辑](./add-agent-cli.zh-CN.md)。
