# Add Agent/CLI editing and content verification

Use the canonical `univer-workspace-cli` composition to connect a bounded Agent task to an existing
Workspace. The CLI SDK is an application toolkit, not the owner of Workspace identity or targets.

## Compose the Agent path

```text
user-facing target
→ product target resolver + authentication
→ runtime pool key
→ CLI collaboration server adapter
→ manual collaboration runtime
→ headless Univer/Core/Pro
→ same Collaboration Endpoint and Service as browser clients
```

Resolve a target to origin, Unit ID, Unit type, revision, and scope. For Worktree scope, include the
Worktree ID and use its scoped snapshot, changeset, ticket, and WebSocket routes. Reuse product
authentication and ACL; do not trust a Unit or Worktree ID merely because the caller supplied it.

## Keep one synchronization state machine

The CLI runtime explicitly loads, fetches, pulls, executes, and commits. Do not register the browser
automatic Collaboration Client in the same headless Univer instance. Its background state machine
would compete with the manual runtime.

Use the runtime contract rather than inventing revision logic:

1. Acquire an exclusive runtime for the application-owned target key.
2. Load the authoritative checkpoint and revision.
3. Pull confirmed remote changes before writing.
4. Execute Facade code bound to the explicit Unit.
5. Commit captured mutations with the runtime's idempotency identity.
6. On a retryable pull-required result, pull, transform, and recommit through the runtime.
7. On terminal conflict, stop writing and let product policy choose reload, rework, or discard.
8. Release the runtime lease in all outcomes.

## Prefer Worktree for reviewable Agent tasks

For every new editing task:

1. Resolve the product target and create a fresh Worktree with explicit Unit membership.
2. Execute one coherent content change per intended revision.
3. Inspect the stored model after mutation.
4. Render, lint, screenshot, or export when the outcome requires visual or format evidence.
5. Mark the Worktree ready and provide a browser review URL.
6. Reopen the same Worktree only for corrections to the same task.
7. Merge or discard only when the user explicitly authorizes that consequential action.

Keep catalog and review-product state in the application. Worktree Service owns isolated draft and
merge semantics, not user-facing task management.

## Capability map

| Intent | CLI SDK capability | Boundary |
| --- | --- | --- |
| Start a standard Node content runtime | headless Univer factory | No snapshot, revision, or commit ownership |
| Run Facade authoring | content execution | Bind code to an explicit Unit; application owns target |
| Read structural content | content inspection | Current verified scope is Sheet, Doc, and Slide |
| Convert Office content | unit exchange | Converts between Office and UnitData; app chooses local or collaborative destination |
| Render content | render runtime | Consume materialized UnitData; no data-loading authority |
| Capture review images | unit screenshot | Scope target to the supported Unit and desired surface |
| Check layout | unit layout lint | Current verified rules are Slide-only |
| Reuse expensive runtimes | collaboration runtime pool / worker pool | Application supplies opaque keys and lifecycle policy |
| Serve short-lived commands | daemon and command presets | Application owns command surface and process entry |

## Office content pipeline

Choose stages based on the requested result rather than running every tool automatically:

```text
Office input
→ unit exchange
→ UnitData / collaboration Unit
→ Facade mutation in headless runtime
→ structural inspection
→ render + screenshot
→ Unit-specific lint
→ optional Office export and round-trip check
```

- For a collaborative document, import UnitData through the application's durable Unit creation
  workflow, then edit through collaboration.
- For an offline conversion, keep the UnitData path local and do not create collaboration state.
- Inspect the stored model after changes; execution success alone is not evidence of correct content.
- Use screenshots for visual review and a format round trip when Office fidelity is an acceptance
  requirement.
- State the Unit scope of every check. Slide layout lint does not validate Sheet, Doc, Base, or Board.
- Treat unsupported or unexecuted combinations as conceptual.

## Validate the Agent workflow

- Browser and Agent clients observe the same confirmed Unit revision stream.
- ACL applies to target lookup, snapshot read, Worktree access, and submit.
- A concurrent browser change produces the runtime's documented retry or terminal-conflict result.
- Runtime leases release after success and failure.
- Inspection reads the committed model, screenshots reflect materialized content, and Office export
  opens successfully when export is in scope.
- Review handoff does not merge automatically.
