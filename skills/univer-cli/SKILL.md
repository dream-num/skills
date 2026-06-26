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
Scope commands — the reads (`inspect`, `status`, `export`, `open`) and the SaC write path (`apply`,
`rollback`, `verify`, `materialize`) — require `--worktree <id>` to name the worktree. `new` creates
on trunk and takes no `--worktree`, and `worktree create`/`list` act on the whole univerfile. Scope
is stateless: there is no "current worktree" checkout, so `--worktree <id>` is mandatory on every
scope command and parallel agents never cross scopes. A worktree changes only through SaC; its work
reaches trunk only through `worktree merge`.

Typical loop: do the user's task on a worktree, mark it ready with `worktree ready`, then `open` it
to give the user a viewer link. The user reviews and chooses to merge or discard — from that viewer
page or via `worktree merge` / `worktree discard`. Merging into trunk is normally the user's
decision, not an automatic agent step.

A `.univer` file holds top-level units; `localUnitId` identifies a unit inside it. Sheet names, A1
ranges, values, formulas, styles, tables, filters, charts, shapes, and images are coordinates or
resources inside a selected unit.

Use public surfaces for reads and writes. A `.univer` univerfile is not an agent-handwritten source
file; do not bypass the CLI/SaC surfaces to patch it by hand.

## Public Surfaces

| Need | Use |
| --- | --- |
| Create or import univerfiles | `new` (trunk), `import` |
| Isolate work for review | `worktree create`, then work under a required `--worktree <id>` |
| Read target evidence | managed `inspect --tool` first; custom readonly `inspect --script` only for bounded gaps |
| Make durable changes | `sac materialize`, `sac migration create`, source edits, `sac apply`, `sac verify` |
| Recover an applied SaC boundary | `sac rollback` |
| Check scope state | `status` |
| Land or drop a worktree | `worktree ready`, `worktree merge`, `worktree discard` |
| Review or hand off visually | `open`, `view comments`, browser tools |
| Produce Excel-compatible output | `export` after verifying the relevant target-visible state |

## Evidence Tools

Managed inspect tools are the preferred readonly evidence surface. A unit-scoped `inspect` reads the
worktree named by the required `--worktree <id>`; the `inspect tools` registry commands take no
scope. Discover units before unit-scoped reads, and resolve tool params when a tool shape is unclear:

```bash
UNIVERFILE=./Budget.univer
univer inspect tools list --json
univer inspect tools resolve sheet-range --json
printf '%s' '{}' | univer inspect "$UNIVERFILE" --tool units --worktree "$WORKTREE_ID" --params -
printf '%s' '{"localUnitId":"...","sheetName":"<discovered-sheet-name>","rangeA1":"A1:D20"}' \
  | univer inspect "$UNIVERFILE" --tool sheet-range --worktree "$WORKTREE_ID" --params -
```

Do not assume a default sheet name such as `Sheet1`. Read the actual sheet names from `units` or
`sheet-overview` first, then use the exact returned name in `sheetName` and in assertion `range()`
targets.

`--params` accepts either a real JSON file path or `-` for stdin. Do not pass inline JSON as the
option value; `--params '{}'` is interpreted as a file path named `{}`.

Default managed inspect output is slim JSON evidence. For review, add `--md` to render the same
evidence as Markdown; Markdown is an agent-readable view, not a roundtrip machine format. Use
default JSON or `--json` for programmatic parsing and ambiguity checks.

In slim cell facts and value details, `value` uses `cellData.v`/raw readback for typed cell content
and `valueType` prefers `cellData.t` when available; `displayValue` mirrors Facade
`getDisplayValues()`. Inspect tools do not synthesize `value` from display text or agent-oriented
normalization.

Use this evidence ladder by default: `units -> sheet-overview or sheet-search -> sheet-range slim -> exact include`. Escalate to exact include fields only for named ambiguities or assertion contracts that depend on display strings, formulas, formats, styles, or cell model details. Use `sheet-formulas` for formula audits and `sheet-conditional-formats` for conditional formatting rule resources.

For large tables, do not use `sheet-range` as a table dump. Use overview/search first, then obtain
concise source/target facts such as counts, grouped totals, mismatches, and head/tail samples. If
managed tools cannot answer that bounded readonly question, write a small sidecar-local custom
inspect script that returns those facts as JSON instead of dumping every source row.

