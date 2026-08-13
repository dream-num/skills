# 增加 Agent 与 CLI 编辑

本章以 canonical `univer-workspace-cli` application 为主线，在[构建 Workspace](./build-workspace.zh-CN.md)
的基础上增加有边界的 Agent client，同时保持唯一内容权威。

[English](./add-agent-cli.md)

## 为什么 CLI 路径不同

浏览器 Collaboration Client 负责持续 background synchronization、presence 与用户交互；Agent
任务需要明确开始、有界 mutation、可观察证据和 review handoff。CLI SDK 提供这种手动 client
及配套 Node capability。

两条路径仍然共用同一个 Collaboration Endpoint、Service、Unit、revision stream、identity
policy 与 ACL。

## 1. 解析产品 target

不要让 runtime 理解 Space、Node、Resource 或面向用户的 URL。Product adapter 把 target 解析为
runtime 所需事实：

- 已认证 origin 与 request transport；
- Unit ID 与 Unit type；
- 当前或期望 revision；
- scope：trunk 或指定 Worktree；
- scoped 模式下的 Worktree ID；
- application-owned opaque runtime-pool key。

暴露 collaboration route 前先解析并授权 product Resource 与 Worktree。CLI caller 可以提供 target
hint，但不能只凭一个 ID 建立访问权。

Canonical CLI 复用 Workspace Session cookie，并通过同一个 authenticated gateway 获取 collaboration
Session ticket。Caller-role header 可以改善 logging/policy，但不能替代身份。

## 2. 装配 headless runtime

用 standard headless Univer factory 加载目标 Unit 的 Core/Pro 内容能力；用 Collaboration Server
adapter 把 manual runtime 映射到 Workspace 受支持的 snapshot、changeset、Session-ticket 与
WebSocket route。Worktree scope 选择对应 scoped routes。

如果重复 command 会频繁重建昂贵 Univer instance，使用 worker/runtime pool。应用拥有 pool key、
process policy、authentication transport 与 shutdown；pool 拥有 exclusive lease 与配置的 reuse。

不要在 headless runtime 注册自动浏览器 Collaboration Client。Manual runtime 已经拥有 fetch、
pull、mutation capture、OT、revision、pending/awaiting state 与 commit。

## 3. 执行有边界的修改

遵守这一状态流，不在 command 内重新实现 revision 逻辑：

```text
acquire runtime
→ load checkpoint/revision
→ pull confirmed remote changes
→ 对明确 Unit 执行 Facade code
→ inspect pending mutations
→ commit
→ 仅在 runtime 表示可重试时 pull/retry
→ release runtime
```

Facade code 必须绑定目标 Unit。可能时，一个 coherent Agent mutation/commit 表示一个可 review 的
revision。成功或失败后都要释放 lease。

遇到 pull-required result 时，通过 runtime 的 pull 与 OT 行为处理后再 commit。遇到 terminal
conflict 时停止，由产品策略或用户选择 reload、rework、export 或 discard。即使盲目重试最终成功，
也可能覆盖真实意图。

## 4. 用 Worktree 建立 review 边界

对于新的 Agent 编辑任务：

1. 创建 fresh Worktree，并加入目标 Unit。
2. 解析 Worktree-scoped target 并 acquire runtime。
3. Pull 当前内容并执行修改。
4. Inspect 并视觉验证已存储结果。
5. 把 Worktree 标记 ready。
6. 返回浏览器 review URL 与证据。
7. 只有同一任务的 correction 才 reopen 原 Worktree。
8. 只有用户显式授权后才 merge 或 discard。

Worktree SDK 拥有隔离协同与 merge 机制；产品拥有 task assignment、review metadata、policy 与 UI。
Agent 完成编辑不表示它有权 merge。

## 5. 按意图选择 CLI capability

| 意图 | Capability | 证据 |
| --- | --- | --- |
| 查找 Facade API | offline API reference | 已安装 cohort 的精确 symbol/member/type |
| 修改内容 | content execution + collaboration runtime | committed revision 与 model readback |
| 读取内容结构 | content inspection | 结构化 Sheet、Doc 或 Slide 结果 |
| 转换 Office 文件 | unit exchange | 有效 UnitData 或导出 Office 文件 |
| 渲染内容 | render runtime | 已物化 browser render |
| 获取 review 证据 | unit screenshot | 结构化 PNG output |
| 检查布局 | unit layout lint | 当前只验证 Slide finding |
| 复用 runtime | runtime/worker pool | exclusive lease 与 clean release |
| 提供 command | daemon 与 command preset | 稳定 application command result |

Command preset 是 presentation adapter。产品认证、target resolution、error policy 与 review
semantics 保留在 Workspace CLI application。

## 6. 构建 Office 内容流水线

不是每项任务都需要全部阶段，选择能证明目标的最短 pipeline：

```text
Office input
→ exchange to UnitData
→ create/load collaborative Unit
→ Agent Facade mutation
→ structural inspection
→ render and screenshot
→ Unit-specific lint
→ optional Office export and round-trip validation
```

### Import

Offline conversion 直接 exchange 为 UnitData 并保持本地。Collaborative document 则把合法
UnitData 传给产品的 durable Resource/Unit creation operation。不能因为 import 生成了 snapshot
就绕过产品 ACL、identifier mapping 或恢复逻辑。

### Modify

通过 collaboration runtime 加载权威 checkpoint，用 Facade 修改 live content。不能为了省事直接
修改 import 或 fetch 得到的 snapshot object。

### Inspect

执行并 commit 后读取 stored model。Command 没有报错只说明调用成功，不代表目标 range、paragraph、
shape、field 或 record 已按预期存在。

当前 content inspection 证据覆盖 Sheet、Doc 与 Slide。Base/Board 在 inspection package 明确支持前，
使用 Unit-specific Facade 或 canonical model read。

### Render、lint 与 screenshot

视觉布局重要时渲染已物化 UnitData，并按 Unit-specific surface 截取 review 证据。当前 layout lint
规则只覆盖 Slide，不能宣称它验证 Sheet、Doc、Base 或 Board。

### Export 与 round trip

目标交付物是 Office 文件时执行 export。Format fidelity 属于验收标准时，应打开或重新 import
输出。Structural readback、screenshot review 与 round trip 分别验证不同风险，不能把任何一项
当作通用证明。

## 7. 并发、安全与权限

- 重试时保持 runtime submission idempotency identity。
- 写入前以及 runtime 要求时 pull confirmed remote changes。
- 每个 stateful target key 保持一个 exclusive lease。
- Workspace ACL 同时覆盖 target resolution、snapshot read、Worktree access 与 submit。
- 不在可重试 collaboration stage 发送不可逆副作用。
- 没有用户显式授权时，不 merge、discard、trash、publish 或 deploy。
- Credential 不进入 skill reference、generated code、log 或 screenshot。

## 8. End-to-end 验收

在 installed skill 与 application seam 证明这些行为：

1. 把 authorized Resource 解析到正确 Unit 与 Worktree target。
2. Load/inspect 与浏览器相同的 confirmed content。
3. Commit 一次 Agent change，并通过浏览器 client 观察结果。
4. 引入 concurrent browser change，验证文档规定的 retry 或 terminal conflict 行为。
5. Read back committed model，并获取相关视觉或 Office 证据。
6. 把 Worktree 标记 ready，返回 review URL，但不 merge。
7. Unauthorized target 与 Worktree 在内容访问前被拒绝。
8. Runtime lease 与 worker resource 在成功和失败后都释放。
