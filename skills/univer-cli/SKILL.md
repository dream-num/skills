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
| Read target evidence | baseline/source orientation, then focused managed `inspect --tool`; custom readonly `inspect --script` only for bounded aggregation/comparison gaps |
| Make durable changes | `sac materialize`, `sac migration create`, source edits, `sac apply`, `sac verify` |
| Recover an applied SaC boundary | `sac rollback` |
| Check or reconcile local state | `status`, `commit`, `restore`, `reset`, `pull`, `sync` |
| Review or hand off visually | `open`, `view comments`, browser tools |
| Produce Excel-compatible output | `export` after verifying the relevant target-visible state |

## Tool Loop Budget

Prefer one reusable evidence artifact over repeated equivalent commands. After `units`,
`sheet-overview`, `sheet-range --out`, materialize, or verify writes an artifact path, read that
artifact with bounded `jq`/`sed` before rerunning the same discovery command. Refresh evidence only
after target state changes such as `sac apply`, rollback, restore, reset, import/export roundtrip,
or an explicitly new range/sheet question.

Do not begin common range read/write/format/assertion tasks with lookup when the needed command or
API pattern is already known. Use lookup and references as bounded fallback for one diagnostic-driven
gap such as a missing API, unknown helper, argument shape, or specific unresolved symbol. If a
primitive lookup result gives the API, minimal source shape, and read hint you need, author or verify
next. Read a declaration or reference file only when a new failure, unfamiliar command surface, or
missing API detail names that specific gap.

For large-table or cross-range facts, use a custom readonly inspect script once managed tools cannot
directly answer the bounded question. One sidecar-local probe should return compact facts such as
counts, grouped totals, mismatches, candidate ranges, and head/tail samples. Do not use a custom
probe to mutate workbook state, read `.univer` internals, encode out-of-band correctness data or external
scoring data, or write durable migration/assertion source. If you are about to run a second broad
`sheet-range`, `jq` slice, or expanded range read for the same table/cross-range question, stop and
write one readonly aggregation probe instead.

## Lookup Protocol

Use `univer lookup` for CLI-owned API/type/manual discovery, not workbook-visible facts. Workbook
facts still belong to managed `univer inspect` tools. Lookup is a fallback, not the default first
step for ordinary range read/write/format/assertion work when the known pattern is sufficient.

Prefer short primitive lookup queries with 2-3 words:

```bash
univer lookup "range read"
univer lookup "range write"
univer lookup "range clear"
univer lookup "range address"
```

Use exact-symbol lookup when you need a precise declaration:

```bash
univer lookup "FRange.getValues"
univer lookup "FRange.setValues"
```

Do not paste a whole task prompt into lookup. Bad queries include
`range set values clear content spreadsheet facade` or long worksheet instructions that mix read,
write, clear, format, assertion, and workbook evidence in one search. Split complex tasks into
primitive lookups, then follow the returned `Read` hints.

Lookup text output is the public agent-facing contract. It includes `Query`, `Mode`, optional
`Suggested queries`, and `Read` sections. Do not use `univer lookup ... --json` or request another
machine-readable lookup format.

Fallback lookup flow:

1. Start lookup only after a typecheck/apply/verify/command diagnostic or genuinely unfamiliar
   command surface names the immediate API/detail gap. If the common pattern is already known, skip
   lookup and author or verify.
2. Use one short primitive query for that gap, such as `univer lookup "range values"`,
   `univer lookup "display values"`, or `univer lookup "set number format"`.
3. Read the text sections. Use `Read` commands for exact declaration lines, and use `Suggested
   queries` only when lookup reports `Mode: decompose`.
4. For compound spreadsheet tasks, follow shorter suggested primitive lookups only for still-open
   API gaps instead of trying to make one broad lookup cover reading, writing, formatting, and
   assertions.

Stop lookup once the immediate API gap is closed. A successful primitive lookup such as
`range write`, `range clear`, `number format`, or `range style` should usually be followed by
authoring or evidence work, not adjacent lookup expansion. Use exact-symbol lookup only when a
specific declaration is still ambiguous or a typecheck/apply failure points at that API.

Lookup read hints are designed to work with shell tools. Use the returned `sed -n` command or exact
location to read the declaration lines you need; avoid broad `rg` over all `types/*.d.ts` or full
type-file reads when short lookup or exact-symbol lookup can bound the context.

## Evidence Tools

