# Cross-SDK architecture

## The four owners

| Layer | Owns | Does not own |
| --- | --- | --- |
| Univer/Core/Pro | Unit models, plugins and presets, Facade, commands, mutations, browser UI, rendering | Users, product hierarchy, authoritative collaboration persistence |
| Collaboration SDK | Snapshot, changeset, revision, OT, idempotency, HTTP/WebSocket protocol, rooms, Worktree collaboration | Login, ACL storage, tenancy, Space/Node/Resource catalog |
| CLI SDK | Headless Univer, explicit pull/execute/commit, pools and daemon, inspection, exchange, render and screenshot capabilities | Product targets, credentials, background sync policy, collaboration authority |
| Product application | Authentication, users, ACL, tenant, hierarchy, sharing, target resolution, business workflow | OT, confirmed revision, content-engine internals |

## Human and Agent clients share one authority

```text
Browser Univer/Pro + Collaboration Client
                  \
                   → Product auth/ACL → Collaboration Endpoint → Service → collab store
                  /
Agent target resolver → CLI manual runtime

Product API → product store (users, Spaces, Nodes, Resources, ACL, operations)
```

The browser client provides automatic realtime behavior and presence. The CLI runtime provides an
explicit state machine suitable for a bounded Agent task. Both load and submit the same Unit; they
must not create competing authorities.

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
