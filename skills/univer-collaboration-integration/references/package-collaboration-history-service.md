<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-service

English | [简体中文](./package-collaboration-history-service.zh-CN.md)

An optional Univer version-history Service. It groups confirmed collaboration revisions into user-facing history entries, enriches creator profiles, and provides the service contract used by History Endpoint.

History is a derived index. Confirmed changesets stored by the collaboration Service remain the authoritative source of Unit state.

```text
Transport
→ UniverHistoryEndpoint
→ UniverHistoryService
→ History Database Adapter
```

## Installation and creation

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-history-service \
  @univerjs-pro/collaboration-history-endpoint \
  @univerjs-pro/collaboration-history-database-sqlite
```

```ts
import { SQLiteHistoryDatabaseAdapter } from '@univerjs-pro/collaboration-history-database-sqlite';
import {
  DefaultHistoryPolicy,
  UniverHistoryService,
} from '@univerjs-pro/collaboration-history-service';

const historyDatabase = new SQLiteHistoryDatabaseAdapter({
  filename: './data/collaboration.sqlite',
});
const historyService = new UniverHistoryService({
  collabService,
  dbAdapter: historyDatabase,
  policy: new DefaultHistoryPolicy({ timeIntervalMs: 60_000 }),
  userProvider: {
    async getUsers(userIDs) {
      return applicationUsers.findMany(userIDs);
    },
  },
});

const attachment = historyService.attach(collabService);
```

`attach()` listens for Unit creation and confirmed changesets. The default policy segments history at roughly 60-second intervals and around special mutations such as restore, rather than creating one entry per changeset. If `dbAdapter` is omitted, the Service owns an in-memory Adapter suitable only for tests and temporary environments.

## History middleware

History does not inherit middleware from the main Collaboration Service. Five actions independently protect reads and indexing:

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `getHistoryList` | After Request creation, before reading History Adapter | `userID`, `customData`, `request` | Once per API call | Unit read ACL, pagination audit |
| `listHistoryCreators` | After Request creation, before reading creator index | `userID`, `customData`, `request` | Once per API call | Unit read ACL |
| `getHistoryChangesets` | After Request creation, before reading index and core changesets | `userID`, `customData`, `request` | Once per API call | Unit read ACL, revision-range limits |
| `indexUnitCreated` | After index Request creation, before writing revision-1 index data | `userID`, `customData`, `request` | Once per logical index; not repeated on collaboration database revision conflicts | Index scope, tenant, audit |
| `indexChangeset` | After changeset index Request creation, before writing index data | `userID`, `customData`, `request` | Once per logical index; not repeated on collaboration database revision conflicts | Index filtering, tenant, audit |

```ts
historyService.use('getHistoryList', async (ctx, next) => {
  if (!await acl.canRead(ctx.userID, ctx.request.unitID)) {
    throw new CollabError('PERMISSION_DENIED', 'History is not accessible');
  }
  await next();
});
```

User Provider only enriches display users and is not an authorization boundary.

When an application reads History Service directly, SDK result fields use `userID/userIDs/unitID`. `UniverHistoryEndpoint` maps them at the HTTP protocol boundary to the `userId/userIds/unitId` fields required by the frontend protocol. No manual conversion is needed when using History Client.

## Reliability and disposal

The convenient `attach()` updates the index in-process but does not guarantee that every update completes. Failure does not affect already committed collaboration data. For strictly lossless indexing, write a transactional outbox in the collaboration commit transaction and have a retryable background worker call `indexUnitCreated()` or `indexChangeset()`.

```ts
attachment.dispose();
await historyService.dispose();
await collabService.dispose();
await historyDatabase.dispose();
```

History Service does not dispose a Database Adapter injected by the application.
