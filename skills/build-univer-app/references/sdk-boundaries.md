# SDK boundaries

| Need | Owner |
| --- | --- |
| Content models, editing, UI, Facade, commands, plugins | Univer/Core/Pro |
| Snapshot, changeset, revision, OT, collaboration protocol | Collaboration SDK |
| Headless execution, inspection, Office exchange, rendering | CLI SDK |
| Users, ACL, tenancy, hierarchy, targets, workflows | Product application |

## Stable boundaries

- Use `univer-integrate`, `univer-pro-integrate`, `univer-plugin-dev`, or `univer-node-backend` for
  Univer/Core/Pro implementation details.
- Use `univer-collaboration-integration` for Transport, Endpoint, Service, Database Adapter,
  middleware, History, Thread Comment, and Worktree integration.
- Use `univer-cli-sdk-integration` for `@univer-cli/*` capabilities and command presets.
- Use `univer-cli` or `univer-workspace-cli` only to operate the finished applications.

The supported collaboration chain is:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History, Thread Comment, and Worktree are optional domains with their own service, middleware,
storage, and lifecycle. The product still owns their user-facing catalog and policy.

CLI SDK packages are capabilities, not a product framework. Product authentication, target
resolution, storage, and command composition stay in the host application. Capability coverage is
Unit-specific; do not generalize verified Sheet, Doc, Slide, Board, or Base behavior to another Unit.

Keep all version-coupled packages on one exact cohort. Prefer installed package root exports, then
the owning Skill and canonical example. Report unresolved drift instead of inventing an API.
