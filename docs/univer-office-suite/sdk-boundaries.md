# SDK Boundaries

[简体中文](./sdk-boundaries.zh-CN.md)

| Need | Owner | Skill |
| --- | --- | --- |
| Embed and configure Univer | Univer/Core | `univer-integrate` |
| Add Pro capabilities | Univer Pro | `univer-pro-integrate` |
| Extend Univer | Plugin system | `univer-plugin-dev` |
| Run Univer directly in Node.js | Univer/Core/Pro | `univer-node-backend` |
| Persist and synchronize collaboration | Collaboration SDK | `univer-collaboration-integration` |
| Build headless or Agent application capabilities | CLI SDK | `univer-cli-sdk-integration` |
| Operate local `.univer` files | Univer CLI application | `univer-cli` |
| Operate remote Workspace files | Workspace CLI application | `univer-workspace-cli` |

The product application owns users, authentication, ACL, tenancy, hierarchy, sharing, target
resolution, durable workflows, backups, and deployment policy.

The supported collaboration chain is:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History, Thread Comment, and Worktree are separate optional domains. They may reuse infrastructure,
but each retains its own service, middleware, storage, and lifecycle.

CLI SDK packages are target-neutral capabilities and optional command presets, not a product
framework. The host application owns command composition, credentials, targets, and business
policy.

Capability evidence is Unit-specific. Do not generalize a Sheet, Doc, Slide, Board, or Base recipe
to another Unit. Keep version-coupled packages on one exact cohort and stop on unresolved API drift.
