# Build Univer App clean-context evaluations

These evaluations exercise the agreed public seam: a fresh Agent receives the installed skill and
one user task. It does not receive the spec, expected answer, prior analysis, or another evaluation's
output.

## 1. Architecture ask/reference

**Prompt:** Use `$build-univer-app` to explain ownership of snapshots/revisions, Resources/ACL, and
Agent execution for an app with browser users and background Agents; explain how browser and CLI
clients edit one Unit safely and select the collaboration backend.

**Observed:** Passed. The Agent selected the self-hosted Collaboration SDK, assigned content,
collaboration, CLI, and product ownership correctly, preserved identity and dual-store boundaries,
described retry/terminal conflict behavior, and rejected the legacy backend.

## 2. Workspace implementation

**Fixture:** A temporary detached worktree of the canonical examples revision, removed after the
evaluation.

**Prompt:** Add audit logging for successfully committed collaboration changesets in
`univer-workspace`; identify authenticated user and Unit, avoid failed/retried pre-commit attempts,
and preserve behavior.

**Observed:** Passed. The Agent used the post-commit `changesetCommitted` seam for trunk and
Worktree, added integration assertions and design documentation, and reported 123 tests, typecheck,
production build, and diff checks passing. The isolated worktree was deleted without retaining its
changes.

## 3. Agent/CLI + Worktree workflow

**Prompt:** Design a remote Slide Agent workflow in which every new task uses a new Worktree, adds
shapes, checks stored content and visual layout, and returns a review URL without merging. Cover
authentication, target resolution, concurrent browser edits, terminal conflicts, and cleanup.

**Observed:** Passed. The Agent resolved product targets before content access, used a
Worktree-scoped manual runtime, kept one synchronization state machine, described bounded retry and
terminal conflict behavior, inspected and rendered the committed Slide, used Slide layout lint and
screenshots, returned a review URL without merge, and released leases, workers, and render resources.

## Mechanical validation

- `npm run validate`
- `npm run validate:skill`
- `git diff --check`

All passed on the implementation branch.
