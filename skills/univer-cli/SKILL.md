---
name: univer-cli
description: "Use when working with `.univer` targets, Univer CLI commands, worktrees, SaC sidecars, managed inspect tools, migration packs, spreadsheet formulas/formatting/charts, preview, worktree merge, import/export, or Excel-compatible handoff."
---

# Univer CLI

`univer` is a terminal-native univerfile engine. Use this skill to choose the public CLI and SaC
surfaces for target evidence, durable `.univer` changes, verification, preview, worktree review, and
handoff. Use `univer help` and `univer help <command...>` for exact command syntax.

## Core Model

Treat target-visible unit state as the source of truth. Command success, metadata, local notes, or
generated source do not prove that sheets, values, formulas, formatting, charts, resources, or
handoff files are correct.

A `.univer` path is the univerfile you work on: the authoritative store for that file's units. Pick
one explicit path such as `./Budget.univer` and pass it to commands, including `status`. Do not
target work by `sessionId`, runtime id, display name, sheet name, or the current directory.

Each univerfile has two scopes. `trunk` is the authoritative mainline a person sees and may edit. A
`worktree` is an isolated copy where agents do work so it can be reviewed before it touches trunk.
Scope commands — the reads (`inspect`, `status`, `export`, `open`, `screenshot`) and the SaC write
path (`apply`, `rollback`, `verify`, `materialize`) — require `--worktree <id>` to name the worktree.
`new` creates on trunk and takes no `--worktree`, and `worktree add`/`list` act on the whole
univerfile. Scope is stateless: there is no "current worktree" checkout, so `--worktree <id>` is
mandatory on every scope command and parallel agents never cross scopes. A worktree changes only
through SaC; its work reaches trunk only through `worktree merge`.

Typical loop: do the user's task on a worktree, mark it ready with `worktree ready`, then `open` it
to give the user a viewer link. The user reviews and chooses to merge or discard — from that viewer
page or via `worktree merge` / `worktree discard`. Merging into trunk is normally the user's
decision, not an automatic agent step.

Before acting on a follow-up, re-check with `worktree list`, because the user may have merged,
discarded, or only reviewed in the browser. If its `status` is still `draft`/`ready` and the message
refines the same change, keep working there — more SaC returns a `ready` worktree to the `draft`
status; when done, mark it `ready` and hand off a fresh link with `univer open`. Use a new worktree for a
merged or discarded one, or for a separate task.

A `.univer` file holds top-level units; `unitId` identifies a unit inside it. Sheet names, A1
ranges, values, formulas, styles, tables, filters, charts, shapes, and images are coordinates or
resources inside a selected unit.

Use public surfaces for reads and writes. A `.univer` univerfile is not an agent-handwritten source
file; do not bypass the CLI/SaC surfaces to patch it by hand.

## Per-Unit References

Before authoring any read, write, or assertion on a unit — including creating one that does not
exist yet — read its `references/unit-<type>.md` first; it owns that unit's cell/shape model,
value-surface rules, and creation recipe. Skipping it can produce silently wrong output: there is no
command error, a self-authored `sac verify` may still pass, and for a `slide` unit some defects
(default styles, text color, layout overflow) have no assertion coverage at all — a rendered
`screenshot` is the only surface that catches them. For a `sheet` unit, read
`references/unit-sheet.md`; for a `slide` unit, read `references/unit-slide.md`. (`base` and `doc`
per-unit files do not exist yet.)

## Public Surfaces

| Need | Use |
| --- | --- |
| Create or import univerfiles | `new` (trunk), `import` |
| Isolate work for review | `worktree add`, then work under a required `--worktree <id>` |
| Read target evidence | task-local route contract when present; otherwise focused managed `inspect --tool`; custom readonly `inspect --script` only for bounded aggregation/comparison gaps |
| Make durable changes | `sac materialize`, `sac migration create`, source edits, `sac apply`, `sac verify` |
| Recover an applied SaC boundary | `sac rollback` |
| Check scope state | `status` |
| Land or drop a worktree | `worktree ready`, `worktree merge`, `worktree discard` |
| Review or hand off visually | `open`, `view comments`, browser tools |
| Self-check visual-only defects (fill, stroke, text color, overflow) | `screenshot` — renders the worktree/trunk unit to PNG; required before treating a `slide` styling task as done |
| Produce Excel-compatible output | `export` after verifying the relevant target-visible state |

