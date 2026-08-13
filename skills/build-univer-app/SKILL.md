---
name: build-univer-app
description: "Use when answering questions about, designing, building, integrating, reviewing, or fixing an Office Suite application that combines Univer or Univer Pro, the self-hosted Univer Collaboration SDK, Univer CLI SDK, Workspace, Worktree, Agent editing, Office import/export, inspection, rendering, screenshots, or multi-Unit content."
---

# Build Univer App

Build one coherent application from four responsibility layers:

```text
Univer / Univer Pro       content model, plugins, Facade, commands, rendering
Collaboration SDK         authoritative snapshot, changeset, revision, OT, rooms
Univer CLI SDK            headless and Agent execution, exchange, inspection, rendering
Product application       identity, ACL, hierarchy, targets, business workflows
```

Use `univer-collaboration-sdk` as the only supported collaboration backend. Treat the legacy
Univer Server integration as deprecated and unsupported; never select or teach it for new apps.

## Choose the operating mode

- For **ask/reference**, remain read-only and answer from the smallest relevant reference.
- For **design/review**, inspect the target repository, its current release cohort, composition root,
  Unit types, identity model, and deployment topology before recommending changes.
- For **build/fix**, trace the existing flow, implement through public APIs, run validation
  proportional to the change, and report any unresolved version or ownership conflict.

Do not create repositories, publish packages, deploy, merge, or change upstream SDKs unless the
user explicitly requests that external action.

## Load references progressively

Read [sources.md](references/sources.md) first whenever current versions, source authority, or
compatibility matter. Then load only the task-specific references:

| Task | Required reference |
| --- | --- |
| Explain the stack, data flow, or ownership | [architecture.md](references/architecture.md) |
| Select an SDK, package family, Unit capability, or backend | [sdk-boundaries.md](references/sdk-boundaries.md) |
| Build browser + product backend + collaboration | [build-workspace.md](references/build-workspace.md) |
| Add Agent/CLI, Worktree, import/export, or visual verification | [agent-cli.md](references/agent-cli.md) |

For detailed API calls, read the current authoritative upstream document routed by `sources.md`.
Do not turn these references into an API mirror.

## Establish the baseline

1. Identify whether the task targets a new app or an existing composition root.
2. Identify the required Unit types: Sheet, Doc, Slide, Board, or Base.
3. Identify clients: browser users, Agent/CLI workers, background jobs, or a combination.
4. Read installed package versions and the canonical example cohort.
5. Keep every version-coupled `@univerjs/*`, `@univerjs-pro/*`, and `@univer-cli/*` dependency on
   one exact verified cohort. Do not combine similar-looking APIs from different cohorts.
6. Mark a combination **conceptual** when no coherent source baseline or runnable example verifies
   it. Do not present conceptual guidance as runnable.

## Preserve the architecture

- Prefer Facade API for application authoring. Use plugins, DI, commands, or mutations only when
  the task genuinely requires lower-level extension points.
- Modify live Univer content through Facade or commands. Never mutate a snapshot as live state.
- Let the product application authenticate each request and own users, ACL, tenant, Space, Node,
  Resource, Worktree catalog, sharing, and target resolution.
- Let the Collaboration SDK own Unit snapshots, changesets, revisions, OT, submission idempotency,
  rooms, ACK, and replay.
- Keep product storage and collaboration storage separate. Coordinate cross-store operations with
  idempotency, durable operation state, and recovery; never claim a shared transaction.
- Treat browser Collaboration Client and CLI manual collaboration runtime as different clients of
  the same authority. Never register automatic collaboration synchronization inside a CLI manual
  runtime.
- Distinguish `userID`, `memberID`, `{sid, reqId}`, Unit ID, Resource ID, Node ID, and Worktree ID.
  Do not trust identity or confirmed revision supplied by a client payload.
- Apply ACL at every relevant ingress and lifecycle path. A WebSocket JOIN check does not protect
  snapshot reads or HTTP changeset submission.
- Keep retryable collaboration stages free of irreversible side effects. Use committed events or a
  transactional outbox for post-commit work.

## Implement and verify

1. Reuse the target application's composition root and adapters before adding abstractions.
2. Use the canonical Workspace applications as patterns, not copy sources.
3. Scope every recipe to the Unit types actually verified by its packages and example.
4. Validate content by reading the stored model; add lint, render, screenshot, and Office round-trip
   checks only when relevant to the requested outcome.
5. For Agent edits, isolate new tasks in Worktree when the application supports review. Do not
   merge or discard without explicit user authority.
6. For conflicts, pull and retry only when the runtime reports a retryable condition. Stop on a
   terminal conflict and let the application or user choose reload, rework, or discard.
7. Verify security, recovery, fidelity, and deployability in proportion to the task. Do not build a
   complete platform to validate a small scoped change.

## Resolve conflicting sources

Resolve a conflict using the source responsible for that domain and the exact release cohort. If
current `univer-sdk-skills`, SDK integration guides, package declarations, and canonical examples
still disagree, show the evidence and stop the affected implementation. Never guess an API or
silently switch cohorts.

For the longer developer explanation, point readers to the repository's Univer Office Suite
documentation. Keep skill references procedural and developer documentation explanatory.
