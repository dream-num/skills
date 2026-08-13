# Building a Univer Office Suite Application

This guide explains how to compose Univer/Core/Pro, the self-hosted Collaboration SDK, the Univer
CLI SDK, and your product application into one Office Suite product. It is written for developers
who need to understand the architecture and for developers directing an Agent that uses the
`build-univer-app` skill.

English is the authoritative text. [简体中文](./README.zh-CN.md) is maintained as a complete
developer translation.

## The stack in one minute

```text
Browser users
  → Univer/Core/Pro + Collaboration Client
  → application authentication and ACL
  → Collaboration Endpoint → Service → collaboration database

Agent tasks
  → product target resolver
  → CLI SDK manual collaboration runtime + headless Univer
  → the same Collaboration Endpoint, Service, and collaboration database

Product APIs
  → users, Spaces, Nodes, Resources, ACL, sharing, Worktree catalog
  → product database
```

Each layer has one job:

- **Univer/Core/Pro** is the content engine: Unit models, plugins, presets, Facade APIs, commands,
  mutations, browser UI, and rendering.
- **Collaboration SDK** is the collaboration authority: snapshots, changesets, revisions, OT,
  submission idempotency, HTTP/WebSocket protocol, rooms, and Worktree collaboration.
- **Univer CLI SDK** is the headless and Agent toolkit: explicit content execution, collaboration
  runtime, pools, inspection, Office exchange, rendering, lint, and screenshots.
- **Your application** owns identity, authentication, ACL, tenancy, product hierarchy, sharing,
  target resolution, durable business operations, and deployment policy.

The only supported collaboration backend for new applications is the self-hosted Collaboration
SDK. The legacy Univer Server integration is deprecated and unsupported.

## Read by goal

1. Read [Architecture](./architecture.md) to understand the control plane, content plane, human and
   Agent data flows, identities, and persistence boundaries.
2. Read [SDK boundaries](./sdk-boundaries.md) before selecting packages or assigning ownership.
3. Follow [Build a Workspace](./build-workspace.md) for browser, product backend, authentication,
   ACL, collaboration, and five-Unit product composition.
4. Follow [Add Agent/CLI editing](./add-agent-cli.md) for headless editing, Worktree review, Office
   conversion, inspection, rendering, screenshots, and export.
5. Check [Sources](./sources.md) for the exact revisions and release cohort reviewed by this guide.

## What “excellent” means

A production-quality application does more than render an editor. For the part of the product you
are building, verify the relevant qualities:

- correct SDK ownership and dependency direction;
- one exact compatible release cohort;
- trusted identity and server-side ACL at every data path;
- explicit Unit, Resource, Node, Worktree, Session, and submission identities;
- convergence between browser and Agent clients;
- idempotent and recoverable cross-store operations;
- content fidelity through inspection, visual review, and Office round trips where relevant;
- a deployable persistence, network, backup, observability, and shutdown model.

Do not turn that checklist into mandatory platform work for every small change. Validate in
proportion to the requested outcome and risk.

## Canonical applications

The integrated reference consists of two applications in `dream-num/univer-collaboration-examples`:

- `univer-workspace` demonstrates the browser client, product APIs, identity and ACL, product data,
  Collaboration SDK gateway, five Unit types, and Worktree lifecycle.
- `univer-workspace-cli` demonstrates authenticated target resolution, headless CLI SDK runtime,
  collaboration against the same authority, Agent Worktree editing, review handoff, inspection,
  rendering, screenshots, and Office exchange.

Use them as composition evidence. Keep complete runnable applications there instead of copying them
into this documentation or skill.

## Working with an Agent

Install the repository skills, then invoke the integration skill explicitly when the task crosses
SDK boundaries:

```text
Use $build-univer-app to explain the identity and storage boundaries in this Workspace.
```

```text
Use $build-univer-app to add reviewable Agent editing to this Univer Workspace through Worktree.
```

For a read-only question, the skill stays read-only. For design, it inspects the target and reports
decisions. For build or fix requests, it implements through public APIs and runs proportional
validation.
