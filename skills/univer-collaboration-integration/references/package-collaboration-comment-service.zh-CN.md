<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-service

[English](./package-collaboration-comment-service.md) | [简体中文](./package-collaboration-comment-service.zh-CN.md)

Univer Sheet/Doc Thread Comment 的领域 Service。使用 Univer Comment Client 时，
`UniverCommentEndpoint` 会根据前端 Comment 协议调用它：

```text
Transport
→ UniverCommentEndpoint
→ UniverCommentService
→ Comment Database Adapter
```

它管理评论正文、回复、编辑、solve/reopen、删除、用户资料补全、middleware 和提交后
event。会随 Sheet/Doc 结构变化的 root anchor 仍保存在主协同 snapshot/changeset 平面。

## 安装与创建

```bash
pnpm add \
  @univerjs-pro/collaboration-comment-service \
  @univerjs-pro/collaboration-comment-endpoint \
  @univerjs-pro/collaboration-comment-database-sqlite
```

```ts
const commentDatabase = new SQLiteCommentDatabaseAdapter({
  filename: './data/collaboration.sqlite',
});
const commentService = new UniverCommentService({
  database: commentDatabase,
  userProvider: {
    async getUsers(userIDs, { customData }) {
      return applicationUsers.findMany(
        userIDs,
        customData.tenantID
      );
    },
  },
});
```

User Provider 只为 list 响应和 add/reply 实时更新补全姓名、头像。用户缺失或 Provider
失败不会回滚 Comment 数据操作。

接着用这个 Service 创建 `UniverCommentEndpoint`，并把 Comment Endpoint 与主
`UniverCollabEndpoint` 注册到同一个 Transport。

## Comment middleware

Comment Service 不内置 owner、editor 或 author ACL。六个 action 都应按应用策略安装
middleware：

| Action | 触发时机 | 可见字段 | 重试语义 | 典型用途 |
| --- | --- | --- | --- | --- |
| `addComment` | 输入规范化后、根评论写入前 | `userID`、`memberID`、`customData`、`request` | 每次调用一次；Adapter 不触发重试 | Unit Comment ACL、tenant、审计 |
| `listComments` | 输入规范化后、读库前 | `userID`、`customData`、`request` | 每次调用一次 | Unit 读取 ACL、查询审计 |
| `replyComment` | 输入规范化后、回复写入前 | `userID`、`memberID`、`customData`、`request` | 每次调用一次 | Unit Comment ACL、限流 |
| `setThreadSolved` | 输入规范化后、状态写库前 | `userID`、`memberID`、`customData`、`request` | 每次调用一次 | solve/reopen 权限 |
| `editComment` | 输入规范化后、作者与 open 状态原子检查前 | `userID`、`memberID`、`customData`、`request` | 每次调用一次 | Unit Comment ACL；Service 仍检查作者 |
| `deleteComment` | 目标已读取、执行带并发版本检查的删除前 | `userID`、`memberID`、`customData`、`request`、只读 `target` | 每次调用一次；目标被并发修改时不自动重试 | 作者、Unit owner 或管理员删除策略 |

```ts
commentService.use('deleteComment', async (ctx, next) => {
  const allowed =
    ctx.target.authorUserID === ctx.userID ||
    await acl.isUnitOwner(ctx.userID, ctx.request.unitID);
  if (!allowed) {
    throw new CollabError('PERMISSION_DENIED', 'Delete denied');
  }
  await next();
});
```

`deleteComment` context 已解析目标作者和并发版本。`listComments` 应检查 Unit 读取权限，
其余 action 应检查 Comment 写权限。

## 高级集成：直接调用 Comment Service API

读取评论只需要当前业务用户；写评论还需要本次在线协同成员的 `memberID`：

```ts
const result = await commentService.listComments(
  { unitID, threadIDs },
  { userID: user.userId, customData: { tenantID } }
);

const thread = await commentService.addComment(
  { unitID, content: 'Looks good', mentions: [] },
  { userID: user.userId, memberID, customData: { tenantID } }
);
```

浏览器使用 Univer Comment Client 时，通常由 `UniverCommentEndpoint` 从已建立的在线
Session 取得 `memberID`，应用不需要在产品 HTTP API 中自行生成它。只有后台程序直接调用
写方法时，才需要自己提供一个 `memberID`。

## 一致性与释放

评论正文属于 Comment Database Adapter，不应写入 core Collaboration Adapter。实时
`comment_update` 不保证每条实时更新都送达，发送失败不能回滚已提交数据；客户端可通过
list 恢复。

```ts
await commentService.dispose();
await commentDatabase.dispose();
```

Service 不释放外部注入的 Database Adapter 或 User Provider。
