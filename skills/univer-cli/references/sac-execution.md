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

`verify` checks global typed unit `assertions/**/*.assertions.ts` entrypoints against a sandbox copy.
It does not apply pending source. It returns `reportPath`; read that path instead of constructing a
hidden sidecar path by hand.

Sidecar `runs/` contains verify evidence:

- `runs/<run-id>/verify-report.json`: `assertionSources[]`, total and per-unit assertion counts,
  unit-aware failures, setup errors, and diagnostics.
- `runs/<run-id>/artifacts/`: sandbox copy artifacts when verify reaches runtime readback.

Interpretation:

- `status: passed` means global assertions matched actual readback.
- `status: failed` means compare `unitType`, `localUnitId`, assertion kind, unit-local target,
  expected value, actual value, diagnostics, and first difference when present. Decide whether the
  target final state is wrong or the global assertion expectation is wrong before editing either
  side.
- `status: error` means setup failed before target behavior can be judged.
- setup errors such as legacy top-level `sheet()`/`range()` usage, unknown `localUnitId`, unit type
  mismatch, missing Facade getters, or unsupported readback surfaces are assertion setup repair
  issues, not final-state workbook mismatches.
- missing global assertions are setup errors and are not completion evidence for changed durable
  behavior.

Use assertions and verify when durable target correctness matters. The skill does not require a
specific RED/GREEN workflow.

Materialize archives replaced active migrations under `archives/materialize/<archive-id>/migrations/`.
Those archived migrations are review/audit source only; apply, verify, source hashes, and migration
tail selection use active `migrations/`. Draft preservation remains separate under
`materialize-recovery/`.
