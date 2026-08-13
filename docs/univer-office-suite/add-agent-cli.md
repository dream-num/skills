# Add Agent and CLI Editing

This chapter follows the canonical `univer-workspace-cli` application. It adds a bounded Agent
client to the Workspace built in [Build a Workspace](./build-workspace.md) without creating a second
content authority.

[简体中文](./add-agent-cli.zh-CN.md)

## Why the CLI path is different

A browser Collaboration Client owns continuous background synchronization, presence, and user
interaction. An Agent task needs an explicit beginning, bounded mutations, observable evidence, and
a review handoff. The CLI SDK provides that manual client and the supporting Node capabilities.

Both paths still use the same Collaboration Endpoint, Service, Unit, revision stream, identity
policy, and ACL.

## 1. Resolve a product target

Do not make the runtime understand Space, Node, Resource, or user-facing URLs. The product adapter
resolves a target into the runtime facts it needs:

- authenticated origin and request transport;
- Unit ID and Unit type;
- current or expected revision;
- scope: trunk or a specific Worktree;
- Worktree ID when scoped;
- an application-owned opaque runtime-pool key.

Resolve and authorize the product Resource and Worktree before exposing collaboration routes. The
CLI caller can provide a target hint, but it cannot establish access by naming an ID.

The canonical CLI reuses the Workspace Session cookie and obtains a collaboration Session ticket
through the same authenticated gateway. Caller-role headers may improve logging or policy, but do
not replace identity.

## 2. Assemble a headless runtime

Use the standard headless Univer factory to load the Core/Pro content capabilities for the target
Unit. Use the Collaboration Server adapter to map the manual runtime to the Workspace's supported
snapshot, changeset, Session-ticket, and WebSocket routes. Worktree scope selects the equivalent
scoped routes.

Use a worker/runtime pool when repeated commands would otherwise rebuild an expensive Univer
instance. The application owns pool key construction, process policy, authentication transport,
and shutdown; the pool owns exclusive leasing and configured reuse.

Do not register the automatic browser Collaboration Client in the headless runtime. The manual
runtime already owns fetch, pull, mutation capture, OT, revision, pending/awaiting state, and commit.

## 3. Execute a bounded change

Use this state flow rather than implementing revision logic in commands:

```text
acquire runtime
→ load checkpoint/revision
→ pull confirmed remote changes
→ execute Facade code against explicit Unit
→ inspect pending mutations
→ commit
→ pull/retry only when runtime says retryable
→ release runtime
```

Facade code must bind to the intended Unit. One coherent Agent mutation/commit should represent one
reviewable revision when practical. Always release the lease after success or failure.

On a pull-required result, use the runtime's pull and OT behavior before recommitting. On terminal
conflict, stop; product policy or the user chooses reload, rework, export, or discard. Blind retries
can overwrite intent even when they eventually pass.

## 4. Make Worktree the review boundary

When the application supports review and an Agent task should be isolated:

1. Create a fresh Worktree and attach the intended Unit or Units.
2. Resolve the Worktree-scoped target and acquire its runtime.
3. Pull current content and execute the requested change.
4. Inspect and visually verify the stored result.
5. Mark the Worktree ready.
6. Return a browser review URL and evidence.
7. Reopen the same Worktree only for corrections to the same task.
8. Merge or discard only after explicit user authorization.

The Worktree SDK owns isolated collaboration and merge mechanics. The product owns task assignment,
review metadata, policy, and UI. An Agent finishing edits does not imply permission to merge.

## 5. Select CLI capabilities by intent

| Intent | Capability | Evidence |
| --- | --- | --- |
| Discover a Facade API | offline API reference | Exact symbol/member/type for the installed cohort |
| Apply content changes | content execution + collaboration runtime | Committed revision and model readback |
| Read content structure | content inspection | Structured Sheet, Doc, or Slide result |
| Convert an Office file | unit exchange | Valid UnitData or exported Office file |
| Render content | render runtime | Materialized browser render |
| Capture review evidence | unit screenshot | Structured PNG outputs |
| Check layout | unit layout lint | Current verified Slide findings only |
| Reuse runtimes | runtime/worker pool | Exclusive lease and clean release |
| Serve commands | daemon and command presets | Stable application command result |

The command presets are presentation adapters. Product authentication, target resolution, error
policy, and review semantics stay in the Workspace CLI application.

## 6. Build the Office content pipeline

Not every task needs every stage. Select the shortest pipeline that proves the requested outcome:

```text
Office input
→ exchange to UnitData
→ create/load collaborative Unit
→ Agent Facade mutation
→ structural inspection
→ render and screenshot
→ Unit-specific lint
→ optional Office export and round-trip validation
```

### Import

For an offline conversion, exchange directly to UnitData and keep it local. For a collaborative
document, pass valid UnitData into the product's durable Resource/Unit creation operation. Do not
bypass product ACL, identifier mapping, or recovery simply because an import produced a snapshot.

### Modify

Load the authoritative checkpoint through the collaboration runtime and change live content with
Facade. Do not modify imported or fetched snapshot objects as a shortcut.

### Inspect

Read the stored model after execution and commit. A successful command only proves that no error was
reported; it does not prove that the intended ranges, paragraphs, shapes, fields, or records exist.

Current content inspection evidence covers Sheet, Doc, and Slide. Use Unit-specific Facade or
canonical model reads for Base and Board until their inspection package surface is documented.

### Render, lint, and screenshot

Render materialized UnitData when visual layout matters. Capture screenshots at the Unit-specific
surface required by the review. Current layout lint rules are Slide-only; do not claim that they
validate Sheet, Doc, Base, or Board.

### Export and round trip

Export when the requested deliverable is an Office file. Open or re-import the result when format
fidelity is part of acceptance. Structural readback, screenshot review, and round trip test different
risks; use the relevant combination rather than treating any one as universal proof.

## 7. Concurrency, safety, and authority

- Preserve the runtime's submission idempotency identity across retry.
- Pull confirmed remote changes before writing and whenever the runtime requires it.
- Keep one exclusive lease per stateful target key.
- Apply Workspace ACL to target resolution, snapshot read, Worktree access, and submit.
- Do not send irreversible side effects from retryable collaboration stages.
- Do not merge, discard, trash, publish, or deploy without explicit user authority.
- Keep credentials out of skill references, generated code, logs, and screenshots.

## 8. End-to-end acceptance

Prove the behavior at the installed skill and application seam:

1. Resolve an authorized Resource to the correct Unit and Worktree target.
2. Load and inspect the same confirmed content visible in the browser.
3. Commit one Agent change and observe it through a browser client.
4. Introduce a concurrent browser change and verify documented retry or terminal conflict behavior.
5. Read back the committed model and capture relevant visual or Office evidence.
6. Mark the Worktree ready and return a review URL without merging.
7. Verify unauthorized targets and Worktrees are rejected before content access.
8. Verify runtime leases and worker resources are released on both success and failure.
