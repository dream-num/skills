<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-comment-endpoint

English | [简体中文](./package-collaboration-comment-endpoint.zh-CN.md)

A Univer Thread Comment HTTP and realtime Endpoint for `@univerjs-pro/collaboration-comment-service`.

It handles Univer Comment protocol requests with the Comment Service API and publishes `comment_update` to online members through the main Collaboration Endpoint's Unit rooms.

```text
HTTP Comment request
→ Transport authentication middleware
→ UniverCommentEndpoint
→ Comment Service middleware
→ Comment Database Adapter

Comment commit succeeds
→ main UniverCollabEndpoint Unit room
→ comment_update
```

## Installation and registration

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

Registration order is authentication → Comment Endpoint → main Collaboration Endpoint. `roomHost` lets Comment realtime delivery reuse Sessions and Unit rooms already established by the main Endpoint.

## HTTP and realtime updates

The table uses the default `protocolBasePath=/universer-api`:

| Method | Path | Service action | Session requirement |
| --- | --- | --- | --- |
| `GET/POST` | `/universer-api/comment/unit/:unitID/list` | `listComments` | No online Session required |
| `POST` | `/universer-api/comment/unit/:unitID/add` | `addComment` | User and `memberId` must match a joined Session |
| `POST` | `/universer-api/comment/unit/:unitID/reply` | `replyComment` | Same as above |
| `POST` | `/universer-api/comment/unit/:unitID/edit` | `editComment` | Same as above |
| `POST` | `/universer-api/comment/unit/:unitID/solved` | `setThreadSolved` | Must associate the current user with a joined Session |
| `POST` | `/universer-api/comment/unit/:unitID/delete` | `deleteComment` | User and `memberId` must match a joined Session |

Every route calls Comment Service with `ctx.userID/customData` set by Transport middleware for the current HTTP request. List is a regular HTTP read. Writes additionally associate an online Session so the submitter can be excluded from realtime broadcasts. Comment ACL remains controlled by Comment Service middleware.

After Comment Service commits successfully, Endpoint sends `comment_update` to other online members of the Unit. If the application calls Comment Service directly and its `memberID` resolves to an online Session, that Session is treated as the initiator and does not receive its own broadcast. If it cannot be resolved, the update is broadcast to all currently online members. The HTTP response does not depend on realtime delivery succeeding.

Endpoint handles protocol errors and realtime updates but does not define Comment ACL. Install permissions in Comment Service. Realtime broadcasts currently cover only one main Endpoint process. Send failure does not roll back committed Comments; clients recover by listing again.

Transport disposes registered Endpoints. Comment Endpoint does not own Comment Service or the main Endpoint.
