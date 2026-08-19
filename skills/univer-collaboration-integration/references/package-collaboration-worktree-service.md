<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univerjs-pro/collaboration-worktree-service

English | [简体中文](./package-collaboration-worktree-service.zh-CN.md)

A network-agnostic Univer Worktree Service that provides collaboratively editable drafts, freezing, merge evaluation, and per-Unit merge for one or more Units.

Worktree isolates draft changesets by `(worktreeID, unitID)`, reuses the trunk `UniverCollabService` OT, Unit-data handling, and submission engine, and does not change the existing changeset structure.

When using Worktree Client, `UniverCollabWorktreeEndpoint` calls Worktree Service. Calling the Service APIs below directly is an advanced integration.

## Installation and creation

```bash
pnpm add \
  @univerjs-pro/collaboration-service \
  @univerjs-pro/collaboration-worktree-service \
  @univerjs-pro/collaboration-worktree-endpoint \
  @univerjs-pro/collaboration-database-sqlite \
  @univerjs-pro/collaboration-worktree-database-sqlite
```

```ts
const trunkDatabase = new SQLiteDatabaseAdapter({ filename });
const worktreeDatabase = new SQLiteWorktreeDatabaseAdapter({ filename });

const collabService = new UniverCollabService({
  dbAdapter: trunkDatabase,
});
const worktreeService = new UniverCollabWorktreeService({
  trunk: {
    service: collabService,
    dbAdapter: trunkDatabase,
  },
  dbAdapter: worktreeDatabase,
});
```

The trunk and Worktree Adapters may use the same SQLite file, but remain two independent contracts and lifecycle objects. All collaboration packages must use matching versions from the same release cohort.

Next, create `UniverCollabWorktreeEndpoint` and register it on the same Transport as the trunk Endpoint.

## Worktree middleware

Worktree middleware is independent of trunk Service middleware:

| Action | When it runs | Visible fields | Retry semantics | Typical uses |
| --- | --- | --- | --- | --- |
| `readWorktreeData` | After Worktree Request creation, before reading the Adapter | `userID`, `customData`, `request` | Once per API call | Worktree visibility and management-read ACL |
| `createWorktree` | After Request creation, before creating Worktree | `userID`, `customData`, `request` | Once per call | Creation permission, quota, discoverability scope |
| `addWorktreeUnit` | After Request creation, before adding a trunk Unit | `userID`, `customData`, `request` | Once per call | Unit read/edit permission |
| `createWorktreeUnit` | After preparing the initial snapshot, before creating a draft Unit | `userID`, `customData`, `request` | Once per call | New-Unit type, quota, creation permission |
| `markWorktreeReady` | After Request creation, before Adapter freezes each Unit's current draft revision | `userID`, `customData`, `request` | Once per call | Ready permission and review rules |
| `reopenWorktree` | After Request creation, before Adapter returns to draft | `userID`, `customData`, `request` | Once per call | Reopen permission |
| `discardWorktree` | After Request creation, before Adapter discard | `userID`, `customData`, `request` | Once per call | Discard permission and audit |
| `mergeWorktree` | After Request creation, before starting or continuing per-Unit merge | `userID`, `memberID`, `customData`, `request` | Once per merge call; internal Unit submission retries do not repeat it | Formal merge permission |
| `readUnitData` | After Worktree Unit Request creation, before reading draft data | `userID`, `customData`, `request` | Once per API call | Draft Unit read ACL, merge-preview reads |
| `submitChangeset` | After draft submission Request creation, before idempotency and OT | `userID`, `memberID`, `customData`, `request` | Once per logical submission; database revision conflicts do not repeat it | Draft edit ACL, size limits |
| `applyChangeset` | After OT aligns changeset to current revision, before applying it to pending Unit state | `userID`, `memberID`, `customData`, `request`, `changeset`, `currentRevision`, `attempt` | Repeated after database revision conflict | Validation of aligned mutations |
| `commitChangeset` | After applying changeset to pending Unit state, before Adapter checks revision and writes | `userID`, `memberID`, `customData`, `request`, `changeset`, `expectedHeadRevision`, `attempt` | Repeated after database revision conflict | Final revision checks and metrics |

