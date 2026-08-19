<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-endpoint

English | [简体中文](./package-collaboration-endpoint.zh-CN.md)

`UniverCollabEndpoint` is the protocol layer of a Univer Collaboration server. It receives HTTP requests and WebSocket messages dispatched by Node Transport, uses the `UniverCollabService` API to read and write collaboration data, and manages Sessions, Unit rooms, Presence, ACKs, and broadcasts.

```text
Node HTTP server
→ Transport                  application authentication; sets ctx.userID and ctx.customData
→ UniverCollabEndpoint       HTTP/WebSocket protocol, Sessions, and realtime rooms
→ UniverCollabService        data reads, changeset submission, and Unit lifecycle
→ Database Adapter           snapshot, changeset, and revision persistence
```

Register Endpoint with `@univerjs-pro/collaboration-transport-node` through `transport.register()`. It does not start a separate HTTP or WebSocket server.

## Server assembly

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-memory
```

```ts
import { MemoryDatabaseAdapter } from '@univerjs-pro/collaboration-database-memory';
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';
import { createNodeTransport } from '@univerjs-pro/collaboration-transport-node';

const database = new MemoryDatabaseAdapter();
const collabService = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(collabService);
const transport = createNodeTransport();

// Authenticate HTTP requests and attach identity in Transport middleware first.
transport.use(async (ctx, next) => {
  const user = await authenticate(ctx.incomingMessage);
  if (!user) {
    ctx.response.statusCode = 401;
    ctx.response.end('Authentication required');
    return;
  }

  ctx.userID = user.userId;
  ctx.customData.user = user;
  await next();
});

// Endpoint must be registered after authentication middleware.
transport.register(endpoint);
```

This uses the Memory Adapter to keep the example minimal; all data is lost when the process exits. See the `@univerjs-pro/collaboration-transport-node` README for attaching Node HTTP requests and WebSocket upgrades.

All Collaboration and Univer frontend packages should use matching versions from the same release cohort.

## Two request classes

Endpoint handles two broad protocol classes: document-data requests and realtime Sessions. They use different middleware and contexts.

### Document-data requests

Snapshot, block, fetch-missing, new-changes, and Unit delete/recover are HTTP requests. They use the identity and custom data attached to the current HTTP request by Transport middleware:

```text
HTTP snapshot / block / fetch-missing / new-changes / delete / recover
→ Transport middleware sets ctx.userID and ctx.customData
→ Endpoint parses the protocol and calls UniverCollabService APIs
→ Service middleware reads ctx.userID and ctx.customData
→ Service / Database Adapter
```

Service middleware receives `ctx.userID` and `ctx.customData` from the current HTTP request's Transport middleware. They can be used for authorization, logging, and external integrations. For example:

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

collabService.use('readUnitData', async (ctx, next) => {
  // Both fields come from Transport middleware for the current HTTP request.
  if (!await acl.canRead(ctx.userID, ctx.request.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is not accessible');
  }

  await next();
});
```

`readUnitData` protects snapshot, block, and fetch-missing. New-changes and Unit delete/recover use the Service actions `submitChangeset`, `deleteUnits`, and `recoverUnits`, respectively.

### Realtime Sessions

Session-ticket and WebSocket open, HELLO, HEARTBEAT, JOIN, LEAVE, and Presence belong to the realtime Session flow:

```text
GET /universer-api/user/session-ticket
→ Transport middleware sets ctx.userID and ctx.customData
→ Endpoint stores the association server-side and returns a one-time opaque ticket
→ WebSocket handshake consumes the ticket; invalid tickets return HTTP 401 before upgrade
→ Endpoint creates Session { userID, memberID, customData }
→ Endpoint middleware reads ctx.session
```

The ticket string does not contain `userID` or `customData`. Of all HTTP routes, only the session-ticket request carries its current `ctx.userID` and `ctx.customData` into the WebSocket Session.

Endpoint middleware reads them from `ctx.session.userID` and `ctx.session.customData`. Endpoint generates a `memberID` for each WebSocket Session, and it changes after reconnecting.

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

