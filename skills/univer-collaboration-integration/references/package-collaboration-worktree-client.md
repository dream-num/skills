<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-client

English | [简体中文](./package-collaboration-worktree-client.zh-CN.md)

The Worktree integration layer for the existing Univer Pro Collaboration Client. It provides Worktree-specific URLs, management APIs, merge-preview configuration, and complete-state events. It does not reimplement OT, offline state, or the ACK state machine.

## Installation

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-client \
  @univerjs-pro/collaboration \
  @univerjs-pro/collaboration-client \
  @univerjs-pro/collaboration-client-ui
```

All Univer and Collaboration packages must use matching exact versions.

## Connect to Worktree collaboration

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

Register Collaboration plugins in `createUniver({ plugins })`; do not wait until Univer starts and call `registerPlugin()`.

## Manage a Worktree

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

`WorktreeClient` also provides get, add Unit, create Unit from snapshot/data, reopen, and discard. Inject `fetch` through constructor options to customize cookies, headers, or error handling.

## Static merge preview

```ts
if (evaluation.status === 'preview') {
  const previewConfig = createWorktreeMergePreviewConfig({
    origin: location.origin,
    worktreeID,
    preview: evaluation.preview,
  });

  // Pass previewConfig to a new read-only UniverCollaborationClientPlugin.
}
```

This configuration provides an in-memory snapshot and optional Sheet blocks directly from the evaluation result, sets `enableCollaboration: false`, rejects saves, opens no WebSocket, and makes no separate resource network request.

## Subscribe to complete state

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

The first frame is complete `WorktreeData`. Client obtains a new one-time session ticket when reconnecting.