For SaC targets with a materialized baseline, use a baseline-oriented hypothesis path before broad
workbook inspection. Read materialized baseline source, migration pack source, TSV/table previews,
and sidecar docs when available to map likely sheets, used regions, formulas, formats, preservation
boundaries, and candidate source/target areas. The output of this pass is a small target-evidence
question, not a final answer.

Source evidence is not target truth. Baseline source, migration source, and previews can explain
where to look and what may matter, but they do not prove current target-visible values, formulas,
formats, ledger state, hidden rows, merged cells, rich text, recalculation, or export readiness.
Confirm the decision-relevant facts with target-visible evidence before handoff.

Managed inspect tools are the preferred target-visible confirmation and fallback surface. Use them
for target inventory, sheet names, used ranges, focused range readback, search/neighborhood
confirmation, formulas, display/logical value differences, number formats, and stable style traits.
Avoid using broad managed range dumps as the first discovery step when source evidence can first
bound the question. Discover units before unit-scoped reads, and resolve tool params when a tool
shape is unclear:

```bash
UNIVERFILE=./Budget.univer
univer inspect tools list
univer inspect tools resolve sheet-range
printf '%s' '{}' > ./units.params.json
univer inspect "$UNIVERFILE" --tool units --params ./units.params.json --out ./units.result.json
printf '%s' '{"localUnitId":"...","sheetName":"<discovered-sheet-name>","rangeA1":"A1:D20"}' > ./range.params.json
univer inspect "$UNIVERFILE" --tool sheet-range --params ./range.params.json --out ./range.result.json
```

Do not assume a default sheet name such as `Sheet1`. Read the actual sheet names from `units` or
`sheet-overview` first, then copy the exact returned name in `sheetName`, `getSheetByName(...)`,
and assertion `range()` targets. Sheet names are exact identifiers: do not title-case, lowercase,
trim internal spaces, translate, or otherwise normalize them. If an inspect diagnostic includes a
`didYouMean` sheet name, rerun the same bounded evidence request with that exact name instead of
continuing to guess.

`--params` accepts either a real JSON file path or `-` for stdin. Do not pass inline JSON as the
option value; `--params '{}'` is interpreted as a file path named `{}`.

For reusable or large evidence, use `--out ./name.result.json`. The CLI writes the complete result
as pretty JSON and prints a short Agent Index Output with the artifact path, warning/truncation
status, and stable `jq` read hints. Reuse that result file with `jq` or bounded `sed` instead of
rerunning inspect. Name paired files as `*.params.json` and `*.result.json`.

Without `--out`, default managed inspect output is compact slim JSON evidence. For review, add
`--md` to render the same evidence as Markdown; Markdown is an agent-readable view, not a roundtrip
machine format. Use default JSON or `--json` for small programmatic parsing and ambiguity checks.
Use `univer inspect tools list`/`resolve` text output by default; reserve registry `--json` for
machine-readable diagnostics.

In slim cell facts and value details, `value` uses `cellData.v`/raw readback for typed cell content
and `valueType` prefers `cellData.t` when available; `displayValue` mirrors Facade
`getDisplayValues()`. Inspect tools do not synthesize `value` from display text or agent-oriented
normalization.

Use this evidence ladder by default: `materialized baseline orientation -> units -> focused
sheet-overview or sheet-search -> focused sheet-range slim -> exact include`. Escalate to exact
include fields only for named ambiguities or assertion contracts that depend on display strings,
formulas, formats, styles, or cell model details. Use `sheet-formulas` for formula audits and
`sheet-conditional-formats` for conditional formatting rule resources.

For large tables, do not use `sheet-range` as a table dump. Use source orientation plus
overview/search first, then obtain concise source/target facts such as counts, grouped totals,
dedupe facts, mismatches, expected/current shape comparisons, head/tail samples, or cross-range
alignment. If managed tools would require repeated broad reads for that same bounded
aggregation/comparison question, write one small sidecar-local custom inspect script that returns
compact JSON facts instead of dumping every source row or running multiple `sheet-range` plus `jq`
slices. Do not use custom scripts as a universal first step or to replace simple unit, sheet,
search, one-cell, or small-range confirmation reads. Keep the script under the target sidecar
`inspect-scripts/`, pass variables through params JSON, and keep durable workbook changes in SaC
migration source.

Handle recoverable inspect diagnostics by narrowing first. If `sheet-range` reports `maxCells`
exceeded, use `sheet-overview` or used-range evidence, then split into smaller scored ranges; only
raise `maxCells` deliberately when the broad read is truly required. If inspect reports an
unsupported include or semantic style trait, choose one of the supported include fields/traits in
the diagnostic, or switch to the dedicated managed evidence tool. Do not inspect workbook internals
to recover unsupported style evidence.

