<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-endpoint

[English](./package-collaboration-comment-endpoint.md) | [简体中文](./package-collaboration-comment-endpoint.zh-CN.md)

面向 `@univerjs-pro/collaboration-comment-service` 的 Univer Thread Comment HTTP 和
实时 Endpoint。

它使用 Comment Service API 处理 Univer Comment 协议请求，并通过主协同 Endpoint 的 Unit
房间向在线成员发布 `comment_update`。

```text
HTTP Comment 请求
→ Transport authentication middleware
→ UniverCommentEndpoint
→ Comment Service middleware
→ Comment Database Adapter

Comment 提交成功
→ 主 UniverCollabEndpoint 的 Unit room
→ comment_update
```

## 安装与注册

```bash
pnpm add \
  @univerjs-pro/collaboration-comment-service \
  @univerjs-pro/collaboration-comment-endpoint \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node
```

```ts
const collabEndpoint = new UniverCollabEndpoint(collabService);
const commentEndpoint = new UniverCommentEndpoint({
  service: commentService,
  roomHost: collabEndpoint,
  protocolBasePath: '/universer-api',
});

transport.use(authenticationMiddleware);
transport.register(commentEndpoint);
transport.register(collabEndpoint);
```

注册顺序是认证 → Comment Endpoint → 主协同 Endpoint。`roomHost` 让 Comment 实时投递
复用主 Endpoint 已建立的 Session 和 Unit room。

## HTTP 与实时更新

下表使用默认 `protocolBasePath=/universer-api`：

| Method | Path | Service action | Session 要求 |
| --- | --- | --- | --- |
| `GET/POST` | `/universer-api/comment/unit/:unitID/list` | `listComments` | 不要求在线 Session |
| `POST` | `/universer-api/comment/unit/:unitID/add` | `addComment` | 用户和 `memberId` 必须对应已 JOIN 的 Session |
| `POST` | `/universer-api/comment/unit/:unitID/reply` | `replyComment` | 同上 |
| `POST` | `/universer-api/comment/unit/:unitID/edit` | `editComment` | 同上 |
| `POST` | `/universer-api/comment/unit/:unitID/solved` | `setThreadSolved` | 必须能关联当前用户已 JOIN 的 Session |
| `POST` | `/universer-api/comment/unit/:unitID/delete` | `deleteComment` | 用户和 `memberId` 必须对应已 JOIN 的 Session |

所有路由都使用当前 HTTP 请求由 Transport middleware 设置的 `ctx.userID/customData` 调用
Comment Service。list 是普通 HTTP 读取；写操作额外关联在线 Session，以便把提交者从实时
广播中排除。Comment ACL 仍由 Comment Service middleware 控制。

Comment Service 提交成功后，Endpoint 会向同一 Unit 的其他在线成员发送
`comment_update`。如果应用直接调用 Comment Service，并传入的 `memberID` 能找到在线
Session，该 Session 会被视为发起方而不接收自己的广播；找不到时则向当前全部在线成员
广播。HTTP 返回结果本身不依赖实时发送成功。

Endpoint 只负责协议错误处理和实时更新，不定义 Comment ACL；权限必须安装在 Comment
Service。当前实时广播只覆盖单个主 Endpoint 进程，发送失败不回滚已提交的
Comment，客户端通过重新 list 恢复。

Transport 释放已注册 Endpoint；Comment Endpoint 不拥有 Comment Service 或主 Endpoint。
