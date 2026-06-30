# Evidence Tools

Use evidence tools to understand target-visible state before deciding coordinates, ranges,
formulas, styles, resources, or handoff readiness. Evidence tools do not make durable target
changes. Examples use `UNIVERFILE=./orders.univer` as a shell variable for the target path; set it
in the same shell or replace `$UNIVERFILE` with the literal `.univer` path.

## SaC Baseline Orientation

For SaC workspaces that already have a materialized baseline, take a short baseline-oriented
hypothesis pass before large managed inspect reads. Read source surfaces that already exist in the
sidecar: materialized baseline source, migration pack source, TSV/table previews, and sidecar docs.
Use that pass to identify likely sheet names, used regions, data blocks, formulas, formats, copied
labels, preservation boundaries, source ranges, and target ranges.

This pass should produce a compact target-evidence question: what current workbook fact would
confirm or reject the hypothesis, which read path will answer it, and what fact is enough to stop
reading. If source evidence is missing, stale, or does not identify the target inventory, state that
bounded reason and fall back to the smallest target-visible read that can recover the missing
orientation.

Treat baseline source, migration source, and TSV/table previews as orientation evidence, not target
confirmation. They can help you decide where to inspect, but they do not prove current
target-visible state, applied ledger state, exact storage types, formula recalculation, formatting,
styles, hidden rows, merged cells, rich text, or export readiness. When those details matter, return
to managed inspect tools, assertions, verify reports, or bounded export checks.

## Managed Inspect Tools

Use managed tools to confirm target-visible facts. Their best role after baseline orientation is
focused confirmation: target inventory, sheet names, used ranges, small range readback, text search,
neighborhood context, formulas, display/logical value differences, number formats, and stable style
traits.

Do not make a broad managed range dump the default first discovery step when source evidence can
first bound the question. If source evidence is unavailable or target inventory is genuinely
unknown, start with the smallest inventory/overview/search read that resolves that blocker.

```bash
UNIVERFILE=./orders.univer

univer inspect tools list
univer inspect tools list --json --all-candidates  # machine-readable resolver diagnostics only
univer inspect tools resolve sheet-overview
```

Pass params as either a JSON file path or one JSON object on stdin:

```bash
cat > ./overview.params.json <<'JSON'
{
  "unitId": "replace-with-unitId"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-overview --worktree "$WORKTREE_ID" --params ./overview.params.json --out ./overview.result.json

printf '%s' '{"unitId":"replace-with-unitId"}' \
  | univer inspect "$UNIVERFILE" --tool sheet-overview --worktree "$WORKTREE_ID" --params -
```

Do not pass inline JSON as the `--params` value. `--params '{}'` is interpreted as a params file
path named `{}`. Use `--params -` and stdin for inline JSON, or write the JSON to a file and pass
that file path.

Per-unit managed tool roles, value-field semantics, and inspect-diagnostic recovery live in `unit-<unit>.md`. For `sheet` units (tool roles, cell `value`/`displayValue`/`cellData` semantics, exact sheet-name rules, and `maxCells`/`include`/style recovery), see `unit-sheet.md`.

## Custom Inspect Scripts

Use a custom script when managed tools cannot answer one bounded readonly aggregation or comparison
question without repeated broad reads. Before writing migration source for large-table aggregate,
rebuild, split, or reconciliation tasks, prefer a custom summary probe over repeated `sheet-range`
calls when the useful evidence is an aggregate rather than the full grid: grouped totals, counts,
dedupe facts, missing labels, mismatches, formula coverage, expected/current shape comparison,
cross-range alignment, or head/tail samples. A managed overview that only reports used ranges and
bounded samples is not a substitute for source-derived aggregate facts. The summary probe should
replace full source-table
dumps for that same evidence question; do not also dump the same large source tables unless exact
row-level evidence is needed for a named ambiguity. A second broad `sheet-range`, repeated `jq`
slice, or expanded range read for the same large-table/cross-range question is the stop point for
switching to one readonly aggregation probe.

Design each custom aggregation around the next authoring or verification decision:

- return candidate ranges and dimensions before deciding write scope
- return counts or grouped totals before deciding whether a transformation covers all source rows
- return mismatch count plus the first few diffs before deciding whether to revise source or
  assertion
- return head/tail samples and truncation notes when omitting rows from a large range
- return `ok: false` with field diagnostics when params, sheet names, or range assumptions are
  wrong

```bash
printf '%s' '{"reason":"bounded-readonly-evidence","sampleLimit":5}' \
  > ./probe.params.json
univer inspect "$UNIVERFILE" --script "$SIDECAR/inspect-scripts/probe.js" --worktree "$WORKTREE_ID" --params ./probe.params.json --out ./probe.result.json
```

Keep custom probes:

- readonly
- small and task-local
- parameterized through JSON params for variable targets such as `unitId`, sheet names, ranges,
  labels, and thresholds
- focused on the sheets, ranges, and columns needed for the question
- concise in output, returning facts such as `count`, `total`, `mismatches`, `head`, and `tail`
- concise on failure: if extraction or matching fails, return `ok: false`, totals such as
  `unknownCount`/`mismatchCount`, field diagnostics, and bounded samples rather than dumping every
  unknown row
- JSON-oriented when another command or agent will consume the output

Do not use inspect scripts for durable target changes, source edits, out-of-band correctness data, or
`.univer` internals. Do not use them as a universal first step, or to replace simple unit
inventory, sheet identity, search, one-cell, small-range, formula, or format confirmation that
managed tools already answer directly. If the same aggregation becomes generally useful across
unrelated workbooks, propose a managed inspect tool separately instead of growing task-local probes
into product logic.
