<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-endpoint

English | [简体中文](./package-collaboration-worktree-endpoint.zh-CN.md)

Provides Worktree management APIs and accepts Univer collaboration requests scoped to a specific Worktree. It uses `UniverCollabWorktreeService` APIs for Worktree management and collaboration-data operations.

## Installation and registration

```bash
pnpm add \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-endpoint \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node
```

Worktree Endpoint and trunk Endpoint must share the same `ticketStore`:

```ts
const ticketStore = new MemorySessionTicketStore();
const trunkEndpoint = new UniverCollabEndpoint(collabService, { ticketStore });
const worktreeEndpoint = new UniverCollabWorktreeEndpoint(
  worktreeService,
  { ticketStore }
);

transport.use(authenticationMiddleware);
transport.register(trunkEndpoint);
transport.register(worktreeEndpoint);
```

Authentication middleware must first set `ctx.userID` for HTTP requests. Apart from sharing the same `ticketStore` instance, no extra association between Endpoints is needed. Every WebSocket connection still uses its own one-time ticket.

## What the frontend receives

- Worktree HTTP APIs for create, read, ready, reopen, discard, merge, and preview.
- Separate snapshot, changeset, ACK, broadcast, and Presence channels for each Worktree.
- A `/events` WebSocket for Worktree state changes, allowing product UI to refresh ready/merged state.

Applications do not place `worktreeID` into changesets or room IDs themselves. The browser configures the target Worktree, Endpoint reads `worktreeID` from the URL, and data and realtime rooms remain isolated between Worktrees.

## Worktree protocol paths

The protocol is rooted at `/universer-api/worktrees/:worktreeID`. One collaboration WebSocket belongs to one Worktree. Even with the same `unitID`, edits and online members in different Worktrees are isolated. Worktree state changes use a separate `/events` WebSocket instead of injecting unknown events into the collaboration WebSocket.

Management APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/universer-api/worktrees` | Create Worktree |
| `GET` | `/universer-api/worktrees/:worktreeID` | Read complete Worktree state |
| `POST` | `/universer-api/worktrees/:worktreeID/units` | Add an existing trunk Unit |
| `POST` | `/universer-api/worktrees/:worktreeID/units/from-snapshot` | Create draft Unit from protocol snapshot |
| `POST` | `/universer-api/worktrees/:worktreeID/units/from-data` | Create draft Unit from Univer Unit data |
| `GET` | `/universer-api/worktrees/:worktreeID/units/:unitID/merge-preview` | Evaluate one Unit merge |
| `POST` | `/universer-api/worktrees/:worktreeID/ready` | Freeze each Unit's current draft revision |
| `POST` | `/universer-api/worktrees/:worktreeID/reopen` | Return to draft |
| `POST` | `/universer-api/worktrees/:worktreeID/merge` | Merge Units into trunk one by one |
| `POST` | `/universer-api/worktrees/:worktreeID/discard` | Discard Worktree |

Realtime and collaboration channels:

| Channel | Path | Purpose |
| --- | --- | --- |
| HTTP | `/universer-api/worktrees/:worktreeID/snapshot/...` | Read this Worktree's snapshot, blocks, and missing changesets |
| HTTP | `/universer-api/worktrees/:worktreeID/comb/...` | Submit a changeset to this Worktree |
| WebSocket | `/universer-api/worktrees/:worktreeID/comb/connect` | Worktree Sessions, rooms, Presence, ACKs, broadcasts |
| WebSocket | `/universer-api/worktrees/:worktreeID/events` | Push complete `WorktreeData` state |

The URL is authoritative for `worktreeID`. `merge-preview` evaluates one Unit only in `ready`, uses `Cache-Control: no-store`, and does not perform a formal merge.

## Middleware

Worktree Endpoint middleware controls only the current Worktree's Sessions and realtime rooms:

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `connect` | After consuming ticket and creating Worktree Session, before registering collaboration or `/events` connection | `worktreeID`, `session`, `connection`, `member` | Once per connection; reconnect runs again | Member display, connection policy |
| `joinUnit` | After `JOIN`, before Session joins current Worktree room | `worktreeID`, `session`, `unitID` | Once for Session's first JOIN; Endpoint does not retry | Worktree and Unit read ACL |
| `receivePresence` | After joined Session sends Presence, before room broadcast | `worktreeID`, `session`, `unitID`, `payload`, event-scoped `customData` | Once per Presence; Endpoint does not retry | Validation, rate limits, filtering |
| `sendPresence` | Before sending Presence to one current-Worktree room member | `worktreeID`, `session`, `unitID`, `payload`, event-scoped `customData`, `targetMemberID` | Once per target; send failure not retried | Per-recipient display-data filtering |

```ts
worktreeEndpoint.use('joinUnit', async (ctx, next) => {
  if (!await acl.canReadWorktreeUnit(
    ctx.session.userID,
    ctx.worktreeID,
    ctx.unitID
  )) {
    throw new CollabError('PERMISSION_DENIED', 'Cannot join this Worktree Unit');
  }
  await next();
});
```

`joinUnit` protects only realtime rooms. Worktree data reads, submissions, and merge must be protected by Worktree Service middleware. Service middleware receives `ctx.userID/customData` attached to the current HTTP request by Transport.

## Deployment and disposal

Realtime rooms, state events, and broadcasts are currently guaranteed only within one Endpoint process.

Transport disposes registered Endpoints. Endpoint does not dispose Worktree Service, trunk Service, or the application-provided `ticketStore`.
