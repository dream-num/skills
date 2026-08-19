---
name: univer-collaboration-integration
description: Build a new server-side backend application or extend an existing one with the self-hosted Univer Collaboration SDK. Use when an agent needs to create a Collaboration server, select packages, assemble Transport/Endpoint/Service/Database Adapter, connect application identity and ACL middleware, add SQLite persistence or optional History, Thread Comment, and Worktree capabilities, diagnose integration failures, or verify a real HTTP/WebSocket collaboration path. Do not use for frontend-only work or modifying the SDK repository itself.
---

<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Univer Collaboration Integration

## Workflow

1. Inspect the target project's Node version, package manager, HTTP server, authentication,
   persistence, logger, startup, shutdown, and checks. When starting from scratch, establish these
   choices before selecting packages.
2. Check that installed Collaboration and Univer packages use an aligned release cohort. Report a
   mismatch before selecting APIs; do not guess compatibility.
3. Select the task below and read every linked reference in that row. Do not load all references.
4. Reuse existing framework and facilities. For a new backend, choose the smallest server stack
   that supports the requested Collaboration core or optional capability.
5. Verify public APIs against the installed package root exports before use.
6. Implement within the authorized target project. Ask before adding infrastructure, running a
   database migration, or inventing a missing identity contract.
7. Run the target project's typecheck, build, and relevant tests, then exercise the smallest real
   smoke path.

## Reading routes

- **First connection:** [guide-overview](references/guide-overview.md), [guide-quick-start](references/guide-quick-start.md),
  [package-collaboration-service](references/package-collaboration-service.md), [package-collaboration-endpoint](references/package-collaboration-endpoint.md),
  [package-collaboration-transport-node](references/package-collaboration-transport-node.md), [package-collaboration-database-memory](references/package-collaboration-database-memory.md),
  [example-quick-start](references/example-quick-start.md).
- **Server assembly:** [guide-integration](references/guide-integration.md), [package-collaboration-service](references/package-collaboration-service.md),
  [package-collaboration-endpoint](references/package-collaboration-endpoint.md), [package-collaboration-transport-node](references/package-collaboration-transport-node.md), and the
  selected Database Adapter reference.
- **Identity, ACL, and middleware:** [guide-identity-and-middleware](references/guide-identity-and-middleware.md),
  [package-collaboration-service](references/package-collaboration-service.md), [package-collaboration-endpoint](references/package-collaboration-endpoint.md),
  [package-collaboration-transport-node](references/package-collaboration-transport-node.md), [example-permissions](references/example-permissions.md).
- **SQLite and production:** [guide-production](references/guide-production.md),
  [package-collaboration-database-sqlite](references/package-collaboration-database-sqlite.md), [package-collaboration-endpoint](references/package-collaboration-endpoint.md),
  [package-collaboration-transport-node](references/package-collaboration-transport-node.md), [example-database-adapter](references/example-database-adapter.md).
- **History:** [guide-extensions](references/guide-extensions.md), [package-collaboration-history-service](references/package-collaboration-history-service.md),
  [package-collaboration-history-endpoint](references/package-collaboration-history-endpoint.md),
  [package-collaboration-history-database-sqlite](references/package-collaboration-history-database-sqlite.md), [example-history](references/example-history.md).
- **Thread Comment:** [guide-extensions](references/guide-extensions.md), [package-collaboration-comment-service](references/package-collaboration-comment-service.md),
  [package-collaboration-comment-endpoint](references/package-collaboration-comment-endpoint.md), and the selected Comment Adapter reference,
  then [example-comments](references/example-comments.md).
- **Worktree:** [guide-extensions](references/guide-extensions.md), [package-collaboration-worktree-service](references/package-collaboration-worktree-service.md),
  [package-collaboration-worktree-endpoint](references/package-collaboration-worktree-endpoint.md), [package-collaboration-worktree-client](references/package-collaboration-worktree-client.md),
  the selected Worktree Adapter reference, and [example-worktree](references/example-worktree.md).
- **Diagnosis:** start with [guide-production](references/guide-production.md), then read the Package reference for the
  first failing Transport → Endpoint → Service → Database layer.

## Boundaries

- Keep application users, ACL, tenants, files, sharing, and cross-storage consistency in the host.
- Treat frontend authorization hints as UI only; enforce access at Transport, Endpoint, and Service.
- Add optional History, Comment, or Worktree only when requested; each has independent middleware,
  storage, and lifecycle.
- Prefer target-version package root exports, then source documents, generated references, and
  examples in that order. Report drift instead of inventing an API or preserving a workaround.

## Verification

Verify creation or reading of one Unit, HTTP snapshot and session ticket, WebSocket connection and
JOIN, one submitted changeset, and a confirmed update received by another client. With persistent
storage, verify the Unit after restart. If the environment lacks a browser, second client, or runnable
service, state exactly which links remain unverified and give the smallest manual check; never report
an unexecuted smoke path as passing.

## Package references

- [package-collaboration-comment-database-memory](references/package-collaboration-comment-database-memory.md)
- [package-collaboration-comment-database-sqlite](references/package-collaboration-comment-database-sqlite.md)
- [package-collaboration-comment-endpoint](references/package-collaboration-comment-endpoint.md)
- [package-collaboration-comment-service](references/package-collaboration-comment-service.md)
- [package-collaboration-database-memory](references/package-collaboration-database-memory.md)
- [package-collaboration-database-sqlite](references/package-collaboration-database-sqlite.md)
- [package-collaboration-endpoint](references/package-collaboration-endpoint.md)
- [package-collaboration-history-database-sqlite](references/package-collaboration-history-database-sqlite.md)
- [package-collaboration-history-endpoint](references/package-collaboration-history-endpoint.md)
- [package-collaboration-history-service](references/package-collaboration-history-service.md)
- [package-collaboration-service](references/package-collaboration-service.md)
- [package-collaboration-transport-node](references/package-collaboration-transport-node.md)
- [package-collaboration-worktree-client](references/package-collaboration-worktree-client.md)
- [package-collaboration-worktree-database-memory](references/package-collaboration-worktree-database-memory.md)
- [package-collaboration-worktree-database-sqlite](references/package-collaboration-worktree-database-sqlite.md)
- [package-collaboration-worktree-endpoint](references/package-collaboration-worktree-endpoint.md)
- [package-collaboration-worktree-service](references/package-collaboration-worktree-service.md)
