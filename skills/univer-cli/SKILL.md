---
name: univer-cli
description: "Use when working with spreadsheets, workbooks, Excel-compatible files, `.univer` targets, Univer CLI commands, SaC sidecars, managed inspect tools, migration packs, formulas, formatting, charts, shapes, preview, versioning, import, export, or handoff."
---

# Univer CLI

`univer` is a terminal-native workbook engine. Use this skill to understand the public CLI and SaC
surfaces for workbook evidence, durable workbook changes, verification, preview, versioning, and
handoff.

Install with `npm i -g univer-cli`. Update with `univer update`. The executable is `univer`.
Use `univer help` and `univer help <command...>` for exact syntax.

## Core Model

Treat workbook-visible state as the source of truth. Command success, metadata, or local notes do
not prove that sheets, values, formulas, formatting, charts, resources, or exported handoff files
are correct.

The target `.univer` path is the local CLI target identity. Pick one explicit path such as
`./Budget.univer` and pass that path to commands. Do not target local workbook work by
`remoteUnitId`, `sessionId`, runtime id, workbook display name, or sheet name.

A `.univer` file is a CLI target container with top-level units. `localUnitId` identifies a unit
inside that target. `remoteUnitId` is binding metadata. Spreadsheet sheet names, A1 ranges, values,
formulas, styles, tables, filters, charts, shapes, and images are coordinates or resources inside a
selected spreadsheet unit.

Use public surfaces for workbook reads and writes. A `.univer` target is not an agent-handwritten
source file. Do not bypass the CLI/SaC surfaces to hand-patch the target container. Use inspect,
view, export, SaC source, apply, rollback, verify, and versioning commands.

## Public Surfaces

| Need | Use |
| --- | --- |
| Create a blank target | `univer new <file.univer>` |
| Import spreadsheet data | `univer import --file <input.xlsx\|csv\|url> <file.univer>` |
| Append a remote unit | `univer import --remote-unit-id <unitId> <file.univer>` |
| Initialize from a remote unit | `univer clone <file.univer> --unit-id <unitId>` |
| Discover units | `univer inspect <file.univer> --tool units --params '{}'` |
| Read workbook evidence | managed `univer inspect --tool`, then custom readonly `univer inspect --script` probes |
| Understand visual state | `univer view`, then open or share the returned URL |
| Create SaC authoring sidecar | `univer sac materialize <file.univer> --json` |
| Create durable source | `univer sac migration create <description> <file.univer>` |
| Discover migration scaffolds | `univer sac migration templates --json` |
| Execute pending source | `univer sac apply <file.univer>` |
| Revert applied boundary | `univer sac rollback <file.univer>` |
| Verify applied behavior | `univer sac verify <file.univer> --json` |
| Check local state | `univer status` |
| Record or discard local mutations | `univer commit`, `univer restore`, `univer reset` |
| Sync remote-bound units | `univer pull`, `univer sync` |
| Read review comments | `univer view comments <file.univer> --json` |
| Produce handoff file | `univer export <file.univer> <output.xlsx|csv>` |

## Evidence Tools

Managed inspect tools are the preferred readonly evidence surface. Use:

```bash
univer inspect tools list --json
univer inspect tools resolve sheet-range --json
univer inspect "$WB" --tool sheet-range --params ./range.params.json
printf '%s' '{"localUnitId":"...","sheetName":"Sheet1","rangeA1":"A1:D20"}' \
  | univer inspect "$WB" --tool sheet-range --params -
```

Common tools:

- `units`: unit inventory, `localUnitId`, unit type, names, capabilities, remote binding metadata.
- `sheet-overview`: sheets, used ranges, bounded samples, formulas, candidate regions, warnings.
- `sheet-search`: find visible text or values when coordinates are unknown.
- `sheet-neighborhood`: read context around a known anchor.
- `sheet-range`: read known rectangular ranges and optional value/formula/format/style facts.
- `sheet-formulas`: audit formula cells.
- `sheet-conditional-formats`: inspect conditional formatting rule resources.

For large tables, do not use `sheet-range` as a table dump. Use `sheet-overview` first to learn
used ranges and table shape. Before writing migration source for aggregate, rebuild, split, or
reconciliation tasks, obtain compact source/target summary facts such as counts, grouped totals,
mismatches, and head/tail samples. If managed tools only provide samples or raw grid ranges, write a
readonly custom inspect script that returns those facts as compact JSON. That summary should replace
full source-table dumps for that same evidence question; do not also dump the same large source
tables unless exact row-level evidence is needed for a named ambiguity. Increase `sheet-range` limits
only when raw cells are genuinely needed and the output will remain reviewable.

