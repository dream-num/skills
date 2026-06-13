# SaC Authoring

SaC is the source-backed authoring surface for durable target behavior. Use it when a task needs
repeatable target changes rather than one-off evidence reads. Examples use
`UNIVERFILE=./orders.univer` as a shell variable for the target path; set it in the same shell or
replace `$UNIVERFILE` with the literal `.univer` path.

## Materialize

For an existing target, run:

```bash
UNIVERFILE=./orders.univer

univer sac materialize "$UNIVERFILE" --json
```

Read `sidecarPath` from command JSON. Do not guess hidden sidecar paths. Materialize uses committed
target state: init data, synced changesets, and committed local changesets. Uncommitted local
mutations are excluded and should be committed or restored before SaC commands.

Typical sidecar roles:

- `migrations/`: Facade Migration Pack source.
- `assertions/`: workbook-level final-state assertion source.
- `archives/materialize/<archive-id>/migrations/`: previous active migration source archived by
  materialize for review only.
- `types/`: generated Facade/SaC reference material.
- `inspect-scripts/`: scratch readonly probes.
- `runs/`: verification reports and sandbox artifacts.
- optional notes, plans, or success criteria if the agent or task uses them.

The sidecar is source and evidence. Canonical target data and applied SaC state belong to the
target `.univer` container. Archived materialize migrations are not active source and are not
applied or verified by default.

## Migration Packs

Create durable source with:

```bash
UNIVERFILE=./orders.univer

univer sac migration create "describe-change" "$UNIVERFILE"
```

Migration packs are ordinary TypeScript source. Use generated local types in the sidecar. Keep
target path, `localUnitId`, sheet names, and ranges explicit when behavior is unit-specific.
Ordinary draft packs include a `migration.ts` entrypoint by default. Keep `pack.ts` as metadata and
execution order; author workbook mutations in listed entrypoint files such as `migration.ts` or
`*.unit.ts`.

`pack.files` lists migration implementation entrypoints only. Do not include assertion files,
README files, params, probes, or evidence files. Keep workbook assertions under
`assertions/**/*.assertions.ts`; `univer sac verify` discovers global assertion entrypoints separately
from migration apply source.

For ranges with intentional blanks, clear the target range first and skip per-cell writes for blank
cells, or write nonblank cells individually. Do not pass `null` inside `setValues()` matrices. When
writing totals or other formulas in amount columns, set the formula/value and expected number format
in the same migration. Prefer A1 range strings for simple table writes, and check sidecar
`types/*.d.ts` before using less familiar range APIs such as `offset()`.

If a pack has already been applied and behavior needs to change, prefer a follow-up migration pack
over editing already-applied source into hash or applied-state drift.

## Templates

Templates are source scaffolds, not a DSL. Discover them with:

```bash
univer sac migration templates --json
univer help sac migration create
```

Choose a template only when its `useWhen` metadata matches target-visible evidence. Generate the
source, inspect it, fill TODOs from evidence, then apply and verify:

```bash
UNIVERFILE=./orders.univer

univer sac migration create "update-prices" "$UNIVERFILE" --template sheet-keyed-write
```

If no template fits, create an ordinary migration pack and author the source directly.

Do not infer template availability by passing invalid ids, scanning sidecars, or scanning installed
skills. The CLI help and `templates --json` output are the supported discovery surfaces.

## Assertions

`assertions/**/*.assertions.ts` entrypoints are useful when correctness matters and
workbook-visible final state should be checked repeatably. Assertions can cover values, formulas,
ranges, styles, resources, tables, filters, or other supported workbook facts.

Treat `assertions/**/*.assertions.ts` as the current acceptance contract for the target workbook.
Split entrypoints by workbook concern, such as `values.assertions.ts`,
`formatting.assertions.ts`, or `resources.assertions.ts`, not by migration pack. Other `.ts` files
under `assertions/` are helpers only when imported by an entrypoint. When a migration changes the
intended final workbook state, update the global assertions to the new final state in the same
work. Do not keep old intermediate expectations just because an earlier migration made them true.

Good assertion targets include important labels, headers, totals, formulas, number formats, visible
values, sheet existence, used ranges, filters, tables, key resource semantics, representative rows,
and aggregate facts. For large tables, prefer stable summaries and representative rows over a full
cell snapshot.
For `displayValues`, assert blank cells as empty strings (`""`) because display readback returns
strings. Use raw/value assertions when null-like storage identity is the contract.

Do not use assertions for temporary intermediate migration states, raw `.univer` storage internals,
generated ids, broad inspect dumps, or runtime implementation details. Use readonly inspect probes
for investigation; use assertions for repeatable correctness gates.

After authoring or updating migration source, run `univer sac apply "$UNIVERFILE"` when source is
pending, then `univer sac verify "$UNIVERFILE" --json`. A failed assertion means either the target
final state is wrong or the assertion expectation is wrong; inspect the report before editing either
side.

Assertions are a product capability, not a required planning method. Use the agent or user-selected
planning approach, but keep global assertions grounded in final-state task evidence rather than
whatever a migration happened to write.
