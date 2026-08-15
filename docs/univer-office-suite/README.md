# Univer Office Suite Architecture

This guide explains how a product application composes Univer/Core/Pro, the self-hosted
Collaboration SDK, and the Univer CLI SDK. It covers cross-layer architecture; each SDK integration
Skill owns its implementation details.

English is authoritative. [简体中文](./README.zh-CN.md) is maintained alongside it.

## The stack

```text
Browser user → Univer/Core/Pro + Collaboration Client ─┐
                                                       ├→ Product application
Agent task  → CLI SDK + headless Univer/Core/Pro ──────┘   ├→ Product store
                                                           └→ Collaboration SDK → collaboration store
```

- **Univer/Core/Pro** owns content models, plugins, Facade, commands, UI, and rendering.
- **Collaboration SDK** owns authoritative snapshots, changesets, revisions, OT, and protocol.
- **Univer CLI SDK** supplies headless execution, inspection, exchange, and rendering capabilities.
- **The product application** owns identity, ACL, tenancy, hierarchy, targets, workflows, and
  deployment policy.

The self-hosted Collaboration SDK is the only supported collaboration backend for new apps. The
legacy Univer Server integration is deprecated and unsupported.

## Read by goal

- Read [Architecture](./architecture.md) for data flow, identity, storage, and lifecycle seams.
- Read [SDK boundaries](./sdk-boundaries.md) to select the owning Skill.
- Read [Sources](./sources.md) when versions or source authority matter.

Complete runnable applications remain in `dream-num/univer-collaboration-examples`; this guide does
not duplicate them.

## Agent entry

Use `build-univer-app` for cross-SDK architecture. It routes implementation to
`univer-integrate`, `univer-pro-integrate`, `univer-plugin-dev`, `univer-node-backend`,
`univer-collaboration-integration`, or `univer-cli-sdk-integration`. Use `univer-cli` and
`univer-workspace-cli` to operate finished applications.
