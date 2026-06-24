---
name: univer-cli
description: "Use when working with `.univer` targets, Univer CLI commands, SaC sidecars, managed inspect tools, migration packs, spreadsheet formulas/formatting/charts, preview, versioning, import/export, or Excel-compatible handoff."
---

# Univer CLI

`univer` is a terminal-native univerfile engine. Use this skill to choose the public CLI and SaC
surfaces for target evidence, durable `.univer` changes, verification, preview, versioning, and
handoff. Use `univer help` and `univer help <command...>` for exact command syntax.

## Core Model

Treat target-visible unit state as the source of truth. Command success, metadata, local notes, or
generated source do not prove that sheets, values, formulas, formatting, charts, resources, or
handoff files are correct.

The target `.univer` path is the local CLI target identity. Pick one explicit path such as
`./Budget.univer` and pass that path to commands, including `status`. Do not target local work by
`remoteUnitId`, `sessionId`, runtime id, display name, sheet name, or the current directory.

A `.univer` file is a target container with top-level units. `localUnitId` identifies a unit inside
that target. `remoteUnitId` is binding metadata. Sheet names, A1 ranges, values, formulas, styles,
tables, filters, charts, shapes, and images are coordinates or resources inside a selected unit.

Use public surfaces for target reads and writes. A `.univer` target is not an agent-handwritten
source file. Do not bypass the CLI/SaC surfaces to patch the target container by hand.

## Public Surfaces

| Need | Use |
| --- | --- |
| Create or import targets | `new`, `import`, `clone` |
| Read target evidence | managed `inspect --tool` first; custom readonly `inspect --script` only for bounded gaps |
| Make durable changes | `sac materialize`, `sac migration create`, source edits, `sac apply`, `sac verify` |
| Recover an applied SaC boundary | `sac rollback` |
| Check or reconcile local state | `status`, `commit`, `restore`, `reset`, `pull`, `sync` |
| Review or hand off visually | `open`, `view comments`, browser tools |
| Produce Excel-compatible output | `export` after verifying the relevant target-visible state |

## Evidence Tools

Managed inspect tools are the preferred readonly evidence surface. Discover units before
unit-scoped reads, and resolve tool params when a tool shape is unclear:

```bash
UNIVERFILE=./Budget.univer
univer inspect tools list --json
univer inspect tools resolve sheet-range --json
printf '%s' '{}' | univer inspect "$UNIVERFILE" --tool units --params -
printf '%s' '{"localUnitId":"...","sheetName":"<discovered-sheet-name>","rangeA1":"A1:D20"}' \
  | univer inspect "$UNIVERFILE" --tool sheet-range --params -
```

Do not assume a default sheet name such as `Sheet1`. Read the actual sheet names from `units` or
`sheet-overview` first, then use the exact returned name in `sheetName` and in assertion `range()`
targets.

`--params` accepts either a real JSON file path or `-` for stdin. Do not pass inline JSON as the
option value; `--params '{}'` is interpreted as a file path named `{}`.

Default managed inspect output is slim JSON evidence. For review, add `--md` to render the same
evidence as Markdown; Markdown is an agent-readable view, not a roundtrip machine format. Use
default JSON or `--json` for programmatic parsing and ambiguity checks.

In slim cell facts and value details, `logicalCellValue`/`value` uses `cellData.v`/raw readback for
typed cell content, `storageValueType`/`valueType` prefers `cellData.t` when available, and
`displayCellValue`/`displayValue` mirrors Facade `getDisplayValues()`. Inspect tools do not
synthesize logical values from display text or agent-oriented normalization.

Use this evidence ladder by default: `units -> sheet-overview or sheet-search -> sheet-range slim -> exact include`. Escalate to exact include fields only for named ambiguities or assertion contracts that depend on display strings, formulas, formats, styles, rich text runs, or cell model details. Use `sheet-formulas` for formula audits and `sheet-conditional-formats` for conditional formatting rule resources.

For large tables, do not use `sheet-range` as a table dump. Use overview/search first, then obtain
concise source/target facts such as counts, grouped totals, mismatches, and head/tail samples. If
managed tools cannot answer that bounded readonly question, write a small sidecar-local custom
inspect script that returns those facts as JSON instead of dumping every source row.

When typed values, display strings, formulas, number formats, cell model details, or static style
traits affect the decision, request focused `sheet-range` fields such as `values`,
`displayValues`, `valueDetails`, `richTextRuns`, `cellFacts`, `cellData`, `formulas`,
`numberFormats`, or `semanticStyles`. Use `sheet-conditional-formats` for conditional formatting
rule resources; combine it with value evidence when a value-dependent rule is part of the task.

For more detail, read `references/evidence-tools.md`.

## SaC Authoring

SaC is the source-backed authoring path for durable target behavior. `materialize` creates or
refreshes the sidecar from committed target state and returns `sidecarPath`; do not guess hidden
paths. `migrations/` holds Facade Migration Pack source, `types/` holds local API references,
`inspect-scripts/` holds scratch readonly probes, `runs/` holds verification reports, and
`archives/materialize/` is review-only history.