## Tool Loop Budget

Prefer one reusable evidence artifact over repeated equivalent commands. After `units`,
`sheet-overview`, `sheet-range --out`, materialize, or verify writes an artifact path, read that
artifact with bounded `jq`/`sed` before rerunning the same discovery command. Refresh evidence only
after target state changes such as `sac apply`, rollback, restore, reset, import/export roundtrip,
or an explicitly new range/sheet question.

Do not begin common range read/write/format/assertion tasks by searching when the needed command or
API pattern is already known. Use the discovery tools (below) and reference files as a bounded
fallback for one diagnostic-driven gap such as a missing API, unknown helper, argument shape, or
unresolved symbol — then author or verify. Read a declaration or reference file only when a new
failure, unfamiliar command surface, or missing API detail names that specific gap.

For large-table or cross-range facts, prefer one reusable managed artifact plus bounded shell reads
first. Use a custom readonly inspect script only after that artifact cannot answer a concrete
aggregation/comparison question without repeated broad reads. One sidecar-local probe should return
compact facts such as counts, grouped totals, mismatches, candidate ranges, and head/tail samples.
Do not use a custom probe to mutate workbook state, read `.univer` internals, encode out-of-band
correctness data or external expected answers, or write durable migration/assertion source.

## API Reference, Lookup, and Assertions

Two discovery tools exist. This section states what each does and when it applies; it does not rank
them or tell you which to reach for first.

**`univer api find` / `univer api show`** — a zero-backend static reference over the SDK Facade and
the SaC assertion builders. Both are **variadic**: pass several terms/symbols in one call and it
returns a block per argument, so you resolve a whole set of symbols in a single command instead of
one call each. `api find <term> [<term>…]` searches method names, interface/type fields, and enum
members (substring + tokenized matching). `api show <Symbol> [<Symbol>…]` prints each symbol's exact
definition: a method signature with the types in it expanded plus an `@example`, an interface's
fields with its inheritance chain, or an enum's members. Output is self-contained text. It answers
"what is this symbol / what's its exact shape".

```bash
univer api find shape textbox gradient      # each term searched independently, one call; --unit sheet|slide|doc limits to a unit kind
univer api show FSlide FShapeBuilder FPresentation   # batch several symbols in one call (not one at a time)
univer api show FRange.setValues ICellData CellValueType  # a method plus the types in its signature together
univer api show AssertionRangeBuilder       # all methods of the assertion range builder
```

**`univer lookup "<task>"`** — CLI-owned task recipes. For a common task it returns a mini-recipe of
what to do, the pitfalls, and a stop condition. It searches recipes, not individual symbols and not
workbook-visible facts (those stay in managed `univer inspect` tools). Text output has `Query`,
`Mode`, and optional `Suggested queries`; on `Mode: decompose` it lists shorter primitive queries.
Do not pass `--json`. It answers "how is this kind of task usually done".

```bash
univer lookup "range read"
univer lookup "range write"
univer lookup "range clear"
```

### Assertions

Assertion sources are authored with `defineAssertions` from `univer:sac/assertions`. It hands you
per-unit entry helpers — destructure the ones you need; inside a unit, `range(...)` / `sheet(...)`
carry the assertion methods:

```ts
import { defineAssertions } from "univer:sac/assertions";
export default defineAssertions(({ sheetUnit, baseUnit, slideUnit, docUnit, target, facts }) => {
  sheetUnit("<sheet-unitId>", ({ sheet, range }) => {
    range("Summary!A1:B2").values([[1, 2]]);
  });
});
```

The builder method surfaces are `AssertionRangeBuilder` / `AssertionSheetBuilder` (sheet unit),
`AssertionBaseTableBuilder` (base), `AssertionSlideShapeBuilder` (slide), and the doc builders;
`api show <Builder>` lists their methods. `references/sac-authoring.md` has full import names and
copyable examples.

## Task-Local Route Contracts

Some harnesses or task workspaces provide a local route contract, classifier, first-tool policy,
fallback gates, or hard stops. Treat that task-local contract as the route owner. This skill supplies
reusable Univer CLI surfaces, product invariants, and diagnostic fallback guidance; do not turn it
into an additional route checklist to satisfy alongside the task-local contract.

