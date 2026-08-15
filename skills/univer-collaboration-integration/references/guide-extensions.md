<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 可选能力

先完成 Collaboration 主线，再按产品需求选择可选能力。History、Thread Comment 和 Worktree
都有独立的 Service、middleware 和 Database Adapter，但可以复用同一个 Transport、应用
认证以及 SQLite 文件。

| 需求 | 增加什么 | 先运行的 example |
| --- | --- | --- |
| 面向用户的版本历史 | History Service + Endpoint + Adapter | [History](./example-history.md#overview) |
| Sheet/Doc Thread Comment | Comment Service + Endpoint + Adapter | [Comments](./example-comments.md#overview) |
| 隔离 draft、评审并合入 trunk | Worktree Service + Endpoint + Client + Adapter | [Worktree](./example-worktree.md#overview) |

每个 example 的 `server/main.ts` 和 `web/main.ts` 是推荐的组装参考。具体构造参数、API、
middleware action 和资源释放以对应 Package README 为准。

## History

History 把 confirmed revisions 分组为面向用户的历史条目，并补全创建者资料。它是协同数据
的派生索引，Collaboration Service 保存的 confirmed changesets 才是 Unit 状态的权威来源。

```text
Transport
├─→ UniverHistoryEndpoint → UniverHistoryService → History Adapter
└─→ UniverCollabEndpoint  → UniverCollabService  → core Adapter
```

接入时先组装 core，再创建 History Service 并 `attach(collabService)`，最后把 History
Endpoint 和主 Endpoint 注册到同一个 Transport。History Service 有独立 middleware；
User Provider 只补全姓名和头像，不是权限边界。

`attach()` 适合进程内更新派生索引，失败不会回滚已经确认的协同数据。若要求历史索引严格
不丢失，应在协同提交事务中写 transactional outbox，再由可重复执行的任务更新 History。

## Thread Comment

Comment Service 保存评论正文、回复、编辑和 solved 状态；会随 Sheet/Doc 结构变化的 root
anchor 仍属于主协同 snapshot/changeset。两部分都要纳入产品的数据生命周期。

```text
Transport
├─→ UniverCommentEndpoint → UniverCommentService → Comment Adapter
└─→ UniverCollabEndpoint  → UniverCollabService  → core Adapter
```

Comment Endpoint 通过主 Endpoint 的 Unit room 发布 `comment_update`，因此创建时要把主
Endpoint 作为 `roomHost`。读取评论是普通 HTTP；写评论会关联已经 JOIN 的在线 Session。
所有路由使用当前 Transport HTTP 请求的 `userID/customData` 调用 Comment Service，Comment
权限安装在 Comment Service middleware。

实时更新失败不会回滚已经提交的评论，客户端可以重新 list 恢复。当前实时广播仍只覆盖
一个主 Endpoint 进程。

## Worktree

Worktree 为一个或多个 Unit 提供隔离的协同 draft，以及 ready、reopen、discard、合入评估
和逐 Unit merge。它复用 trunk Service 的 OT 和提交引擎，但 draft changesets、状态和实时
房间都按 `(worktreeID, unitID)` 隔离。

```text
Transport
├─→ Worktree Endpoint → Worktree Service → Worktree Adapter
└─→ trunk Endpoint    → trunk Service    → core Adapter
```

trunk Endpoint 与 Worktree Endpoint 必须共享同一个 session ticket store；当前提供的内存
实现适用于它们位于同一进程的推荐拓扑。除此之外，两套 Endpoint、Service 和 Adapter 都是
独立生命周期对象。

```text
create → draft → ready → merging → merged
           ↑       │
           └ reopen┘

draft / ready → discarded
```

只有 `draft` 可以继续提交。`markReady` 冻结各 Unit 当前 draft revision；多 Unit merge 按
Unit 推进，不保证跨 Unit 原子性，产品 UI 应展示每个 Unit 的 merge result。

Worktree middleware 与 trunk Service middleware 相互独立：前者保护 draft 可见性、编辑和
merge，最终写入 trunk 时仍会进入 trunk Service 自己的权限 middleware。Worktree 的实时
房间、状态事件和广播当前同样只保证单 Endpoint 进程。

## 共同的存储和生命周期规则

- core、History、Comment 和 Worktree SQLite Adapter 可以使用同一个数据库文件，但它们是
  不同契约和资源对象，需要分别创建和释放。
- 可选 Service 不继承主 Service middleware；应用必须分别安装所需的读取和写入策略。
- core hard delete 不会自动清理其他模块的数据，跨模块删除和保留策略由应用协调。
- 所有 Collaboration 和 Univer package 必须使用同一匹配 release cohort 的精确版本。
