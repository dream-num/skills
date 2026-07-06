# SaC Execution

Execution commands require `--worktree "$WORKTREE_ID"` to name the worktree they act on, plus the resolved
sidecar source. Author durable changes on a worktree so review and merge stay isolated; discard
unwanted changes with `sac rollback` or `worktree discard` before re-authoring. Check scope state
first with `status`. Examples use `UNIVERFILE=./orders.univer` for the target path and
`WORKTREE_ID=<id>` for the worktree id; set them in the same shell or replace the placeholders with
literals.

## Apply

```bash
UNIVERFILE=./orders.univer

univer sac apply "$UNIVERFILE" --worktree "$WORKTREE_ID"
```

`apply` executes pending migration source into the worktree as one commit, tagged with its pack id
and source hash. Apply success means the source executed; it does not prove that target-visible
behavior is correct.

Use target-visible evidence, view/export readback, or `verify` when correctness matters.

## Rollback

```bash
UNIVERFILE=./orders.univer

univer sac rollback "$UNIVERFILE" --worktree "$WORKTREE_ID"
```

`rollback` removes the latest worktree commit (LIFO). Use it to undo the most recent applied source
step; use `worktree discard` to drop the whole worktree instead.

Rollback is not arbitrary spreadsheet undo. It steps back exactly one worktree commit.

## Verify

```bash
UNIVERFILE=./orders.univer

univer sac verify "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
```

`verify` checks global container and typed unit `assertions/**/*.assertions.ts` entrypoints against
the selected worktree state after `sac apply`.
The global typed unit `assertions/**/*.assertions.ts` entrypoints are still ordinary assertion
sources, not migration files.
It does not apply pending source. It returns `reportPath`; read that path instead of constructing a
hidden sidecar path by hand.

Sidecar `runs/` contains verify evidence:

- `runs/<run-id>/verify-report.json`: `assertionSources[]`, total and per-unit assertion counts,
  container counts, scope-aware failures, setup errors, participant actuals, and diagnostics.

Interpretation:

- `status: passed` means global assertions matched actual readback.
- `status: failed` means compare scope, `unitType`, `unitId`, assertion kind, unit-local
  target, expected value, actual value, cross-unit participant actuals, diagnostics, and first
  difference when present. Decide whether the target final state is wrong or the global assertion
  expectation is wrong before editing either side.
- Value-surface hints mean the assertion compared a different surface than the task may require:
  choose `values()`/`value()` for logical typed cell values, `displayValues()`/`displayValue()` for
  formatted output, and `valueDetails`/`cellData` evidence for storage-oriented facts. A mismatch
  such as `"123"` versus `123`, or `"-"` versus `0`, is not automatically a migration bug; first
  decide whether the task asks for text identity, typed logical semantics, or rendered display.
  Change stored values only when the final contract truly requires that stored surface.
- Source-preservation or non-output guard hints mean the assertion may be broader than the requested
  final contract. Keep those assertions only when source preservation is required; otherwise focus
  verification on the user-requested output before broadening preservation checks.
- `status: error` means setup failed before target behavior can be judged.
- setup errors such as legacy top-level `sheet()`/`range()` usage, unknown `unitId`, unit type
  mismatch, missing Facade getters, or unsupported readback surfaces are assertion setup repair
  issues, not final-state workbook mismatches.
- missing global assertions are setup errors and are not completion evidence for changed durable
  behavior.

Use assertions and verify when durable target correctness matters. The skill does not require a
specific RED/GREEN workflow.

## State Drift

`SAC_UNIT_STATE_DRIFT` means the committed scope state differs from the sidecar active applied
state. Read the diagnostic before choosing a recovery action:

- no un-applied packs: materialize the current scope state, then retry the intended apply or verify
  path
- un-applied packs present: review, apply, or remove them first; use `--preserve-drafts` only when
  you intentionally want the CLI to move them into sidecar recovery for later review

When `--preserve-drafts` is used, inspect
`materialize-recovery/<recovery-id>/draft-recovery-manifest.json` before reattaching or recreating
preserved source. Treat `materialize-recovery/` as draft recovery state, separate from
`archives/materialize/` active-history archives.

Materialize archives replaced active migrations under `archives/materialize/<archive-id>/migrations/`.
Those archived migrations are review/audit source only; apply, verify, source hashes, and migration
tail selection use active `migrations/`. Draft preservation remains separate under
`materialize-recovery/`.