When no task-local route owner exists, choose the least expensive product evidence for the unknown
fact:

- Small bounded edits should start with unit/sheet discovery and one focused target-visible read.
- Large table, grouped, dedupe, aggregate, matching, summary, or cross-range transforms may use
  materialized source, migration source, TSV/table previews, or sidecar docs to form a bounded
  hypothesis, but those sources are not target truth.
- Rich text, merge, semantic style, conditional format, active sheet, unsupported include, or similar
  capability ambiguity should use one focused target evidence read and one capability/API check, then
  choose a supported representation or report the gap.
- API discovery belongs after typecheck, apply, verify, or command diagnostics name a missing method,
  unknown helper, argument shape, overload, enum, assertion helper shape, or unfamiliar command
  surface.

For large transforms, use source evidence only to answer a bounded question that would otherwise
require broad target reads or repeated artifact probing. Confirm decision-relevant facts with
target-visible evidence before handoff. Do not use row count alone to trigger custom scripts. If one
managed artifact plus bounded shell reads still leaves a concrete aggregation/comparison gap, write
one readonly sidecar-local custom inspect aggregation script before another broad managed range read.
Return compact JSON facts such as source shape, target shape, operation type, candidate count,
output count, write range, head/tail samples, preservation samples, and assertion plan.

First-pass assertions should prioritize the requested output cells/ranges. Add at
most one or two preservation invariants directly tied to the mutation risk. Keep source rationale,
active sheet, broad style preservation, and non-output facts as readback notes unless the task
explicitly requires them.

## Evidence Tools

Managed inspect tools are the preferred readonly evidence surface. A unit-scoped `inspect` reads the
worktree named by the required `--worktree <id>`; the `inspect tools` registry commands take no
scope. Use them for target inventory, sheet names, used ranges, focused range readback,
search/neighborhood confirmation, formulas, display/logical value differences, number formats, and
stable style traits. Avoid broad managed range dumps as first discovery for small bounded edits, and
switch to custom aggregation before repeated broad reads for large transforms. Discover units before
unit-scoped reads, and resolve tool params when a tool shape is unclear:

```bash
UNIVERFILE=./Budget.univer
univer inspect tools list --json
univer inspect tools resolve sheet-range --json
printf '%s' '{}' > ./units.params.json
univer inspect "$UNIVERFILE" --tool units --worktree "$WORKTREE_ID" --params ./units.params.json --out ./units.result.json
printf '%s' '{"unitId":"...","sheetName":"<discovered-sheet-name>","rangeA1":"A1:D20"}' \
  > ./range.params.json
univer inspect "$UNIVERFILE" --tool sheet-range --worktree "$WORKTREE_ID" --params ./range.params.json --out ./range.result.json
```

Do not assume a default sheet name such as `Sheet1`. Read the actual sheet names from `units` or
`sheet-overview` first, then copy the exact returned name in `sheetName`, `getSheetByName(...)`,
and assertion `range()` targets. Sheet names are exact identifiers: do not title-case, lowercase,
trim internal spaces, translate, or otherwise normalize them. If an inspect diagnostic includes a
`didYouMean` sheet name, rerun the same bounded evidence request with that exact name instead of
continuing to guess.

`--params` accepts either a real JSON file path or `-` for stdin. Prefer real params files when the
command will be reused. Do not pass `/dev/stdin`, inline JSON, or a missing temp path as the option
value; `--params '{}'` is interpreted as a file path named `{}`.

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

Use the evidence ladder selected by the task-local route contract when one exists. Without a local
route owner, small bounded edits usually start
`units -> focused sheet-overview or sheet-search -> focused sheet-range slim -> exact include`.
Large transforms may start with materialized source or TSV orientation, then must confirm with
target-visible custom aggregation or focused managed inspect. Escalate to exact include fields only
for named ambiguities or assertion contracts that depend on display strings, formulas, formats,
styles, or cell model details. Use `sheet-formulas` for formula audits and
`sheet-conditional-formats` for conditional formatting rule resources.

