# Reference implementations

Use references to inspect real connections, distribution, and lifecycle. Never infer the user's
application from them. Select the required connection first, then inspect only the relevant files.

## OpenWork: complete host integration

Pinned public commit:

<https://github.com/dream-num/openwork-univer/commit/bb4e50b0bfb2df539d13b06f67b0b427559de812>

This commit shows an existing Electron/React agent application integrating the CLI runtime, daemon,
and Cowork together. Inspect:

- `univer.compatibility.json`: pins CLI, Cowork, SDK cohort, Skill source commit, and integrity as
  one compatible set;
- `scripts/prepare-univer-distribution.mjs`: prepares an offline CLI and canonical Skill at build
  time;
- `packages/univer-runtime-distribution/package.json`: acquires the CLI runtime at an exact version;
- `apps/server/src/univer-runtime/distribution.ts`: resolves and verifies the packaged runtime,
  Skill digest, and provenance;
- `apps/server/src/univer-runtime/host.ts`: resolves the executable, starts the daemon, and owns host
  process boundaries;
- `apps/app/src/react-app/domains/session/artifacts/univer-cowork-session.ts`: creates the Gateway
  data source, controller, and container;
- `apps/app/src/react-app/domains/session/artifacts/artifact-panel.tsx`: composes Cowork Viewer with
  host artifact UI;
- `apps/app/vite.viewer.config.ts`: bundles Viewer dependencies into the host output.

The reusable structure is:

```text
compatibility manifest
  -> acquire and verify CLI + Skill during the build
  -> resolve executable and manage daemon from the host
  -> return a Gateway handoff from the server
  -> create Cowork controller + Viewer in React
  -> keep artifact, routing, and page experience in the host
```

Do not copy OpenWork's session, artifact, or desktop product model. Map target, task, route, and UI
into the user's existing model.

## Official agent discovery Skill

Public repository:

<https://github.com/dream-num/skills>

Inspect `skills/univer-cli/` to see how an agent moves from the discovery Skill into Runtime Skills
provided by the installed CLI. Builders can install the entry with `npx skills add dream-num/skills`;
product packaging should still pin the source revision.

## Cowork web host: empty-repository builder integration

Public repository:

<https://github.com/dream-num/univer-cli-app-cowork-test/tree/b0d71c0b53c36753cb82d25fb33bd4e4f908840f>

A fresh agent built this real web application in an empty Git repository after reading only this
Skill and an ordinary builder request. It demonstrates one complete delivery path through CLI
content operations, daemon/Gateway, a same-origin HTTP/WebSocket proxy, Cowork
controller/content-surface/Viewer/actions, data readback, and browser acceptance. Inspect:

- `univer.compatibility.json` and the lockfile: installed artifacts and full peer cohort;
- `server/cli-adapter.mjs`: argv and structured-result CLI calls from a host process;
- `server/main.mjs`: daemon upstream, same-origin Gateway proxy, and service lifecycle;
- `src/main.tsx`: stable controller, content surface, Viewer, and actions;
- `tests/e2e/focus-ledger.spec.ts`: real Viewer, HTTP/WebSocket, changes, merge, and CLI readback.

Do not copy its Focus Ledger domain, page layout, or single-file data model. Reuse its owner,
adapter, version-pinning, and acceptance shapes only for the same connection. Derive the target
application from the user's request and existing system.

## Published npm artifacts

- CLI: <https://www.npmjs.com/package/univer-cli>
- Cowork: <https://www.npmjs.com/package/@univerjs-pro/cowork>

npm metadata is authoritative for available versions, tarball integrity, bin, exports, and peer
dependencies. Treat the locally installed artifact as authoritative for implementation code.

## Rules for additional examples

Include a repository as a public reference only when the target builder can access it without extra
permission. Internal or temporarily unavailable URLs may inform maintainer investigation but cannot
be dependencies of the Skill's completion path.

Extract only these transferable facts from any new reference:

- how CLI is acquired, pinned, and resolved;
- how Runtime Skills reach the agent;
- who starts, probes, and stops the daemon;
- how target, unitId, and worktreeId cross host boundaries;
- how Cowork creates the data source, controller, content surface, and Viewer;
- how dependencies and runtime assets enter the final artifact;
- where the real end-to-end smoke enters and what it verifies.
