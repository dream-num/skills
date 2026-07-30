# Delivery and acceptance

## Deliverables

Commit the applicable outputs for the selected components and connections into the user's system:

- CLI executable installation or packaging configuration;
- CLI adapter and structured result types;
- Facade scripts and domain agent Skills;
- daemon/Gateway runtime configuration and lifecycle integration;
- Cowork packages, peer cohort, controller, and UI integration;
- persistence mapping for target, unitId, worktreeId, and artifacts;
- lockfile, build configuration, and operating instructions;
- a real end-to-end smoke.

## Version pinning

Record and ship the CLI version/build, Runtime Skill source, Cowork version, Cowork peer
dependencies, Gateway protocol, and runtime platform. Treat the user's existing lockfile and
release configuration as authoritative.

After any component upgrade, probe CLI again, reread Runtime Skills and declarations, and rerun
acceptance for every selected connection.

## Base CLI acceptance

1. Use real user input or an existing target and resolve the public IDs needed by this task.
2. Perform the selected create, import, read, change, verify, or export operation.
3. For a change task, complete one real domain change in a worktree.
4. Read back the target content or state with the applicable `inspect` or structured command and
   assert it.
5. For appearance-sensitive content, generate a screenshot or obtain an external-browser Viewer
   handoff through `univer open`.
6. When the user flow includes review or merge, mark the worktree ready and read the state from
   `status --json`.
7. Return the requested structured result, Link, Viewer URL, or export artifact.

## Gateway acceptance

1. Start the daemon from the selected runtime.
2. Confirm that `daemon status --json` reports a ready Gateway.
3. Confirm that a service creation flow returns a Univerfile Link.
4. Use the Link from another process to complete a CLI operation and model readback.
5. When the goal requires persistent access, verify that the target remains available after a
   daemon restart.

## Cowork acceptance

When a host page presents or operates Univer content or Unit/worktree/review state, claim embedded
UI completion only after the real Cowork integration satisfies this section. HTTP 200, an openable
`univer open` URL, or an iframe is not Cowork evidence. If the public Cowork contract cannot connect
the target, report "embedded UI incomplete" and record the missing container, adapter, or type.

1. The host lockfile pins Cowork and the complete Univer SDK peer cohort, and the build output
   contains every Viewer entry and chunk required by the installed runtime.
2. The browser sends HTTP and WebSocket traffic through a same-origin host Gateway prefix. The
   proxy forwards to the daemon that owns the target, and the page never connects to loopback on a
   container or remote machine.
3. The data source and controller open the target container, and the snapshot returns the target
   Unit plus worktree state used here.
4. When embedded content is required, the content surface produces a Viewer request for the selected
   scope, and Cowork Viewer reports ready and renders real content.
5. A CLI or model-read API proves that the Viewer shows real target data rather than static
   placeholder content.
6. CLI lifecycle changes update Cowork state; after a host action, state and content remain
   consistent.
7. The browser has no Viewer asset failure, unhandled console error, or cross-origin failure. Real
   network records include same-origin Gateway HTTP and at least one WebSocket connection.
8. Container changes and UI unmount release Viewer, subscriptions, and controller.

See [cowork-browser.md](cowork-browser.md) for concrete build commands, proxy boundaries, and
browser smoke. When the user requires a continuously accessible UI, assign application processes,
daemon, persistent directory, external entrypoint, and health checks to a definite process owner.
Repeat acceptance from the external entry after the builder agent exits.

## Host-flow acceptance

Execute one complete task from the user's real system entry:

```text
input -> host domain flow -> selected Univer components -> content verification -> final delivery
```

Record the real commands or calls, component versions, key public IDs, readback assertions, and final
artifact. A code delivery also includes a reproducible repository state, lockfile, and startup
instructions. Tie every conclusion to the current commit, dependencies, and runtime environment.

If the user specified the stack but did not provide a repository, deliver an implementation-ready
specification rather than claiming a real integration. Include exact dependencies and lockfile
actions, backend adapter files/interfaces, daemon owner and readiness, frontend controller/Viewer
lifecycle, public-ID persistence, and a stepwise smoke with expected structured results. Claim
completion only after those contracts are implemented in the repository.
