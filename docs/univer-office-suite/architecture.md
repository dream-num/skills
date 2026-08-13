# Architecture

This chapter explains the stable seams of a Univer Office Suite application. Package-level APIs
change more often than these ownership rules, so establish the model before selecting calls.

[简体中文](./architecture.zh-CN.md)

## Four responsibility layers

| Layer | Primary responsibility | Examples |
| --- | --- | --- |
| Univer/Core/Pro | Run and extend Office content | Unit models, plugins, presets, Facade, commands, mutations, UI, render |
| Collaboration SDK | Maintain authoritative collaborative state | snapshot, changeset, revision, OT, idempotency, protocol, room, Worktree |
| CLI SDK | Execute bounded Node and Agent content work | headless factory, manual runtime, pools, inspection, exchange, render, screenshot |
| Product application | Turn content into a product | user, auth, ACL, tenant, Space, Node, Resource, sharing, target, durable operation |

The dependency direction follows ownership. Product code composes SDKs. The Collaboration Service
does not import product, Endpoint, Transport, or a concrete Database Adapter. CLI capabilities use
public content and collaboration contracts without becoming a product data model.

## Two clients, one content authority

Human editing and Agent editing are not separate document systems:

```text
Browser
  Univer/Core/Pro UI
  automatic Collaboration Client
             │
             ├── authenticated snapshot / changeset HTTP
             └── ticketed WebSocket Session
                                  │
                                  ▼
                    Collaboration Endpoint
                            │
                    Collaboration Service
                            │
              snapshot + changeset + revision store
                            ▲
                                  │
Agent
  product target resolver
  CLI manual collaboration runtime
  headless Univer/Core/Pro
```

The browser client optimizes continuous user interaction, realtime presence, ACK, and replay. The
CLI runtime optimizes a bounded task with explicit fetch, pull, execute, and commit. Registering the
automatic browser collaboration state machine inside the headless manual runtime would give one
process two competing synchronization owners and is therefore forbidden.

## Content state and commands

Univer is plugin-based and can run in browser, Electron, Node, worker, or tests with different
plugin assemblies. Prefer Facade API for application behavior. Use plugins, dependency injection,
and command APIs for extensions that Facade does not cover.

A snapshot is a persistence representation. It does not update as the live model changes, and
editing it does not update the application. All live changes go through Facade or commands. The
command system produces mutations; mutations are the smallest unit transformed by collaboration.

```text
intent → Facade/command → mutations → changeset → OT/CAS → confirmed revision
```

## Collaboration service chain

The self-hosted server is one assembly, not four alternatives:

```text
Node Transport
└── Collaboration Endpoint
    └── Collaboration Service
        └── Database Adapter
```

- **Transport** handles raw HTTP/WebSocket ingress and general request middleware.
- **Endpoint** implements the client protocol and owns Session, room, presence, ACK, and broadcast.
- **Service** owns network-independent OT, revision, Unit lifecycle, and collaboration middleware.
- **Database Adapter** atomically persists snapshots, changesets, revision CAS, and idempotency.

The legacy Univer Server integration is deprecated and unsupported. It is not a second supported
deployment option and must not be selected for a new application.

## Control plane and content plane

Product APIs form the control plane: identity, Space/Node hierarchy, Resource metadata, ACL,
sharing, trash, recent items, Worktree catalog, task state, and durable operations. Collaboration
routes form the content plane: Unit snapshot, block data, confirmed changesets, submit, Session,
room, presence, and Worktree-scoped content.

Both planes reuse in-process identity and access-policy modules, but neither should call the other
over HTTP merely to ask the same process for authorization. This keeps policy consistent without
mixing protocol ownership.

## Identity vocabulary

| Term | Meaning |
| --- | --- |
| application user ID / `userID` | Stable authenticated business identity and confirmed author |
| `memberID` | One online Endpoint Session; changes after reconnect |
| `sid` + `reqId` | Changeset submission idempotency identity; preserved across retries |
| Unit ID | Global content identity in a Collaboration Service/database |
| Resource ID | Product metadata identity that refers to a Unit |
| Node ID | Product hierarchy entry in a Space |
| Worktree ID | Isolated draft and review scope |

Client payloads cannot establish trusted user identity, membership ownership, or confirmed
revision. Resolve those facts from authenticated server state.

## Authentication and ACL paths

Ordinary collaboration HTTP requests authenticate in Transport middleware. A Session-ticket
request captures that trusted context into an opaque one-time ticket; WebSocket open consumes it to
create an Endpoint Session. The ticket does not expose identity in the token itself.

Authorization belongs on every relevant path:

- Endpoint JOIN protects entry to a realtime room.
- Service read middleware protects snapshot and missing-changes HTTP reads.
- Service submit middleware protects authoritative content changes.
- Create, delete, restore, History, Comment, and Worktree each require their own policy coverage.

A JOIN check alone does not protect HTTP reads. Client-side read-only UI does not replace server
authorization.

## Persistence and delivery guarantees

The collaboration database is authoritative. WebSocket is a low-latency delivery channel. A commit
can succeed even if a realtime send fails; clients recover by fetching confirmed changesets after
their known revision.

Product data and collaboration data have separate owners, even when development uses one physical
SQLite file. A workflow that creates a Resource, ACL, Node, and Unit must use an idempotency key,
durable operation state, explicit steps, and recovery. It must not claim a cross-owner transaction.

Retryable apply/commit stages may run more than once after revision competition. Do not emit
irreversible side effects there. Use committed events for in-process effects and a transactional
outbox for reliable external delivery.

## Process topology and lifecycle

Database CAS can preserve authoritative correctness across multiple Service instances. Current
room, presence, ACK, and broadcast guarantees are scoped to one Endpoint process; do not scale
Endpoint horizontally without an explicit realtime distribution design.

Dispose from the network edge inward. Transport disposes registered Endpoints; Endpoint does not
dispose Service; Service does not dispose an externally injected Database Adapter. The application
owns injected credentials, loggers, metrics, adapters, and other external resources unless the
creating component documents otherwise.