`applyChangeset` and `commitChangeset` must be retry-safe and cannot perform non-reversible side effects. A final merge into trunk still enters the trunk Service's own middleware.

## Advanced integration: call Worktree Service directly

Every call explicitly supplies the current user; no stateful Worktree handle needs to be opened or bound first:

```ts
const context = {
  userID: user.userId,
  customData: { tenantID, traceID },
};

await worktreeService.createWorktree(
  { worktreeID, units: [unitID] },
  context
);

await worktreeService.markReady({ worktreeID }, context);

const result = await worktreeService.mergeWorktree(
  { worktreeID },
  { ...context, memberID }
);
```

Regular lifecycle and read methods need only `userID`. `submitChangeset()` and `mergeWorktree()` also need `memberID` because they may be associated with an online collaboration submission. When using the frontend SDK through Worktree Endpoint, Endpoint supplies the online Session's `memberID`. Applications calling these methods directly supply one themselves; the Service only passes the string through.

`customData` belongs only to the current call. It can hold tenant, trace, or ACL query caches and is not automatically persisted into Worktree or changesets.

## Common APIs

- `createWorktree()` / `getWorktree()`: create and read a Worktree.
- `addUnit()`: add an existing trunk Unit to a Worktree.
- `createUnitFromData()`: create a Unit in Worktree that does not yet exist in trunk.
- `getUnit()` / `getChangesets()`: read draft collaboration data.
- `submitChangeset()`: submit a draft changeset.
- `markReady()` / `reopenWorktree()` / `discardWorktree()`: advance or terminate the lifecycle.
- `evaluateWorktreeUnitMerge()`: generate a merge evaluation or preview for one Unit.
- `mergeWorktree()`: merge Worktree Units into trunk one by one.

## Lifecycle

```text
create → draft → ready → merging → merged
           ↑       │
           └ reopen┘

draft/ready → discarded
```

- Only `draft` accepts further changesets.
- `markReady()` freezes each Unit's current draft revision.
- `reopenWorktree()` permits `ready → draft`.
- `mergeWorktree()` merges one Unit at a time into trunk.
- Multi-Unit merge is not atomic across Units; display each Unit's `mergeResult`.

A Worktree can reference an existing trunk Unit or create a Worktree-only Unit through `createUnitFromData()`. After merge, a new Unit is created in trunk at revision `1`; draft changeset history is not copied.

## Permission boundary

Worktree middleware and trunk Service middleware are independent. Protect the Worktree and final trunk writes separately: check visibility in `readWorktreeData`, draft edit rights in `submitChangeset`, and formal merge rights in `mergeWorktree`. Merging into trunk still executes trunk Service authorization middleware.

A merge preview reuses read permission and does not grant formal merge permission. Worktree discoverability scope also cannot replace current Unit ACL checks.

## Merge evaluation

`evaluateWorktreeUnitMerge()` is used only in `ready` and may return:

- `preview`: trunk advanced and a static merged-result snapshot was generated.
- `conflict`: Worktree changes cannot be automatically merged into current trunk through OT.
- `not-behind`: trunk has not advanced past the revision recorded when Worktree was created.
- `already-merged`: this Unit completed in a previous partial merge.
- `not-applicable`: a Worktree-created Unit has no initial trunk revision.

Evaluation does not submit a changeset or change Worktree state. Formal merge always uses trunk state at execution time.

## Limitations and disposal

Worktree deletion, rollback/reset, History, cleanup of referenced trunk history, and periodic draft snapshots are not currently provided. Shutdown order is Worktree Service → trunk Service → both Adapters:

```ts
await worktreeService.dispose();
await collabService.dispose();
await worktreeDatabase.dispose();
await trunkDatabase.dispose();
```
