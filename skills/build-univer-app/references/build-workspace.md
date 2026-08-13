# Build a self-hosted Workspace

Use this workflow for a browser application backed by product APIs and the Collaboration SDK.
Start from the target repository's existing composition root. Use the canonical `univer-workspace`
application to verify cross-layer patterns.

## Contents

1. [Define product identities and ownership](#1-define-product-identities-and-ownership)
2. [Assemble the collaboration gateway](#2-assemble-the-collaboration-gateway)
3. [Authenticate and authorize every path](#3-authenticate-and-authorize-every-path)
4. [Create a Unit through a durable product operation](#4-create-a-unit-through-a-durable-product-operation)
5. [Assemble the browser content runtime](#5-assemble-the-browser-content-runtime)
6. [Add optional domains without reversing ownership](#6-add-optional-domains-without-reversing-ownership)
7. [Validate the Workspace](#7-validate-the-workspace)

## 1. Define product identities and ownership

Establish stable application user IDs before wiring collaboration. Define Space, Node, Resource,
Unit, and optional Worktree relationships. Store users, hierarchy, metadata, ACL, sharing, trash,
and durable business operations in the product store. Store snapshots, changesets, revisions, and
submission idempotency in the collaboration store.

Use one access resolver from both product routes and collaboration middleware. Do not make those
two ingress paths call each other over HTTP simply to share policy.

## 2. Assemble the collaboration gateway

Build the supported chain in order:

```text
raw Node HTTP and upgrade
→ Node Transport
→ Collaboration Endpoint
→ Collaboration Service
→ persistent Database Adapter
```

Use Memory only for tests and temporary local work. Use SQLite for a single-node persistent app or
implement a Database Adapter that passes the shared contract tests for another database.

Route every collaboration HTTP request and WebSocket upgrade through Transport. Register Endpoint
with Transport. Dispose from the network edge inward while respecting injected ownership.

## 3. Authenticate and authorize every path

- Authenticate ordinary HTTP requests in Transport middleware and set the trusted `userID`.
- Issue the opaque one-time Session ticket only after authentication.
- Authorize WebSocket JOIN in Endpoint middleware using the Session's trusted user.
- Authorize snapshot and changeset reads in Service read middleware.
- Authorize content changes in Service submit middleware.
- Protect create, delete, restore, History, Comment, and Worktree actions separately when enabled.

JOIN permission alone is insufficient because snapshot and missing-changes requests use HTTP.
Client-side read-only UI is presentation, not server authorization.

Keep retryable `applyChangeset` and `commitChangeset` stages free of irreversible external effects.
Use committed events for in-process post-commit behavior and a transactional outbox for reliable
external delivery.

## 4. Create a Unit through a durable product operation

A product “new document” operation usually performs these owned steps:

1. Reserve an idempotency key and durable operation record.
2. Create product Resource, Node, metadata, and ACL state.
3. Create the collaboration Unit from valid UnitData with a globally unique Unit ID and initial
   revision required by the current contract.
4. Mark the operation complete and return the product target.
5. Recover or compensate an incomplete operation after a crash.

Do not wrap product and collaboration calls in a fictional shared transaction. Apply the same
operation pattern to lifecycle changes that cross the two stores.

## 5. Assemble the browser content runtime

Choose the preset or explicit plugins for the target Unit types. Keep every Univer and Pro package
on the same exact release. Avoid duplicate registration between presets and plugins.

Register the Pro Collaboration plugin family during Univer construction, point it at the supported
snapshot, submit, WebSocket, and Session-ticket routes, then call the loader matching the Unit type.
The Unit type stored by the Service must match the browser loader.

Use Facade for application operations and public plugin extension points for product-specific
behavior. Never mutate the loaded snapshot as a way to change the live document.

## 6. Add optional domains without reversing ownership

- Add History as a derived index over confirmed revisions.
- Add Thread Comment with its own Service, Endpoint, and Adapter; keep comment bodies in the comment
  store and document content in collaboration storage.
- Add Worktree as an isolated collaboration scope. Keep product catalog, task assignment, and review
  UX in the product application.

Each optional domain needs its own authorization middleware even when it reuses Transport,
authentication, and a physical SQLite database file.

## 7. Validate the Workspace

Run the target repository's checks, then validate observable behavior:

- Two authenticated browser identities can load the same Unit, join, edit, ACK, and observe each
  other's confirmed change.
- A viewer cannot submit, and an unauthorized user cannot read snapshot or missing changes.
- Restart preserves authoritative state.
- Duplicate submission preserves idempotency.
- Product Resource/Node/ACL and collaboration Unit remain recoverable across injected failures.
- Each enabled Unit type loads with its matching content plugins and loader.
- Shutdown releases Transport, Service, and owned adapters without double-disposal.

For production, also verify backup, reverse-proxy upgrade handling, request-size and timeout limits,
observability, and the single-Endpoint realtime topology constraint.