`pack.files` lists migration implementation entrypoints only. Keep global assertions under
`assertions/**/*.assertions.ts`; `univer sac verify` discovers them separately. Ordinary draft
packs include `migration.ts`; keep `pack.ts` as metadata and author target mutations in listed
entrypoint files.

`assertions/**/*.assertions.ts` entrypoints express the current file-level target-visible final-state
contract when correctness matters. Use `target` for unit inventory, typed unit helpers for
unit-scoped facts, and `facts` for shared business facts. `sheetUnit(localUnitId, ...)`,
`baseUnit(localUnitId, ...)`, `slideUnit(localUnitId, ...)`, and `docUnit(localUnitId, ...)`
require the explicit `localUnitId`. `localUnitId` is the only top-level assertion unit selector; do
not route assertions by remote unit id, unit name, sheet name, or implicit active workbook state.
Split entrypoints by unit or target concern, not by migration pack, and update them to the intended
final state as migrations change behavior.

SaC source imports generated ambient modules for migration packs and assertions. Full Facade method
signatures live in the sidecar `types/*.d.ts`; use `univer lookup "<query>"` for concise API
navigation and follow its `sed` locations when you need exact declarations. For sidecar-local
checks, scope lookups narrowly, e.g. `rg "setFormula|class FRange" <sidecarPath>/types -g '*.d.ts'`,
instead of broad reads of the sidecar or CLI install. See `references/sac-authoring.md` for import
names and copyable examples.

Migration templates are source scaffolds, not a DSL. Discover them with
`univer sac migration templates --json`, choose one only when its `useWhen` matches target-visible
evidence, then fill the generated ordinary SaC source from evidence. If no template fits, create an
ordinary migration pack.

If behavior changes after a pack has been applied, prefer a follow-up migration over editing
already-applied source into hash/applied-state drift.

For more detail, read `references/sac-authoring.md`.

## SaC Execution

SaC commands require a clean target. Commit or restore uncommitted local mutations before
`materialize`, `apply`, `rollback`, or `verify`.

- `univer sac apply <file.univer>` executes pending migration source into the target. Apply success
  is not proof that target-visible behavior is correct.
- `univer sac rollback <file.univer>` moves the target back across an applied migration boundary. It
  is not arbitrary spreadsheet undo.
- `univer sac verify <file.univer> --json` checks file-level typed unit assertions against a
  sandbox copy. It does not apply pending source. It returns a `reportPath`; read the report for
  scope-aware failure facts such as `scope`, `unitType`, `localUnitId`, assertion kind, target,
  expected value, actual value, participant actuals, `valueSemantics`, `actualDiagnostics`, first
  difference, and setup error code.

Missing global assertions are setup errors and are not completion evidence for changed durable
behavior. Treat failed assertions as a decision point: either the target final state is wrong, or
the assertion expectation is wrong. Treat legacy top-level `sheet()` or
`range()` usage, missing units, unit type mismatches, and unsupported readback surfaces as setup
repair, not final-state workbook mismatch.

`SAC_UNIT_STATE_DRIFT` means the committed target state and the sidecar active applied state no
longer match. Treat it as a recovery branch and read the diagnostic before materializing or applying
again.

For more detail, read `references/sac-execution.md`.

## Versioning, Preview, And Handoff

Use `univer status <file.univer>` before SaC commands when target cleanliness matters. `status`
always requires the actual target `.univer` file; it is not a current-directory, daemon, viewer,
git, remote unit name, or sheet-name status command. Use `commit` for verified local mutations,
`restore` or `reset` to discard local work, and `pull` or `sync` for remote-bound units.

For visual review, prefer hosted viewer handoff only when you have a browser-fetchable HTTP(S)
`.univer` source URL. If `file.univer.ai` is unreachable, `univer open <source-url> --local --json`
starts a foreground localhost viewer asset server; it does not host, proxy, upload, or cache a local
`.univer` file. If you only have a local `.univer` path, ask for or create an HTTP(S) source URL
before claiming automatic viewer handoff. In headless, CI, server, or user-requested no-browser
environments, visual preview is optional unless a browser-capable tool or explicit handoff exists.

Use `univer export` for Excel-compatible handoff after verifying the target-visible state that matters.

For more detail, read `references/versioning-and-handoff.md`.

## Reference Routing

Open only the reference needed for the current question:

- `references/evidence-tools.md`: managed inspect tools, custom inspect scripts, params, default
  slim evidence versus exact evidence.
- `references/sac-authoring.md`: materialize, sidecar structure, migration packs, templates,
  assertions, follow-up migrations.
- `references/sac-execution.md`: apply, rollback, verify, `runs/`, failure interpretation.
- `references/versioning-and-handoff.md`: status, commit, restore/reset, pull/sync, hosted open,
  comments, export.
- `references/recipes.md`: copyable command shapes that have been checked against current CLI
  behavior.

`inspect-tools/` is a managed-tool resource directory used by `univer inspect --tool`; do not treat
those files as generic scripts to run directly. `univer doctor collect` is for authorized bug reports
or Univer team support; explain why and ask before running it.
