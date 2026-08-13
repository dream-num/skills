# Cross-SDK architecture

## C4 context

```text
[Office Suite user] ───────────────→ [Developer-owned Office Suite application]
                                             │
[Agent user + local Univer CLI SDK] ─────────┘
                                             │
                 ┌───────────────────────────┼──────────────────────────┐
                 ▼                           ▼                          ▼
      [Univer/Core/Pro SDK]      [Collaboration SDK]      [Third-party systems]
      content and rendering      collaboration authority  ├ identity/user
                                                         ├ authorization/policy
                                                         ├ object storage
                                                         └ operations
```

The developer-owned application is the product boundary. It owns authentication, ACL, tenancy,
Space/Node/Resource hierarchy, sharing, target resolution, and durable workflows. Univer/Core/Pro
owns content behavior; the Collaboration SDK owns authoritative collaboration state. The Agent user
runs the CLI SDK locally. Third-party systems connect only through developer-owned adapters.

## C4 containers

```text
[Office Suite user]
        │
        ▼
[Browser Office application]
 Developer UI + Univer/Core/Pro + Browser Collaboration Client
        │
        ├───────────────────────┐
        ▼                       ▼
[Application backend] ← [Agent user running local Univer CLI SDK + headless Univer/Core/Pro]
 Developer product APIs
 + Univer Collaboration SDK
        │
        ├──→ [Product database]       users, ACL, hierarchy, metadata, operations
        ├──→ [Collaboration database] snapshots, changesets, revisions, idempotency
        └──→ [Application integrations]
```

The browser client owns automatic realtime synchronization. The local CLI runtime owns bounded
`fetch → pull → execute → commit`. Both use the same application backend and Collaboration SDK
authority; neither owns product identity or storage policy.

## Content change path

Use Facade or commands to change live content. Facade calls eventually execute commands; mutations
are the smallest collaboration conflict unit. A snapshot is persisted data, not a live mutable
model.

```text
user or Agent intent
→ Facade / command
→ mutation capture
→ changeset with base revision and idempotency identity
→ OT + revision CAS
→ committed changeset
→ ACK/realtime delivery or later HTTP replay
```

Database commit and WebSocket delivery are different guarantees. A reconnecting client recovers
confirmed changesets from the authoritative revision stream.

## Identity map

| Identity | Owner | Rule |
| --- | --- | --- |
| `userID` | Product authentication | Stable actor and confirmed changeset author |
| `memberID` | Collaboration Endpoint | Online Session identity; changes on reconnect |
| `{sid, reqId}` | Collaboration client/runtime | Submission idempotency; preserve on retry |
| Unit ID | Collaboration scope | Globally unique within a Service/database |
| Resource ID | Product content record | Maps product metadata to a Unit |
| Node ID | Product hierarchy | Locates a Resource in a Space/tree |
| Worktree ID | Product + Worktree service | Identifies an isolated draft and review lifecycle |

Never accept client payload identity or confirmed revision as authoritative. Resolve product targets
and ACL server-side before entering collaboration APIs.

## Storage and cross-store workflow

Keep the product store and collaboration store separate. Product creation commonly needs to create
a Resource/Node/ACL and a collaboration Unit. Record a durable operation with an idempotency key,
advance it through explicit steps, and recover incomplete work. Do the same for delete, restore, and
Worktree lifecycle actions that span owners. Do not claim one database transaction covers both.

## Runtime boundaries

- Transport owns network ingress and registered Endpoint disposal.
- Endpoint owns protocol, Session, room, presence, ACK, and broadcast; it does not dispose Service.
- Service owns collaboration lifecycle and internal runtimes; it does not dispose an injected
  Database Adapter.
- Database Adapter owns atomic persistence, revision CAS, and submission deduplication; it does not
  perform OT, authentication, or broadcasting.

Current realtime room delivery is a single-Endpoint-process guarantee. Database CAS can preserve
authoritative correctness across Service instances, but a multi-Endpoint deployment needs an
explicit realtime distribution design before it can promise cross-process presence and broadcast.