For large tables, do not use `sheet-range` as a table dump. Use source orientation plus
overview/search only to bound the question, then obtain concise source/target facts such as counts,
grouped totals, dedupe facts, mismatches, expected/current shape comparisons, head/tail samples, or
cross-range alignment. If one managed artifact plus bounded shell reads cannot answer that same
bounded aggregation/comparison question, write one small sidecar-local custom inspect script that
returns compact JSON facts instead of dumping every source row or running multiple `sheet-range`
plus `jq` slices. Do not use custom scripts as a universal first step or to replace simple unit,
sheet, search, one-cell, or small-range confirmation reads. Keep the script under the target sidecar
`inspect-scripts/` directory, not under a generic work directory, pass variables through params JSON,
and keep durable workbook changes in SaC migration source.

Handle recoverable inspect diagnostics by narrowing first. If `sheet-range` reports `maxCells`
exceeded, use `sheet-overview` or used-range evidence, then split into smaller target ranges; only
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

SaC is the source-backed authoring path for durable target behavior. SaC is the only write path:
every durable change goes through the migration pipeline (sidecar TS source, typecheck, pack,
apply), so there is no inline mutation command. `materialize` creates or refreshes the sidecar from
the committed worktree scope and returns `sidecarPath`; do not guess hidden paths. `migrations/`
holds Facade Migration Pack source, `types/` holds local API references,
`inspect-scripts/` holds scratch readonly probes, `runs/` holds verification reports, and
`archives/materialize/` is review-only history.

`pack.files` lists migration implementation entrypoints only. Keep global assertions under
`assertions/**/*.assertions.ts`; `univer sac verify` discovers them separately. Ordinary draft
packs include `migration.ts`; keep `pack.ts` as metadata and author target mutations in listed
entrypoint files.

`assertions/**/*.assertions.ts` entrypoints express the current file-level target-visible final-state
contract when correctness matters. Use `target` for unit inventory, typed unit helpers for
unit-scoped facts, and `facts` for shared business facts. `sheetUnit(unitId, ...)`,
`baseUnit(unitId, ...)`, `slideUnit(unitId, ...)`, and `docUnit(unitId, ...)`
require the explicit `unitId`. `unitId` is the only top-level assertion unit selector; do
not route assertions by unit name, sheet name, or implicit active workbook state.
Split entrypoints by unit or target concern, not by migration pack, and update them to the intended
final state as migrations change behavior.

SaC source imports generated ambient modules for migration packs and assertions. Facade method
signatures and assertion builders are available two ways: `api show <Symbol>` / `api find <term>`
(self-contained, covers SDK Facade + assertion builders), and the full declarations in the sidecar
`types/*.d.ts`. For a direct sidecar read, scope it narrowly, e.g.
`rg "setFormula|class FRange" <sidecarPath>/types -g '*.d.ts'`, instead of broad reads of the
sidecar or CLI install. See `references/sac-authoring.md` for import names and copyable examples.

Migration templates are source scaffolds, not a DSL. Discover them with
`univer sac migration templates --json`, choose one only when its `useWhen` matches target-visible
evidence, then fill the generated ordinary SaC source from evidence. If no template fits, create an
ordinary migration pack.

If behavior changes after a pack has been applied, prefer a follow-up migration over editing
already-applied source into hash/applied-state drift.

Read `references/sac-authoring.md` only when migration/assertion imports, sidecar source layout,
templates, or typecheck failures require more detail.

## SaC Execution

SaC commands require `--worktree <id>` to act on a worktree. Author durable changes on a worktree so
review and merge stay isolated. Discard unwanted changes with `sac rollback` or `worktree discard`
before re-authoring; there is no separate commit/restore step.

- `sac apply` executes pending migration source into the worktree as one commit. Apply success is
  not proof that target-visible behavior is correct.
- `sac rollback` removes the latest worktree commit (LIFO). It is not arbitrary spreadsheet undo.
- `sac verify` checks file-level typed unit assertions against the worktree state after
  `sac apply`. It does not apply pending source. It returns a `reportPath`; read the report for
  scope-aware failure facts such as `scope`, `unitType`, `unitId`, assertion kind, target, expected
  value, actual value, participant actuals, first difference, and setup error code.

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

Applied SaC state is derived from the worktree commit log: each `apply` writes a commit tagged with
its pack id and source hash, applied packs are rebuilt from that log, and source-chain tampering is
caught by hash. `SAC_UNIT_STATE_DRIFT` means the committed scope state and the sidecar active applied
state no longer match. Treat it as a recovery branch and read the diagnostic before materializing or
applying again.

