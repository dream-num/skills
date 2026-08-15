<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-client

现有 Univer Pro Collaboration Client 的 Worktree 集成层，提供 Worktree 专用 URL、管理 API、
合入预览配置和完整状态事件。它不重新实现 OT、offline state 或 ACK state machine。

## 安装

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-client \
  @univerjs-pro/collaboration \
  @univerjs-pro/collaboration-client \
  @univerjs-pro/collaboration-client-ui
```

全部 Univer 和 Collaboration package 必须使用匹配的精确版本。

## 连接 Worktree 协同

```ts
const worktreeConfig = createWorktreeCollaborationConfig({
  origin: location.origin,
  worktreeID,
});

createUniver({
  collaboration: true,
  plugins: [
    UniverCollaborationPlugin,
    [UniverCollaborationClientPlugin, {
      socketService: BrowserCollaborationSocketService,
      ...worktreeConfig,
    }],
    UniverCollaborationClientUIPlugin,
  ],
});
```

Collaboration plugin 必须在 `createUniver({ plugins })` 时注册，不能等 Univer 启动后再
调用 `registerPlugin()`。

## 管理 Worktree

```ts
const client = new WorktreeClient({ origin: location.origin });

await client.createWorktree({
  worktreeID,
  units: [trunkUnitID],
});
await client.markReady(worktreeID);

const evaluation = await client.evaluateUnitMerge(worktreeID, trunkUnitID);
const result = await client.mergeWorktree(worktreeID);
```

`WorktreeClient` 还提供 get、add Unit、从 snapshot/data 创建 Unit、reopen 和 discard。
需要自定义 Cookie、Header 或错误处理时，通过构造参数注入 `fetch`。

## 静态合入预览

```ts
if (evaluation.status === 'preview') {
  const previewConfig = createWorktreeMergePreviewConfig({
    origin: location.origin,
    worktreeID,
    preview: evaluation.preview,
  });

  // 将 previewConfig 传给新的只读 UniverCollaborationClientPlugin。
}
```

该配置直接从 evaluation 结果提供内存 snapshot 和可选的 Sheet blocks，设置
`enableCollaboration: false` 并拒绝保存，不建立 WebSocket，也不发起独立的 resource
网络请求。

## 订阅完整状态

```ts
const events = new WorktreeEventClient({
  origin: location.origin,
  worktreeID,
});

const subscription = events.onChange((worktree) => {
  renderStatus(worktree.status, worktree.units);
});

await events.connect();

subscription.dispose();
events.dispose();
```

首帧是完整 `WorktreeData`。断线重连时 Client 会重新获取一次性 session ticket。