When typed values, display strings, formulas, number formats, cell model details, or static style
traits affect the decision, request focused `sheet-range` fields such as `values`,
`displayValues`, `valueDetails`, `cellFacts`, `cellData`, `formulas`, `numberFormats`, or
`semanticStyles`. Use `sheet-conditional-formats` for conditional formatting rule resources;
combine it with value evidence when a value-dependent rule is part of the task.

For more detail, read `references/evidence-tools.md`.

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
unit-scoped facts, and `facts` for shared business facts. `sheetUnit(localUnitId, ...)`,
`baseUnit(localUnitId, ...)`, `slideUnit(localUnitId, ...)`, and `docUnit(localUnitId, ...)`
require the explicit `localUnitId`. `localUnitId` is the only top-level assertion unit selector; do
not route assertions by unit name, sheet name, or implicit active workbook state.
Split entrypoints by unit or target concern, not by migration pack, and update them to the intended
final state as migrations change behavior.

SaC source imports generated ambient modules for migration packs and assertions. Full Facade method
signatures live in the sidecar `types/*.d.ts`; scope lookups narrowly, e.g.
`rg "setFormula|class FRange" <sidecarPath>/types -g '*.d.ts'`, instead of broad reads of the
sidecar or CLI install. See `references/sac-authoring.md` for import names and copyable examples.

Migration templates are source scaffolds, not a DSL. Discover them with
`univer sac migration templates --json`, choose one only when its `useWhen` matches target-visible
evidence, then fill the generated ordinary SaC source from evidence. If no template fits, create an
ordinary migration pack.

If behavior changes after a pack has been applied, prefer a follow-up migration over editing
already-applied source into hash/applied-state drift.

For more detail, read `references/sac-authoring.md`.

## SaC Execution

SaC commands require `--worktree <id>` to act on a worktree. Author durable changes on a worktree so
review and merge stay isolated. Discard unwanted changes with `sac rollback` or `worktree discard`
before re-authoring; there is no separate commit/restore step.

- `sac apply` executes pending migration source into the worktree as one commit. Apply success is
  not proof that target-visible behavior is correct.
- `sac rollback` removes the latest worktree commit (LIFO). It is not arbitrary spreadsheet undo.
- `sac verify` checks file-level typed unit assertions against a sandbox copy of the worktree. It
  does not apply pending source. It returns a `reportPath`; read the report for scope-aware failure
  facts such as `scope`, `unitType`, `localUnitId`, assertion kind, target, expected value, actual
  value, participant actuals, first difference, and setup error code.

Missing global assertions are setup errors and are not completion evidence for changed durable
behavior. Treat failed assertions as a decision point: either the target final state is wrong, or
the assertion expectation is wrong. Treat legacy top-level `sheet()` or
`range()` usage, missing units, unit type mismatches, and unsupported readback surfaces as setup
repair, not final-state workbook mismatch.

Applied SaC state is derived from the worktree commit log: each `apply` writes a commit tagged with
its pack id and source hash, applied packs are rebuilt from that log, and source-chain tampering is
caught by hash. `SAC_UNIT_STATE_DRIFT` means the committed scope state and the sidecar active applied
state no longer match. Treat it as a recovery branch and read the diagnostic before materializing or
applying again.

For more detail, read `references/sac-execution.md`.

## Worktrees, Preview, And Handoff

Use `worktree create` to make an isolated copy, then work under its id as the required
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

For more detail, read `references/worktrees-and-handoff.md`.

## Reference Routing

Open only the reference needed for the current question:

- `references/evidence-tools.md`: managed inspect tools, custom inspect scripts, params, default
  slim evidence versus exact evidence.
- `references/sac-authoring.md`: materialize, sidecar structure, migration packs, templates,
  assertions, follow-up migrations.
- `references/sac-execution.md`: apply, rollback, verify, `runs/`, failure interpretation.
- `references/worktrees-and-handoff.md`: worktree lifecycle (create/list/ready/merge/discard),
  scope-aware status, hosted open, comments, export.
- `references/recipes.md`: copyable command shapes that have been checked against current CLI
  behavior.

`inspect-tools/` is a managed-tool resource directory used by `univer inspect --tool`; do not treat
those files as generic scripts to run directly. `univer doctor collect` is for authorized bug reports
or Univer team support; explain why and ask before running it.
