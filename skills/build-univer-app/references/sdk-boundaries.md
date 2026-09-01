# SDK boundaries and getchas

## Responsibility map

| System | Owns | Does not own |
| --- | --- | --- |
| Univer Engine / Runtime SDK | Unit models, plugins, Facade, commands, mutations, browser and Node runtimes | Product identity, authoritative collaboration persistence |
| Univer CLI SDK | Agent-facing execution, inspection, Office exchange, rendering, screenshots, lint, runtime and process helpers | Product targets, credentials, business workflow |
| Univer Collaboration SDK | Server-side snapshot, changeset, revision, OT, idempotency, HTTP/WebSocket protocol, rooms | Product users, hierarchy, sharing, review UX |
| Product application | Identity, ACL, tenancy, hierarchy, targets, blobs, workflows, deployment policy | SDK content or collaboration internals |

Use `univer-integrate`, `univer-pro-integrate`, `univer-plugin-dev`, and `univer-node-backend` for
Engine / Runtime details. Use `univer-cli-sdk-integration` for Agent-facing CLI SDK capabilities and
`univer-collaboration-integration` for the server-side collaboration backend.

The supported collaboration chain is:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History, Thread Comment, and Worktree are optional collaboration domains with their own service,
middleware, storage, and lifecycle. The product still owns their user-facing catalog and policy.

## Cross-system getchas

- Keep one synchronization owner per runtime. Never register the automatic browser Collaboration
  Client in a headless instance managed by the manual CLI collaboration runtime.
- Treat caller-provided Unit or Worktree IDs as target hints, not authority. The product resolves an
  authenticated target to Unit ID, Unit type, and optional Worktree scope before SDK access.
- WebSocket JOIN authorization does not protect snapshot reads or changeset submission. Enforce
  Transport authentication, Endpoint JOIN policy, and Service read/submit policy separately.
- Treat the collaboration database and confirmed revision stream as authoritative. A commit can
  succeed when realtime delivery fails; reconnecting clients recover through replay.
- Preserve submission identity across retry. Retry only runtime-reported retryable outcomes. On a
  terminal conflict, stop writing and let the product or user choose reload, rework, or discard.
- Retryable apply and commit stages may run more than once. Emit irreversible effects after commit;
  use an outbox when external delivery must be reliable.
- Worktree ready or merge preview is not merge authorization. Multi-Unit merge is not atomic; expose
  each Unit result.
- CLI SDK packages are capabilities, not a product framework. Keep authentication, target
  resolution, storage, and command composition in the host application.
- Capability coverage is Unit-specific. Do not generalize verified Sheet, Doc, Slide, Board, or Base
  behavior to another Unit.
- Reuse shared infrastructure without collapsing ownership. Product and collaboration data remain
  separate domains even when they share a process or physical database.
- Keep original imports, media, previews, and exports in product-owned blob storage; keep Unit
  snapshots and confirmed changesets in collaboration storage.
- Room, presence, ACK, and broadcast guarantees are scoped to one Endpoint process unless the
  application adds explicit realtime distribution.