endpoint.use('joinUnit', async (ctx, next) => {
  // Both fields originate from the session-ticket HTTP request.
  if (!await acl.canRead(ctx.session.userID, ctx.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'Unit is not accessible');
  }

  await next();
});
```

### `new-changes` connects both classes

New-changes is an HTTP document-data request, but its ACK and broadcast are delivered over WebSocket:

```text
HTTP new-changes { memberID }
→ Endpoint locates an online Session by memberID
→ verifies session.userID === current HTTP ctx.userID
→ verifies that the Session has JOINed the target Unit
→ calls the Service with the current HTTP ctx.userID and ctx.customData
→ sends ACK and broadcast over WebSocket
```

`memberID` is only used to locate a WebSocket Session and is not an identity credential by itself. Endpoint owns these associations and checks; the application does not need to implement them.

## Middleware

Endpoint provides four realtime protocol middleware actions. Document-data requests use the Service middleware described above; see the `@univerjs-pro/collaboration-service` README for all Service actions.

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `connect` | After consuming the ticket and creating the Session, before handling `HELLO` | `session`, `connection`, `member` | Once per connection; runs again after reconnecting | Connection policy, member names and avatars |
| `joinUnit` | After receiving `JOIN`, before the Session joins the room | `session`, `unitID` | Once for the Session's first JOIN; Endpoint does not retry | Room read ACL |
| `receivePresence` | After a joined Session sends Presence, before broadcasting to the room | `session`, `unitID`, `payload`, `customData` | Once per Presence message; Endpoint does not retry | Presence validation, rate limits, filtering |
| `sendPresence` | Before sending Presence to one room member | Fields above plus `targetMemberID` | Once per target member; send failures are not retried | Per-recipient Presence filtering |

The `session` in this table originates from the session-ticket request. Top-level `customData` in a Presence context is a separate object created by Transport for the current WebSocket message.

Middleware for the same action runs in registration order. `await next()` enters the next middleware; throw `CollabError` for an expected rejection.

`joinUnit` only protects the realtime room and cannot replace Service `readUnitData` middleware. A client that has not joined a room can still issue a snapshot HTTP request directly.

## Protocol route reference

The table uses the default `protocolBasePath=/universer-api`. Univer Collaboration Client normally calls these routes; applications do not need to wrap them manually.

| Channel | Method / Message | Path | Purpose |
| --- | --- | --- | --- |
| HTTP | `GET` | `/universer-api/user/session-ticket` | Obtain a one-time WebSocket ticket |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/rev/:revision` | Load Unit snapshot and changesets |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/block/:blockID` | Load a Unit block |
| HTTP | `GET` | `/universer-api/snapshot/block/:type/unit/:unitID/block/:blockID` | Load a parsed Unit block |
| HTTP | `GET` | `/universer-api/snapshot/:type/unit/:unitID/fetchmissing?from=:from&to=:to` | Load missing changesets |
| HTTP | `POST` | `/universer-api/comb/:type/unit/:unitID/new_changes` | Submit a changeset |
| HTTP | `DELETE` | `/universer-api/snapshot/-/units` | Delete Units |
| HTTP | `POST` | `/universer-api/snapshot/-/units/recover` | Recover Units |
| WebSocket open | `GET` + Upgrade | `/universer-api/comb/connect?sessionTicket=:ticket` | Consume a ticket and establish a Session |
| WebSocket | `HELLO/HEARTBEAT/JOIN/LEAVE/Presence` | `/universer-api/comb/connect` | Members, rooms, and Presence |

## Configuration and deployment

```ts
const endpoint = new UniverCollabEndpoint(collabService, {
  protocolBasePath: '/universer-api',      // default
  sessionTicketTtlMs: 5 * 60_000,          // default: 5 minutes
});
```

Sessions, Unit rooms, and pending-send queues are process-local, so realtime delivery is only guaranteed within a single Endpoint process. Cross-process online members, rooms, and broadcasts are not currently supported.

WebSocket ACKs and broadcasts are not guaranteed to reach the client and are not an authoritative data source. After disconnecting, clients use revisions and fetch-missing HTTP requests to recover confirmed changesets.

### Shutdown

Transport disposes registered Endpoints. Endpoint clears Sessions, rooms, and Service event subscriptions. The application must still dispose the Service and Database Adapter.

```ts
await transport.dispose();
await collabService.dispose();
await database.dispose();
```