When typed values, display strings, formulas, number formats, cell model details, or static style
traits affect the decision, request focused `sheet-range` fields such as `values`,
`displayValues`, `valueDetails`, `cellFacts`, `cellData`, `formulas`, `numberFormats`, or
`semanticStyles`. Use `sheet-conditional-formats` for conditional formatting rule resources;
combine it with value evidence when a value-dependent rule is part of the task.

Read `references/evidence-tools.md` only when inspect params, include fields, custom script shape,
or recoverable inspect diagnostics are unclear.

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
signatures live in the sidecar `types/*.d.ts`; use short `univer lookup` queries such as
`range read`, `range write`, or exact symbols such as `FRange.getValues` for concise API
navigation, then follow read hints when you need exact declarations. For sidecar-local checks, scope
lookups narrowly, e.g. `rg "setFormula|class FRange" <sidecarPath>/types -g '*.d.ts'`, instead of
broad reads of the sidecar or CLI install. See `references/sac-authoring.md` for import names and
copyable examples.

Migration templates are source scaffolds, not a DSL. Discover them with
`univer sac migration templates --json`, choose one only when its `useWhen` matches target-visible
evidence, then fill the generated ordinary SaC source from evidence. If no template fits, create an
ordinary migration pack.

If behavior changes after a pack has been applied, prefer a follow-up migration over editing
already-applied source into hash/applied-state drift.

Read `references/sac-authoring.md` only when migration/assertion imports, sidecar source layout,
templates, or typecheck failures require more detail.

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
  expected value, actual value, participant actuals, first difference, and setup error code.

Missing global assertions are setup errors and are not completion evidence for changed durable
behavior. Treat failed assertions as a decision point: either the target final state is wrong, or
the assertion expectation is wrong. Treat legacy top-level `sheet()` or
`range()` usage, missing units, unit type mismatches, and unsupported readback surfaces as setup
repair, not final-state workbook mismatch.

When verify reports a value-surface hint, choose the intended assertion surface explicitly:
`values()`/`value()` for logical typed cell values, `displayValues()`/`displayValue()` for formatted
output, and `valueDetails`/`cellData` evidence for storage-oriented facts. A mismatch such as
`"123"` versus `123`, or `"-"` versus `0`, is a decision point: first decide whether the task asked
for text identity, logical numeric/date semantics, or displayed formatting. Do not immediately add a
migration to coerce stored values when changing the assertion helper or adding number-format/display
evidence is the correct contract. If verify reports that a source-preservation or non-output guard
assertion failed, keep it only when preserving that source state is part of the requested final
contract; otherwise focus assertions on the user-requested output before adding broad preservation
checks.

`SAC_UNIT_STATE_DRIFT` means the committed target state and the sidecar active applied state no
longer match. Treat it as a recovery branch and read the diagnostic before materializing or applying
again.

Read `references/sac-execution.md` only when apply, rollback, verify report, unit drift, or
assertion failure interpretation is unclear.

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

Read `references/versioning-and-handoff.md` only when status, commit/restore/reset, pull/sync,
hosted viewer, comments, or export handoff is the active question.

## Reference Routing

Open only the reference needed for the current fallback condition. Ordinary range read/write,
lookup, inspect, author, apply, verify, and export tasks should not require reading every reference
file.

- `references/evidence-tools.md`: open for unknown inspect params/include fields, custom inspect
  script shape, unsupported inspect diagnostics, or exact evidence surface selection.
- `references/sac-authoring.md`: open for unfamiliar migration/assertion imports, sidecar source
  layout, template selection, follow-up migrations, or a typecheck failure pointing at source.
- `references/sac-execution.md`: open for apply/rollback/verify report interpretation, unit drift,
  setup errors, assertion surface decisions, or target-state recovery.
- `references/versioning-and-handoff.md`: open for status cleanliness, commit/restore/reset,
  pull/sync, hosted viewer, comments, or export handoff details.
- `references/recipes.md`: open after you know the workflow and only need a copyable command shape.

If you already opened the relevant reference in the current task, reuse the rule or command shape
you read. Reopen a reference only when a new failure or missing detail is outside the already-read
section.

`inspect-tools/` is a managed-tool resource directory used by `univer inspect --tool`; do not treat
those files as generic scripts to run directly. `univer doctor collect` is for authorized bug reports
or Univer team support; explain why and ask before running it.