Read `references/sac-execution.md` only when apply, rollback, verify report, unit drift, or
assertion failure interpretation is unclear.

## Worktrees, Preview, And Handoff

Use `worktree add` to make an isolated copy, then work under its id as the required
`--worktree <id>` on reads and the SaC write path. Use `worktree list` to see each worktree's id,
status, head commit, and name. Use `status` to check a worktree's lifecycle and commit count before
SaC commands; `status` always requires the actual `.univer` file and is not a current-directory,
viewer, git, or sheet-name status command.

When the task is done, mark the worktree ready with `worktree ready` and `open` it to hand the user a
viewer link (see below). The user reviews and then merges or discards — from that page or via
`worktree merge` / `worktree discard`. `merge` is the only path that reaches trunk and the only place
OT runs; on conflict it aborts and leaves trunk unchanged. `worktree discard` drops a worktree
without affecting trunk. There is no local `commit`, `restore`, `reset`, `pull`, or `sync`: the
univerfile is the authority, `sac apply` produces commits, and `sac rollback` or `worktree discard`
undo them.

For visual review, prefer hosted viewer handoff only when you have a browser-fetchable HTTP(S)
`.univer` source URL. A local `.univer` path with `univer open` resolves instead to its trunk/worktree
viewer room. If `file.univer.ai` is unreachable, `univer open <source-url> --local --json` starts a
foreground localhost viewer asset server; it does not host, proxy, upload, or cache a local `.univer`
file. In headless, CI, server, or user-requested no-browser environments, visual preview is optional
unless a browser-capable tool or explicit handoff exists.

Use `univer export` for Excel-compatible handoff after verifying the target-visible state that matters.

Read `references/worktrees-and-handoff.md` only when worktree lifecycle, scope-aware status, hosted
viewer, comments, merge/discard, or export handoff is the active question.

## Reference Routing

Open only the reference needed for the current fallback condition. Ordinary range read/write,
lookup, inspect, author, apply, verify, and export tasks should not require reading every reference
file.

References are organized along two orthogonal dimensions. Workflow-phase references stay
unit-agnostic; per-unit references under `references/unit-<unit>.md` own unit-specific tool roles,
value surfaces, read/write patterns, and recipes. Open the workflow-phase reference for the current
fallback condition, and the per-unit reference that matches the target unit type.

By workflow phase:

- `references/evidence-tools.md`: open for unknown inspect params/include fields, custom inspect
  script shape, unsupported inspect diagnostics, or exact evidence surface selection.
- `references/sac-authoring.md`: open for unfamiliar migration/assertion imports, sidecar source
  layout, template selection, follow-up migrations, or a typecheck failure pointing at source.
- `references/sac-execution.md`: open for apply/rollback/verify report interpretation, unit drift,
  setup errors, assertion surface decisions, or target-state recovery.
- `references/worktrees-and-handoff.md`: open for worktree lifecycle (add/list/ready/merge/discard),
  scope-aware status, hosted open, comments, conflict handoff, or export details.
- `references/recipes.md`: open after you know the workflow and only need a copyable command shape
  that has been checked against current CLI behavior.

By target unit type:

- `references/unit-sheet.md`: open for `sheet`-unit managed tool roles, cell value surfaces
  (logical/display/storage), exact sheet-name rules, inspect-diagnostic recovery, the sheet API
  pocket guide, and sheet range/label/conditional-format/aggregation recipes.
- `references/unit-slide.md`: open for `slide`-unit managed tool roles and their evidence gap, the
  shape/text Facade pocket guide (default styles, fill/stroke/text-color overrides, `setText`
  geometry reset, alignment injection), which assertion methods cover which facts, and the
  `screenshot` self-check recipe.
- `base` and `doc` units do not yet have a `references/unit-<unit>.md` file; per-unit guidance for
  them is reserved for a later version.

If you already opened the relevant reference in the current task, reuse the rule or command shape
you read. Reopen a reference only when a new failure or missing detail is outside the already-read
section.

`inspect-tools/` is a managed-tool resource directory used by `univer inspect --tool`; do not treat
those files as generic scripts to run directly. `univer doctor collect` is for authorized bug reports
or Univer team support; explain why and ask before running it.