Use custom inspect scripts only when managed tools do not answer a bounded evidence question:

```bash
univer inspect "$WB" --script "$SIDECAR/inspect-scripts/probe.js" --params ./probe.params.json
```

Custom inspect scripts are readonly probes. Keep them small, parameterized, sidecar-local, and JSON
oriented. Do not use them for durable workbook mutations.

For more detail, read `references/evidence-tools.md`.

## SaC Authoring

SaC is the source-backed authoring path for durable workbook behavior.

- `materialize` creates or refreshes the hidden sidecar for an existing target from committed target
  state and returns `sidecarPath`.
- `migrations/` contains Facade Migration Pack source.
- `types/` contains generated local Facade/SaC reference material.
- `inspect-scripts/` is scratch space for readonly probes.
- `runs/` contains verification reports and sandbox artifacts.
- `assertions.ts` can express workbook-visible contracts for applied packs when correctness matters.
- `pack.files` lists migration implementation entrypoints only. Keep `assertions.ts` beside
  `pack.ts`; `univer sac verify` discovers it separately.

Migration templates are source scaffolds, not a DSL. Discover them with:

```bash
univer sac migration templates --json
univer help sac migration create
```

Choose a template only when its `useWhen` matches workbook-visible evidence. Generated template
files are ordinary SaC source with TODOs: read them, fill them from evidence, apply, and verify. If
no template fits, create an ordinary migration pack.

If behavior changes after a pack has been applied, prefer a follow-up migration over editing
already-applied source into hash/applied-state drift.

For more detail, read `references/sac-authoring.md`.

## SaC Execution

SaC commands require a clean target. Commit or restore uncommitted local mutations before
`materialize`, `apply`, `rollback`, or `verify`.

- `univer sac apply <file.univer>` executes pending migration source into the target. Apply success
  is not proof that workbook-visible behavior is correct.
- `univer sac rollback <file.univer>` moves the target back across an applied migration boundary. It
  is not arbitrary spreadsheet undo.
- `univer sac verify <file.univer> --json` checks applied pack assertions against a sandbox copy. It
  does not apply pending source. It writes a JSON report at the returned `reportPath`, under
  `runs/<run-id>/verify-report.json`, and may copy artifacts under `runs/<run-id>/artifacts/`.

Zero-assertion, all-skipped, or unchecked changed-pack verify results are weak completion evidence
for changed durable behavior. When correctness matters, use workbook-visible evidence and relevant
assertions or readback before handoff.

For more detail, read `references/sac-execution.md`.

## Versioning, Preview, And Handoff

Use `univer status` before SaC commands when target cleanliness matters. Use `univer commit` to
record verified local mutations, `univer restore` or `univer reset` to discard local work, and
`univer pull` or `univer sync` for remote-bound units.

For visual review, prefer `univer view "$WB" --no-open --json` when an agent browser tool is
available, then open the returned URL with that tool. Use `univer view "$WB" --open --json` when no
agent browser tool is available and OS browser opening is appropriate.

Use `univer export` for Excel-compatible handoff after verifying the workbook-visible state that
matters for the task.

For more detail, read `references/versioning-and-handoff.md`.

## Reference Routing

Open only the reference needed for the current question:

- `references/evidence-tools.md`: managed inspect tools, custom inspect scripts, params, normalized
  versus exact evidence.
- `references/sac-authoring.md`: materialize, sidecar structure, migration packs, templates,
  assertions, follow-up migrations.
- `references/sac-execution.md`: apply, rollback, verify, `runs/`, failure interpretation.
- `references/versioning-and-handoff.md`: status, commit, restore/reset, pull/sync, view, comments,
  export.
- `references/recipes.md`: copyable command shapes that have been checked against current CLI
  behavior.

`inspect-tools/` is an executable managed-tool resource directory used by `univer inspect --tool`.
Do not treat those files as generic scripts to run directly.

## Keep In Mind

- Discover `localUnitId` before unit-specific reads or mutations.
- Prefer managed inspect tools before custom readonly probes.
- Use normalized inspect evidence for ordinary labels, copied text, matching, grouping, and write
  decisions. Request raw/display/cell data only when exact storage or display identity matters.
- Record non-obvious assumptions somewhere durable when the task is complex, but the product skill
  does not require a specific planning method.
- Use assertions and `verify` when durable workbook correctness matters, but choose the planning or
  TDD method that fits the user and agent runtime.
- `univer doctor collect` is for authorized bug reports or Univer team support; explain why and ask
  before running it.
