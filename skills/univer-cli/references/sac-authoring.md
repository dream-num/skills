# SaC Authoring

SaC is the source-backed authoring surface for durable workbook behavior. Use it when a task needs
repeatable workbook changes rather than one-off evidence reads.

## Materialize

For an existing target, run:

```bash
univer sac materialize "$WB" --json
```

Read `sidecarPath` from command JSON. Do not guess hidden sidecar paths. Materialize uses committed
target state: init data, synced changesets, and committed local changesets. Uncommitted local
mutations are excluded and should be committed or restored before SaC commands.

Typical sidecar roles:

- `migrations/`: Facade Migration Pack source.
- `types/`: generated Facade/SaC reference material.
- `inspect-scripts/`: scratch readonly probes.
- `runs/`: verification reports and sandbox artifacts.
- optional notes, plans, or success criteria if the agent or task uses them.

The sidecar is source and evidence. Canonical workbook data and applied SaC state belong to the
target `.univer` container.

## Migration Packs

Create durable source with:

```bash
univer sac migration create "describe-change" "$WB"
```

Migration packs are ordinary TypeScript source. Use generated local types in the sidecar. Keep
target path, `localUnitId`, sheet names, and ranges explicit when behavior is unit-specific.

`pack.files` lists migration implementation entrypoints only. Do not include `assertions.ts`,
README files, params, probes, or evidence files. Keep `assertions.ts` beside `pack.ts`;
`univer sac verify` discovers it separately from migration apply source.

If a pack has already been applied and behavior needs to change, prefer a follow-up migration pack
over editing already-applied source into hash or applied-state drift.

## Templates

Templates are source scaffolds, not a DSL. Discover them with:

```bash
univer sac migration templates --json
univer help sac migration create
```

Choose a template only when its `useWhen` metadata matches workbook-visible evidence. Generate the
source, inspect it, fill TODOs from evidence, then apply and verify:

```bash
univer sac migration create "update-prices" "$WB" --template sheet-keyed-write
```

If no template fits, create an ordinary migration pack and author the source directly.

Do not infer template availability by passing invalid ids, scanning sidecars, or scanning installed
skills. The CLI help and `templates --json` output are the supported discovery surfaces.

## Assertions

`assertions.ts` is useful when correctness matters and workbook-visible behavior should be checked
repeatably. Assertions can cover values, formulas, ranges, styles, resources, tables, filters, or
other supported workbook facts.

Assertions are a product capability, not a required planning method. Use the agent or user-selected
planning approach, but keep assertions grounded in task evidence rather than whatever a migration
happened to write.
