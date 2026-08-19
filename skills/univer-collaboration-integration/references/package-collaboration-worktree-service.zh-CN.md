<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-service

[English](./package-collaboration-worktree-service.md) | [简体中文](./package-collaboration-worktree-service.zh-CN.md)

无网络依赖的 Univer Worktree Service，为一个或多个 Unit 提供可协同编辑的 draft、冻结、
合入评估和逐 Unit merge。

Worktree 以 `(worktreeID, unitID)` 隔离 draft changesets，复用 trunk
`UniverCollabService` 的 OT、Unit 数据处理和提交引擎，不修改现有 changeset 结构。

使用 Worktree Client 时，由 `UniverCollabWorktreeEndpoint` 调用 Worktree Service；应用
直接调用下面的 Service API 属于高级集成。

## 安装与创建

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-endpoint \
  @univerjs-pro/collaboration-database-sqlite \
  @univerjs-pro/collaboration-worktree-database-sqlite
```

```ts
const trunkDatabase = new SQLiteDatabaseAdapter({ filename });
const worktreeDatabase = new SQLiteWorktreeDatabaseAdapter({ filename });

const collabService = new UniverCollabService({
  dbAdapter: trunkDatabase,
});
const worktreeService = new UniverCollabWorktreeService({
  trunk: {
    service: collabService,
    dbAdapter: trunkDatabase,
  },
  dbAdapter: worktreeDatabase,
});
```

trunk 和 Worktree Adapter 可以使用同一个 SQLite 文件，但仍是两个独立契约和生命周期
对象。全部协同包必须使用同一 release cohort 的匹配版本。

接着创建 `UniverCollabWorktreeEndpoint`，并与 trunk Endpoint 注册到同一个
Transport。

## Worktree middleware

Worktree middleware 与 trunk Service middleware 相互独立：

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `readWorktreeData` | Worktree Request 创建后、读 Adapter 前 | `userID`、`customData`、`request` | 每次 API 调用一次 | Worktree 可见性和管理读取 ACL |
| `createWorktree` | Request 创建后、创建 Worktree 前 | `userID`、`customData`、`request` | 每次调用一次 | 创建权限、配额和可发现范围 |
| `addWorktreeUnit` | Request 创建后、加入 trunk Unit 前 | `userID`、`customData`、`request` | 每次调用一次 | Unit 读取/编辑权限 |
| `createWorktreeUnit` | 初始 snapshot 准备后、创建 draft Unit 前 | `userID`、`customData`、`request` | 每次调用一次 | 新 Unit 类型、配额和创建权限 |
| `markWorktreeReady` | Request 创建后、Adapter 冻结各 Unit 当前 draft revision 前 | `userID`、`customData`、`request` | 每次调用一次 | ready 权限和评审规则 |
| `reopenWorktree` | Request 创建后、Adapter 切回 draft 前 | `userID`、`customData`、`request` | 每次调用一次 | reopen 权限 |
| `discardWorktree` | Request 创建后、Adapter discard 前 | `userID`、`customData`、`request` | 每次调用一次 | discard 权限和审计 |
| `mergeWorktree` | Request 创建后、开始或继续逐 Unit merge 前 | `userID`、`memberID`、`customData`、`request` | 每次 merge 调用一次；内部 Unit 提交重试不重复该 action | 正式合入权限 |
| `readUnitData` | Worktree Unit Request 创建后、读取 draft 数据前 | `userID`、`customData`、`request` | 每次 API 调用一次 | draft Unit 读取 ACL、合入预览读取 |
| `submitChangeset` | draft 提交 Request 创建后、幂等与 OT 前 | `userID`、`memberID`、`customData`、`request` | 每次逻辑提交一次；数据库 revision 冲突重试时不重复 | draft 编辑 ACL、大小限制 |
| `applyChangeset` | changeset 已通过 OT 与当前 revision 对齐、应用到待提交 Unit 状态前 | `userID`、`memberID`、`customData`、`request`、`changeset`、`currentRevision`、`attempt` | 数据库 revision 冲突后重复 | 对齐后的 mutation 检查 |
| `commitChangeset` | changeset 已应用到待提交 Unit 状态、Adapter 检查 revision 并写入前 | `userID`、`memberID`、`customData`、`request`、`changeset`、`expectedHeadRevision`、`attempt` | 数据库 revision 冲突后重复 | 最终 revision 检查和指标 |

`applyChangeset` 和 `commitChangeset` 必须可重试，不能执行不可回滚副作用。Worktree 最终
合入 trunk 时仍会进入 trunk Service 自己的 middleware。

## 高级集成：直接使用 Worktree Service API

每次调用都显式传入当前用户，不需要先打开或绑定一个有状态的 Worktree handle：

```ts
const context = {
  userID: user.userId,
  customData: { tenantID, traceID },
};

