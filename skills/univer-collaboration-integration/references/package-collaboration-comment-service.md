<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-service

English | [简体中文](./package-collaboration-comment-service.zh-CN.md)

The domain Service for Univer Sheet/Doc Thread Comments. When using Univer Comment Client, `UniverCommentEndpoint` calls it according to the frontend Comment protocol:

```text
Transport
→ UniverCommentEndpoint
→ UniverCommentService
→ Comment Database Adapter
```

It manages comment bodies, replies, edits, solve/reopen, deletion, user-profile enrichment, middleware, and post-commit events. Root anchors that move with Sheet/Doc structure remain in the main collaboration snapshot/changeset plane.

## Installation and creation

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

User Provider only enriches list responses and add/reply realtime updates with names and avatars. A missing user or Provider failure does not roll back a Comment data operation.

Next, create `UniverCommentEndpoint` with this Service and register Comment Endpoint and the main `UniverCollabEndpoint` on the same Transport.

## Comment middleware

Comment Service has no built-in owner, editor, or author ACL. Install middleware for all six actions according to application policy:

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `addComment` | After input normalization, before writing a root comment | `userID`, `memberID`, `customData`, `request` | Once per call; Adapter does not trigger retries | Unit Comment ACL, tenant, audit |
| `listComments` | After input normalization, before reading the database | `userID`, `customData`, `request` | Once per call | Unit read ACL, query audit |
| `replyComment` | After input normalization, before writing a reply | `userID`, `memberID`, `customData`, `request` | Once per call | Unit Comment ACL, rate limits |
| `setThreadSolved` | After input normalization, before writing state | `userID`, `memberID`, `customData`, `request` | Once per call | Solve/reopen permission |
| `editComment` | After input normalization, before atomic author/open-state checks | `userID`, `memberID`, `customData`, `request` | Once per call | Unit Comment ACL; Service still checks author |
| `deleteComment` | After resolving the target, before deletion with a concurrency-version check | `userID`, `memberID`, `customData`, `request`, readonly `target` | Once per call; no automatic retry after concurrent target changes | Author, Unit owner, or administrator delete policy |

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

The `deleteComment` context already contains the resolved target author and concurrency version. `listComments` should check Unit read access; all other actions should check Comment write access.

## Advanced integration: call Comment Service directly

Reading comments needs only the current business user. Writes also need the current online collaboration member's `memberID`:

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

When a browser uses Univer Comment Client, `UniverCommentEndpoint` normally gets `memberID` from the established online Session; applications do not need to generate one in product HTTP APIs. Only background programs that call a write method directly need to supply their own `memberID`.

## Consistency and disposal

Comment bodies belong in Comment Database Adapter, not the core Collaboration Adapter. Realtime `comment_update` delivery is not guaranteed for every update, and send failure cannot roll back committed data. Clients can recover by listing comments again.

```ts
await commentService.dispose();
await commentDatabase.dispose();
```

The Service does not dispose an externally injected Database Adapter or User Provider.
