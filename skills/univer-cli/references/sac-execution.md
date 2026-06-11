# SaC Execution

Execution commands operate on the target `.univer` and the resolved sidecar source. SaC commands
require clean target state; use `univer status` and commit or restore uncommitted local mutations
before `materialize`, `apply`, `rollback`, or `verify`.

## Apply

```bash
univer sac apply "$WB"
```

`apply` executes pending migration source into the target workbook. It advances the applied SaC
chain. Apply success means the source executed; it does not prove that workbook-visible behavior is
correct.

Use workbook-visible evidence, view/export readback, or `verify` when correctness matters.

## Rollback

```bash
univer sac rollback "$WB"
```

`rollback` moves the target back across an applied migration boundary. It is appropriate when the
latest applied source step should be undone or when repair should return to a known SaC boundary.

Rollback is not arbitrary spreadsheet undo. It operates on the applied SaC chain.

## Verify

```bash
univer sac verify "$WB" --json
```

`verify` checks assertions for applied packs against a sandbox copy. It does not apply pending
source. It returns `reportPath`; read that path instead of constructing a hidden sidecar path by
hand.

Sidecar `runs/` contains verify evidence:

- `runs/<run-id>/verify-report.json`: checked packs, skipped packs, assertion counts, failures,
  setup errors, and diagnostics.
- `runs/<run-id>/artifacts/`: sandbox copy artifacts when verify reaches runtime readback.

Interpretation:

- `status: passed` means checked assertions matched actual readback.
- `status: failed` means compare expected/actual, pack id, assertion kind, target, diagnostics, and
  first difference when present.
- `status: error` means setup failed before workbook behavior can be judged.
- zero-assertion, all-skipped, or unchecked changed-pack runs are weak completion evidence for
  changed durable behavior.

Use assertions and verify when durable workbook correctness matters. The skill does not require a
specific RED/GREEN workflow.
