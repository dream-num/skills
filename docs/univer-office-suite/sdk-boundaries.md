# SDK Boundaries

[简体中文](./sdk-boundaries.zh-CN.md)

## Responsibility map

| System | Owns | Skill |
| --- | --- | --- |
| Univer Engine / Runtime SDK | Unit models, plugins, Facade, commands, mutations, UI, rendering, browser and Node runtimes | `univer-integrate`, `univer-pro-integrate`, `univer-plugin-dev`, `univer-node-backend` |
| Univer CLI SDK | Agent-facing execution, inspection, Office exchange, rendering, screenshots, lint, runtime and process helpers | `univer-cli-sdk-integration` |
| Univer Collaboration SDK | Server-side snapshot, changeset, revision, OT, idempotency, HTTP/WebSocket protocol, rooms, persistence | `univer-collaboration-integration` |
| Product application | Identity, ACL, tenancy, hierarchy, targets, blobs, workflows, deployment policy | `build-univer-app` for cross-system composition |

The Engine / Runtime SDK is the foundation. The CLI SDK builds Agent-facing capabilities on its
headless runtime. The Collaboration SDK is the server-side authority used by browser and Agent
clients. The product application connects these systems without transferring product policy into
SDK internals.

The supported server-side collaboration chain is:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

History, Thread Comment, and Worktree are separate optional collaboration domains. They may reuse
infrastructure, but each retains its own service, middleware, storage, and lifecycle. The product
still owns their user-facing catalog and policy.

CLI SDK packages are target-neutral capabilities and optional command presets, not a product
framework. The host application owns command composition, credentials, targets, storage, and
business policy.

Capability evidence is Unit-specific. Do not generalize a Sheet, Doc, Slide, Board, or Base recipe
to another Unit. Resolve API questions through the owning Skill and installed public exports rather
than inventing compatibility rules in this cross-system guide.