await worktreeService.createWorktree(
  { worktreeID, units: [unitID] },
  context
);

await worktreeService.markReady({ worktreeID }, context);

const result = await worktreeService.mergeWorktree(
  { worktreeID },
  { ...context, memberID }
);
```

普通生命周期和读取方法只需要 `userID`。`submitChangeset()` 与 `mergeWorktree()` 还需要
`memberID`，因为它们可能关联一次在线协同提交。通过 Worktree Endpoint 使用前端 SDK
时，Endpoint 会提供在线 Session 的 `memberID`；应用直接调用这两个方法时自行传入，
Service 只透传该字符串。

`customData` 只属于本次调用，可用于 tenant、trace 或 ACL 查询缓存，不会自动持久化到
Worktree 或 changeset。

## 常用 API

- `createWorktree()` / `getWorktree()`：创建和读取 Worktree。
- `addUnit()`：把已有 trunk Unit 加入 Worktree。
- `createUnitFromData()`：在 Worktree 中创建尚不存在于 trunk 的 Unit。
- `getUnit()` / `getChangesets()`：读取 draft 协同数据。
- `submitChangeset()`：提交 draft changeset。
- `markReady()` / `reopenWorktree()` / `discardWorktree()`：推进或终止生命周期。
- `evaluateWorktreeUnitMerge()`：生成单个 Unit 的合入评估或预览。
- `mergeWorktree()`：把 Worktree 中的 Unit 逐个合入 trunk。

## 生命周期

```text
create → draft → ready → merging → merged
           ↑       │
           └ reopen┘

draft/ready → discarded
```

- 只有 `draft` 可以继续提交 changeset。
- `markReady()` 冻结每个 Unit 当前的 draft revision。
- `reopenWorktree()` 允许 `ready → draft`。
- `mergeWorktree()` 逐 Unit 合入 trunk。
- 多 Unit merge 不保证跨 Unit 原子性，应展示每个 Unit 的 `mergeResult`。

Worktree 可以引用已有 trunk Unit，也可以通过 `createUnitFromData()` 创建只存在于
Worktree 的新 Unit。新 Unit merge 后以 revision `1` 在 trunk 创建，不复制 draft
changeset 历史。

## 权限边界

Worktree middleware 与 trunk Service middleware 相互独立。应用应分别保护 Worktree
本身和最终 trunk 写入。例如在 `readWorktreeData` 检查可见性，在 `submitChangeset`
检查 draft 编辑权，在 `mergeWorktree` 检查正式合入权；合入 trunk 时仍会执行 trunk
Service 自己的权限 middleware。

合入预览复用读取权限，不代表用户拥有正式 merge 权限。Worktree 的可发现范围也不能替代
实时的 Unit ACL 检查。

## 合入评估

`evaluateWorktreeUnitMerge()` 只在 `ready` 状态使用，可能返回：

- `preview`：trunk 已前进，并生成静态合入结果 snapshot。
- `conflict`：Worktree 修改无法通过 OT 自动合入当前 trunk。
- `not-behind`：trunk 自创建 Worktree 时记录的 revision 后没有前进。
- `already-merged`：该 Unit 已在之前的部分 merge 中完成。
- `not-applicable`：Worktree 内新建 Unit，没有对应的初始 trunk revision。

评估不会提交 changeset，也不会改变 Worktree 状态；正式 merge 始终以执行时的 trunk
为准。

## 限制与资源释放

当前不提供 Worktree 删除、回滚/重置、History、Worktree 引用的 trunk 历史清理或周期性
draft snapshot。停止顺序为 Worktree Service → trunk Service → 两个 Adapter：

```ts
await worktreeService.dispose();
await collabService.dispose();
await worktreeDatabase.dispose();
await trunkDatabase.dispose();
```
