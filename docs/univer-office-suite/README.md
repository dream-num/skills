# Univer Office Suite Architecture

This guide explains how a product application composes three SDK systems: the Univer Engine /
Runtime SDK, the Agent-facing Univer CLI SDK, and the server-side Univer Collaboration SDK. It
covers cross-system architecture; each integration Skill owns its SDK-specific details.

English is authoritative. [简体中文](./README.zh-CN.md) is maintained alongside it.

## The three SDK systems

```text
Browser user → Univer Engine / Runtime + Browser Collaboration Client ─┐
                                                                       ├→ Product application
Agent task → Univer CLI SDK + headless Engine / Runtime ───────────────┘   ├→ Product store
                                                                           └→ server-side Collaboration SDK
                                                                               → collaboration store
```

- **Univer Engine / Runtime SDK** is the foundation: Unit models, plugins, Facade, commands,
  mutations, browser UI, rendering, and browser or Node runtimes. It includes Univer and Univer Pro
  capabilities such as the browser Collaboration Client.
- **Univer CLI SDK** is Agent-facing. It builds execution, inspection, Office exchange, rendering,
  screenshots, lint, and runtime helpers on the Engine / Runtime SDK.
- **Univer Collaboration SDK** is server-side. It owns authoritative snapshots, changesets,
  revisions, OT, idempotency, HTTP/WebSocket protocol, rooms, and persistence contracts.
- **The product application** composes all three and owns identity, ACL, tenancy, hierarchy, target
  resolution, sharing, blob storage, workflows, and deployment policy.

The self-hosted Univer Collaboration SDK is the only supported collaboration backend for new apps.
The legacy Univer Server integration is deprecated and unsupported.

## Read by goal

- Read [Architecture](./architecture.md) for runtime placement, data flow, identity, storage, and
  lifecycle seams.
- Read [SDK boundaries](./sdk-boundaries.md) for responsibility and Skill routing.
- Read [Sources](./sources.md) when source authority matters.

## Agent entry

Use `build-univer-app` for cross-system architecture. It routes Engine / Runtime work to
`univer-integrate`, `univer-pro-integrate`, `univer-plugin-dev`, or `univer-node-backend`; Agent
capabilities to `univer-cli-sdk-integration`; and the server-side collaboration backend to
`univer-collaboration-integration`.
