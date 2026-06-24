# SaC Execution

Execution commands operate on the target `.univer` and the resolved sidecar source. SaC commands
require clean target state; use `univer status <file.univer>` and commit or restore uncommitted
local mutations before `materialize`, `apply`, `rollback`, or `verify`. Examples use
`UNIVERFILE=./orders.univer` as a shell variable for the target path; set it in the same shell or
replace `$UNIVERFILE` with the literal `.univer` path.

## Apply

```bash
UNIVERFILE=./orders.univer

univer sac apply "$UNIVERFILE"
```

`apply` executes pending migration source into the target. It advances the applied SaC chain. Apply
success means the source executed; it does not prove that target-visible behavior is correct.

Use target-visible evidence, view/export readback, or `verify` when correctness matters.

## Rollback

```bash
UNIVERFILE=./orders.univer

univer sac rollback "$UNIVERFILE"
```

`rollback` moves the target back across an applied migration boundary. It is appropriate when the
latest applied source step should be undone or when repair should return to a known SaC boundary.

Rollback is not arbitrary spreadsheet undo. It operates on the applied SaC chain.

## Verify

```bash
UNIVERFILE=./orders.univer

univer sac verify "$UNIVERFILE" --json
```

`verify` checks global container and typed unit `assertions/**/*.assertions.ts` entrypoints against a sandbox copy.
The global typed unit `assertions/**/*.assertions.ts` entrypoints are still ordinary assertion
sources, not migration files.
It does not apply pending source. It returns `reportPath`; read that path instead of constructing a
hidden sidecar path by hand.

Sidecar `runs/` contains verify evidence:

- `runs/<run-id>/verify-report.json`: `assertionSources[]`, total and per-unit assertion counts,
  container counts, scope-aware failures, setup errors, participant actuals, and diagnostics.
- `runs/<run-id>/artifacts/`: sandbox copy artifacts when verify reaches runtime readback.

Interpretation:

- `status: passed` means global assertions matched actual readback.
- `status: failed` means compare scope, `unitType`, `localUnitId`, assertion kind, unit-local
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
- setup errors such as legacy top-level `sheet()`/`range()` usage, unknown `localUnitId`, unit type
  mismatch, missing Facade getters, or unsupported readback surfaces are assertion setup repair
  issues, not final-state workbook mismatches.
- missing global assertions are setup errors and are not completion evidence for changed durable
  behavior.

Use assertions and verify when durable target correctness matters. The skill does not require a
specific RED/GREEN workflow.

## State Drift

`SAC_UNIT_STATE_DRIFT` means the committed target state differs from the sidecar active applied
state. Read the diagnostic before choosing a recovery action:

- clean target with no un-applied packs: materialize the current target state, then retry the
  intended apply or verify path
- dirty target: commit or restore local mutations before materializing
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
