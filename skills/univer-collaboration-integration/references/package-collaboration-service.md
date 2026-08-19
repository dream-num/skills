<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-service

English | [简体中文](./package-collaboration-service.zh-CN.md)

The collaboration core of a Univer Collaboration server assembly, with support for Sheet, Doc, Slide, Board, and Base. The Service owns authoritative OT, continuous revisions, submission idempotency, snapshots, and the Unit lifecycle. When using Univer Collaboration Client, `@univerjs-pro/collaboration-endpoint` calls the Service according to the frontend protocol.

```text
Node Transport
→ UniverCollabEndpoint
→ UniverCollabService
→ IDatabaseAdapter
```

This README focuses on Service middleware, lifecycle, and advanced APIs. For a first integration, assemble Transport, Endpoint, Service, and a Database Adapter as described in the SDK user manual chapter “Build a Collaboration Service.”

## Installation

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node \
  @univerjs-pro/collaboration-database-sqlite \
  @univerjs/protocol
```

The Service, Database Adapter, and Univer SDK must use matching versions from the same release cohort.

## Create the Service

```ts
import { SQLiteDatabaseAdapter } from '@univerjs-pro/collaboration-database-sqlite';
import { UniverCollabService } from '@univerjs-pro/collaboration-service';

const database = new SQLiteDatabaseAdapter({
  filename: './data/collaboration.sqlite',
});
const collabService = new UniverCollabService({ dbAdapter: database });
```

Next, create a `UniverCollabEndpoint` with this Service and register the Endpoint with Node Transport.

## Service API

`UniverCollabService` provides APIs for reading collaboration data, submitting changesets, and managing the Unit lifecycle. When integrated through Endpoint, `UniverCollabEndpoint` calls these APIs according to the frontend protocol:

- `getUnit()`: read the latest revision or a specific revision.
- `getChangesets()`: read missing confirmed changesets.
- `submitChangeset()`: submit a client changeset.
- `createUnitFromData()`: create a Unit from Sheet, Doc, Slide, Board, or Base Unit data.
- `createUnit()`: create a Unit from a Protocol `ISnapshot`.
- `deleteUnits()`: soft-delete or permanently delete Units in a batch.
- `recoverUnits()`: recover soft-deleted Units in a batch.

For `createUnitFromData()`, `data.id` is the globally unique Unit ID and the initial revision must be `1`; the first confirmed changeset has revision `2`. A single delete or recover call accepts at most `MAX_UNIT_LIFECYCLE_BATCH_SIZE` Units, currently `100`, and the whole batch is all-or-nothing. After a hard delete, the Unit is permanently inaccessible and the same ID cannot be reused.

## Service middleware

Service middleware is the general lifecycle extension point for authorization, logging, external integrations, and similar concerns. The following example integrates Unit permissions.

The Service does not define roles or an ACL store. Applications protect Unit reads, creation, submissions, deletion, and recovery in the corresponding lifecycle middleware:

```ts
import { CollabError } from '@univerjs-pro/collaboration-service';

