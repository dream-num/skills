<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-history-endpoint

English | [简体中文](./package-collaboration-history-endpoint.zh-CN.md)

A Node Transport Endpoint for the Univer History HTTP protocol. The frontend History UI uses it to read history entries, creators, and changesets.

```text
History HTTP request
→ Transport authentication middleware
→ UniverHistoryEndpoint
→ History Service middleware
→ History Database Adapter / Collaboration Service
```

## Installation and registration

```bash
pnpm add \
  @univerjs-pro/collaboration-history-service \
  @univerjs-pro/collaboration-history-endpoint \
  @univerjs-pro/collaboration-endpoint \
  @univerjs-pro/collaboration-transport-node
```

```ts
import { UniverCollabEndpoint } from '@univerjs-pro/collaboration-endpoint';
import { UniverHistoryEndpoint } from '@univerjs-pro/collaboration-history-endpoint';

const historyEndpoint = new UniverHistoryEndpoint(historyService);
const collabEndpoint = new UniverCollabEndpoint(collabService);

transport.use(authenticationMiddleware);
transport.register(historyEndpoint);
transport.register(collabEndpoint);
```

Register authentication first, followed by History Endpoint and the main Collaboration Endpoint. History Endpoint uses the application-provided Transport `userID` and calls History Service APIs for protocol requests. It does not own authentication, ACLs, History storage, or segmentation policy.

## HTTP routes

| Method | Path | Service action | Purpose |
| --- | --- | --- | --- |
| `GET` | `/universer-api/history/:unitID/list` | `getHistoryList` | Read history entries |
| `GET` | `/universer-api/history/:unitID/creators` | `listHistoryCreators` | Read history creators |
| `GET` | `/universer-api/history/:unitID/cs` | `getHistoryChangesets` | Read changesets for history revisions |

All three routes call History Service with `ctx.userID/customData` set by Transport middleware for the current HTTP request and enter the corresponding History Service middleware. History Endpoint does not create or read a WebSocket Session.

Install authorization middleware for every History Service action. Transport owns and disposes Endpoint; disposing Endpoint does not dispose History Service or its Database Adapter.
