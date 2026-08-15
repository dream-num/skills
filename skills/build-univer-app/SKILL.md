---
name: build-univer-app
description: "Use when explaining, designing, reviewing, or changing a Univer application whose architecture crosses Univer/Core/Pro, the self-hosted Collaboration SDK, the Univer CLI SDK, or product-owned identity, ACL, storage, and workflows. Route single-SDK implementation work to the owning integration Skill."
---

# Build Univer App

Use this Skill for the application architecture, not as a replacement for the SDK Skills:

```text
Univer / Univer Pro       content model, plugins, Facade, commands, rendering
Collaboration SDK         authoritative snapshot, changeset, revision, OT, rooms
Univer CLI SDK            headless execution, inspection, exchange, rendering
Product application       identity, ACL, hierarchy, targets, business workflows
```

The self-hosted Collaboration SDK is the only supported collaboration backend for new apps. The
legacy Univer Server integration is deprecated and unsupported.

## Route to the owning Skill

Load only the Skills needed for the task:

| Work | Skill |
| --- | --- |
| Embed or configure Univer | `univer-integrate` |
| Add Univer Pro features | `univer-pro-integrate` |
| Build a Univer plugin | `univer-plugin-dev` |
| Run Univer directly in Node.js | `univer-node-backend` |
| Build with the self-hosted Collaboration SDK | `univer-collaboration-integration` |
| Build with `@univer-cli/*` packages | `univer-cli-sdk-integration` |
| Operate local `.univer` files | `univer-cli` |
| Operate remote Workspace files | `univer-workspace-cli` |

For work crossing layers, use this Skill to settle ownership and load each relevant integration
Skill for its implementation details.

## Establish the architecture

1. Identify the product composition root, required Unit types, clients, identity model, storage,
   and deployment topology.
2. Read [architecture.md](references/architecture.md) for cross-layer data, identity, and persistence
   boundaries.
3. Read [sdk-boundaries.md](references/sdk-boundaries.md) to assign each capability to one owner.
4. Read [sources.md](references/sources.md) when versions, compatibility, or source authority matter.
5. Keep every version-coupled `@univerjs/*`, `@univerjs-pro/*`, and `@univer-cli/*` dependency on
   one exact verified cohort. Mark unverified combinations conceptual, not runnable.

For complex work, define success criteria before planning. Inspect an existing application's
composition and adapters before adding new ones.

## Preserve the seams

- The product owns users, ACL, tenancy, hierarchy, target resolution, sharing, and workflows.
- Univer/Core/Pro owns live content behavior; change it through public Facade, command, and plugin
  APIs rather than editing snapshots.
- The Collaboration SDK owns authoritative collaborative state and protocol.
- The CLI SDK owns bounded headless capabilities, not product identity or storage policy.
- Product and collaboration stores do not share an assumed transaction. Cross-store changes need a
  durable, retryable application workflow.
- Browser and Agent clients may use different runtimes, but they converge on the same authoritative
  Unit revision stream.

Resolve conflicts using the source responsible for that layer and the target release cohort. If
installed declarations, owning Skills, and canonical examples still disagree, show the evidence and
stop the affected implementation instead of guessing an API.