collabService.use('submitChangeset', async (ctx, next) => {
  const role = await acl.getRole(
    ctx.userID,
    ctx.request.changeset.unitID
  );
  ctx.customData.role = role;

  if (role !== 'owner' && role !== 'editor') {
    throw new CollabError('PERMISSION_DENIED', 'Unit is read-only');
  }
  await next();
});
```

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `readUnitData` | After Request creation, before reading the Adapter | `userID`, `customData`, and the concrete `request` | Once per Service API call | Read ACL, tenant, audit |
| `createUnit` | After preparing the initial snapshot, before atomic creation | `userID`, `customData`, `request.snapshot`, `request.sheetBlocks` | Once per create call | Creation permission, quotas, type restrictions |
| `deleteUnits` | After batch normalization, before calling the Adapter | `userID`, `customData`, `request.unitIDs`, `request.hardDelete` | Once per call; database races do not repeat it | Per-Unit delete ACL |
| `recoverUnits` | After batch normalization, before calling the Adapter | `userID`, `customData`, `request.unitIDs` | Once per call; database races do not repeat it | Per-Unit recovery ACL |
| `submitChangeset` | After creating the logical submission Request, before idempotency and OT | `userID`, `memberID`, `customData`, `request` | Once per logical submission; not repeated on database revision conflicts | Edit ACL, size limits, trace |
| `applyChangeset` | After OT aligns the changeset to the current revision, before applying it to the pending Unit state | `userID`, `memberID`, `customData`, `request`, `changeset`, `currentRevision`, `attempt` | Repeated after a database revision conflict | Validation of aligned mutations |
| `commitChangeset` | After applying the changeset to pending Unit state, before the Adapter checks the revision and writes | `userID`, `memberID`, `customData`, `request`, `changeset`, `expectedHeadRevision`, `attempt` | Repeated after a database revision conflict | Final revision checks and metrics |

`applyChangeset` and `commitChangeset` must be retry-safe. Non-reversible post-commit side effects belong in the corresponding event, or in a transactional outbox implemented by the concrete Database Adapter.

When Endpoint calls the Service, it passes the current HTTP `userID/customData` established by Transport middleware. Service middleware can therefore access the authenticated user, tenant, trace, and request-scoped ACL cache.

## Identity and customData

- `userID`: an application-provided identity string and the author of a confirmed changeset. The Service does not interpret its business meaning.
- `memberID`: the member ID of an online WebSocket Session; only submit and other calls associated with a realtime member provide it.
- `(unitID, sid, reqId)`: the client submission idempotency key.
- `context.customData`: data scoped to the current Service call, suitable for tracing, ACL caches, and timing.

Regular methods accept `CollabContext`; `submitChangeset()` accepts `CollabMemberContext`, which additionally contains `memberID`. Middleware in the same call can share trace data, ACL results, or timing data through `ctx.customData`. This data is not automatically persisted, logged, or sent to clients.

## Capability boundary and disposal

The Service does not provide HTTP, WebSocket, rooms, Presence, users, login, ACL storage, file management, or sharing. Transport, Endpoint, and the application provide these capabilities in the server assembly.

The application owns the injected Database Adapter. Dispose the Service before the Adapter during shutdown:

```ts
await collabService.dispose();
await database.dispose();
```

## Advanced integration: wrap an application API

Applications may call the Service API directly from their own HTTP/RPC endpoints and business workflows. The caller must construct `CollabContext` and own the identity, external protocol, and error-mapping boundaries.

For example, expose an application endpoint `POST /api/units` on an existing Express `app`, reusing the `collabService` created above:

```bash
pnpm add express
pnpm add -D @types/express
```

```ts
import { randomUUID } from 'node:crypto';
import { json } from 'express';
import { UniverType } from '@univerjs/protocol';

app.post('/api/units', json({ limit: '1mb' }), async (request, response, next) => {
  try {
    const user = response.locals.user as { readonly userId: string };
    const workbookData = request.body.data;
    const unitID = randomUUID();

    const result = await collabService.createUnitFromData(
      {
        type: UniverType.UNIVER_SHEET,
        data: { ...workbookData, id: unitID, rev: 1 },
      },
      {
        userID: user.userId,
        customData: { traceId: randomUUID() },
      }
    );

    response
      .status(result.status === 'created' ? 201 : 200)
      .json(result);
  } catch (error) {
    next(error);
  }
});
```

`POST /api/units` is an application API, not a protocol route used by Univer Collaboration Client. This example assumes Express authentication middleware has set `response.locals.user`. The application must also validate `request.body.data` and map `CollabError` to application API responses in error middleware. If the application needs a product record or owner ACL, create it explicitly in the same business workflow and handle compensation on failure.

## Advanced integration: submit changesets from background jobs

A background job can read the latest Unit revision and call `submitChangeset()` directly. The following example assumes `task` is the current task supplied by the job system, `task.id` remains stable across retries, and `task.mutations` already uses a mutation format supported by Univer:

```ts
const context = {
  userID: task.userID,
  memberID: `background:${task.id}`,
  customData: { taskID: task.id },
};

const current = await collabService.getUnit(
  {
    unitID: task.unitID,
    type: task.type,
    revision: 0,
  },
  context
);

const result = await collabService.submitChangeset(
  {
    changeset: {
      unitID: task.unitID,
      type: task.type,
      baseRev: current.headRevision,
      revision: current.headRevision + 1,
      sid: `background:${task.id}`,
      reqId: 1,
      userID: context.userID,
      memberID: context.memberID,
      mutations: task.mutations,
    },
  },
  context
);

if (result.status === 'rejected' || result.status === 'retry') {
  throw result.error;
}
```

`sid/reqId` is the submission idempotency key and must be reused when the task retries. `memberID` only identifies the source of the submission. Background jobs do not need to create a WebSocket Session, and the Service does not check whether that member is online.

`collabService` itself is network-agnostic and does not send WebSocket messages. When a `UniverCollabEndpoint` is created, the Endpoint listens to the same `collabService` instance's `changesetCommitted` event. After a background submission succeeds, the Endpoint broadcasts the confirmed changeset to online clients in the current process that have JOINed the Unit. Because the background job's `memberID` does not correspond to an online Session, no submitter is excluded and all of those clients receive the change in realtime.

This event subscription only works within the current process and Service instance. If the background job runs in another process or uses another `UniverCollabService` instance, the database commit remains correct, but the current Endpoint does not automatically receive a broadcast event. Clients can subsequently recover through missing changesets.
