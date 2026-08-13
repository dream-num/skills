# Build a Self-Hosted Workspace

This chapter follows the canonical `univer-workspace` application: a product control plane and a
Collaboration SDK content plane serving Sheet, Doc, Slide, Board, and Base.

[简体中文](./build-workspace.zh-CN.md)

## Before writing integration code

Choose one exact SDK cohort and describe the product model:

- What is the stable application user ID?
- How do Space, Node, Resource, Unit, and Worktree relate?
- Which roles can read, edit, manage ACL, create drafts, and merge?
- Which Unit types are enabled and which product plugins do they require?
- Which deployment owns the product database, collaboration database, blobs, jobs, and backups?

Do not begin with endpoint URLs. Those decisions only make sense after ownership and identity are
settled.

## 1. Create the product control plane

A Workspace usually needs these product-owned concepts:

- **User** — stable identity used by login, ACL, and confirmed changeset author.
- **Space** — a personal or team scope.
- **Node** — a hierarchy entry supporting folders, resources, trash, move, and display ordering.
- **Resource** — metadata for one Office object and the mapping to its Unit ID and Unit type.
- **ACL** — owner/editor/viewer or a richer product policy.
- **Blob** — original imports, assets, previews, or exports that do not belong in collaboration
  changesets.
- **Operation** — persistent progress for workflows spanning product and collaboration stores.
- **Worktree catalog** — product-facing task and review metadata around SDK Worktree state.

Keep that schema independent of snapshot, changeset, and revision tables. It may refer to Unit and
Worktree IDs, but it does not become collaboration storage.

## 2. Assemble the collaboration content plane

Construct a persistent Database Adapter, Collaboration Service, Endpoint, and Node Transport. Send
raw Node HTTP requests and WebSocket upgrades to Transport. If a web framework has already parsed
the body or rewritten the URL, restore/preserve the raw collaboration request before forwarding it.

Use Memory only for tests or temporary data. SQLite is appropriate for a persistent single-node
deployment; a different shared database requires an Adapter that satisfies the Collaboration SDK
contract tests.

The product and collaboration ingress paths may live in one Node process and one container. Their
protocols and ownership remain separate even when their implementation shares identity, ACL,
logging, or database infrastructure.

## 3. Share identity and policy, not protocol callbacks

Authenticate product API requests and Collaboration Transport requests through the same product
identity module. Pass the stable business user ID into trusted collaboration context.

Use one access resolver from both product handlers and SDK middleware:

| Path | Minimum policy check |
| --- | --- |
| Product browse/open | Resource and Node visibility |
| Snapshot / missing changes HTTP | Unit read access in Service middleware |
| WebSocket Session ticket | Authenticated user |
| WebSocket JOIN | Unit read access in Endpoint middleware |
| Changeset submit | Unit edit access in Service middleware |
| Create/delete/restore Unit | Product lifecycle policy + Service action policy |
| History/Comment | Their own Service or Endpoint policy |
| Worktree manage/read/write/merge | Worktree membership, Unit permission, and action policy |

Do not rely on the browser's claimed user, `memberID`, revision, or read-only UI. Do not make a
product handler call its own collaboration HTTP route just to reuse policy; call the in-process
Service or shared domain module through its public contract.

## 4. Make creation recoverable

Creating a Workspace document crosses owners. Use a durable operation:

```text
reserve operation + idempotency key
→ create Resource/Node/ACL in product store
→ create Unit with matching Unit ID/type in Collaboration Service
→ persist mapping and mark operation complete
```

If the process crashes after either store commits, retry the same operation and resume from durable
state. Decide whether an irrecoverable partial result is completed or compensated. Apply the same
discipline to delete, restore, import, Worktree creation, and merge workflows that cross owners.

The Unit ID must be globally unique within the Collaboration Service/database. The initial UnitData
must use the type and revision required by the current cohort. Never manufacture those rules from
an older example.

## 5. Configure the browser editor

Choose the corresponding Univer/Core/Pro content presets or plugins for the Resource's Unit type.
Keep every coupled package on the exact cohort. Avoid registering a plugin already contained in a
preset.

Register the Pro Collaboration plugin family when constructing Univer, configure the supported
snapshot, submit, WebSocket, and Session-ticket routes, then use the loader that matches the stored
Unit type.

Use Facade API for product editing behavior. For deeper product extensions, implement a plugin and
use command/mutation contracts rather than editing snapshot objects. UI permission state improves
the experience but never replaces server-side policy.

## 6. Treat every Unit as its own content domain

The Workspace can expose all five Unit types through one product shell while loading distinct
content capabilities:

| Unit | Typical product concerns |
| --- | --- |
| Sheet | cells, formulas, tables, charts, sheet blocks, calculation |
| Doc | rich text, paragraphs, pagination, images, document resources |
| Slide | pages, shapes, media, layout, presentation rendering |
| Board | open canvas, visual objects, viewport-oriented rendering |
| Base | tables, fields, records, views, structured formulas |

Share product identity, navigation, ACL, collaboration, and lifecycle patterns. Do not share
Unit-specific authoring code unless its public API explicitly supports those types.

## 7. Add History, Comment, and Worktree deliberately

History consumes confirmed collaboration revisions and builds a user-facing derived index. Thread
Comment owns thread data and uses content anchors without becoming the Unit authority. Worktree
creates isolated collaboration scopes and evaluates/merges them into trunk.

Give each domain its own Service, Endpoint, Adapter, middleware, lifecycle, and disposal. They may
reuse Transport, the authenticated identity, access resolver, and a physical SQLite file. Reuse of
infrastructure is not reuse of domain ownership.

The product application owns the Worktree catalog, task assignment, review page, and user decision
to merge or discard.

## 8. Production topology

For a single-node product, a pragmatic topology is one Node process/container hosting product API,
Collaboration Endpoint, and background jobs, with persistent product and collaboration databases
plus blob storage. Keep build-time license inputs separate from runtime secrets and data.

Before production, verify:

- persistent paths, schema migration, backup, restore, and disaster recovery;
- reverse proxy forwarding for raw collaboration HTTP and WebSocket upgrade;
- request size, timeouts, connection limits, and graceful shutdown;
- authentication and ACL coverage for every enabled domain;
- logs, traces, metrics, and error classification without leaking `customData`;
- single-Endpoint realtime limitation, or an explicit distribution design;
- durable recovery for cross-store operations.

## 9. End-to-end acceptance

A minimal Workspace acceptance path should prove observable behavior:

1. Create a Resource and collaboration Unit through the product API.
2. Open it in two authenticated browser sessions.
3. Verify snapshot load, WebSocket Session, JOIN, edit, ACK, and confirmed update.
4. Verify viewer and unauthorized behavior on both HTTP and WebSocket paths.
5. Restart the process and reload the confirmed content.
6. Inject a partial create/delete/restore failure and recover the durable operation.
7. Open at least one verified example for every enabled Unit type.
8. If History, Comment, or Worktree is enabled, test its independent policy and lifecycle.

After this path works, add Agent editing through [Add Agent/CLI editing](./add-agent-cli.md).
