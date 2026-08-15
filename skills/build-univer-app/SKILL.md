---
name: build-univer-app
description: "Use when explaining, designing, reviewing, or changing a Univer application whose architecture crosses the Univer Engine / Runtime SDK, the agent-facing Univer CLI SDK, the server-side Univer Collaboration SDK, or product-owned identity, ACL, storage, and workflows. Route SDK-specific implementation to the owning integration Skill."
---

# Build Univer App

Compose a Univer application from three SDK systems:

```text
Univer Engine / Runtime SDK    content models, plugins, Facade, commands, browser and Node runtimes
Univer CLI SDK                 Agent-facing execution, inspection, exchange, and rendering
Univer Collaboration SDK       server-side collaboration authority, protocol, and persistence
```

The product application composes these systems and owns identity, ACL, tenancy, hierarchy, target
resolution, sharing, blob storage, business workflows, and deployment policy.

The self-hosted Univer Collaboration SDK is the only supported collaboration backend for new apps.
The legacy Univer Server integration is deprecated and unsupported.

## Route to the owning Skill

Load only the Skills needed for the task:

| SDK system | Work | Skill |
| --- | --- | --- |
| Engine / Runtime | Embed or configure Univer | `univer-integrate` |
| Engine / Runtime | Add Univer Pro capabilities | `univer-pro-integrate` |
| Engine / Runtime | Build a plugin | `univer-plugin-dev` |
| Engine / Runtime | Run Univer directly in Node.js | `univer-node-backend` |
| CLI SDK | Build with `@univer-cli/*` packages | `univer-cli-sdk-integration` |
| Collaboration SDK | Build the self-hosted collaboration backend | `univer-collaboration-integration` |

For work crossing systems, use this Skill to settle ownership and load each relevant integration
Skill for its implementation details.

## Establish the architecture

1. Identify the product composition root, required Unit types, clients, identity model, storage,
   and deployment topology.
2. Read [architecture.md](references/architecture.md) for cross-system data, identity, and persistence
   boundaries.
3. Read [sdk-boundaries.md](references/sdk-boundaries.md) for SDK ownership and cross-system getchas.
4. Read [sources.md](references/sources.md) when source authority matters.

For complex work, define success criteria before planning. Inspect an existing application's
composition and adapters before adding new ones.

## Preserve the seams

- The Engine / Runtime SDK owns live content behavior; change it through public Facade, command,
  and plugin APIs rather than editing snapshots.
- The CLI SDK builds Agent-facing capabilities on the Engine / Runtime SDK. It does not own product
  identity, targets, or storage policy.
- The Collaboration SDK owns authoritative collaborative state and protocol.
- The product application owns product policy and workflows across the three SDK systems.
- Product and collaboration stores do not share an assumed transaction. Cross-store changes need a
  durable, retryable application workflow.
- Browser and Agent clients use different runtime models but converge on the same authoritative
  Unit revision stream.

Use the owning integration Skill for SDK-specific APIs. If its guidance conflicts with installed
public exports, show the evidence and stop the affected implementation instead of guessing an API.
