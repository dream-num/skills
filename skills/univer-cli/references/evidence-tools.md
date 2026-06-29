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

Tool roles:

| Tool | Use when |
| --- | --- |
| `units` | You need target unit inventory, `unitId`, type, name, or capabilities. |
| `sheet-overview` | You need sheet names, used ranges, bounded samples, formulas, warnings, or candidate non-empty regions. |
| `sheet-search` | You know visible text or values but not coordinates. |
| `sheet-neighborhood` | You have an anchor and need nearby headers, labels, totals, or context. |
| `sheet-range` | You know explicit bounded sheet/range rectangles and need default slim cell facts or exact values, formulas, formats, direct static style traits, or typed facts. |
| `sheet-formulas` | You need to audit formula locations or formula text. |
| `sheet-conditional-formats` | You need conditional formatting rule resources, their target ranges, and rule config. |

Use default slim evidence for ordinary labels, copied text, grouping, matching, and write
planning. For reusable or large evidence, pass `--out ./name.result.json`; stdout becomes a short
Agent Index Output and the full pretty JSON artifact can be reused with `jq` or bounded `sed`
without rerunning inspect. Use paired names such as `overview.params.json` and
`overview.result.json`. Without `--out`, stdout stays compact JSON. For review, add `--md` to
render the same evidence as Markdown; Markdown is an agent-readable view, not a JSON pointer codec
or roundtrip machine format. Request exact
`values`, `displayValues`, `cellData`, `valueDetails`, `richTextRuns`, `cellFacts`,
`numberFormats`, formulas, or `semanticStyles` only when the task depends on exact display strings,
typed values, formulas, formats, static style traits, rich text runs, rich cell model data,
multi-line content, or export/debug details. `semanticStyles` is for supported stable traits and
does not expose raw style ids.

Before rerunning an equivalent inspect command, check whether the existing `--out` artifact answers
the same sheet/range/evidence question. Reuse artifact paths and Agent Index Output read hints until
the target changes through `sac apply`, rollback, restore, reset, import/export roundtrip, or a new
range/sheet question. Do not treat an old artifact as current evidence after mutation.

For `sheet-range` and range-like cell facts, `value` uses `cellData.v`/raw readback for typed cell
content and `valueType` prefers `cellData.t` when available; `displayValue` mirrors Facade
`getDisplayValues()`. Inspect tools do not synthesize `value` from display text; request `cellData`
explicitly when the full cell model itself is the evidence.

Use `sheet-conditional-formats` when the question is whether conditional formatting rules exist,
where they apply, and what conditions/styles they encode. It does not prove every cell's final
rendered appearance; combine it with `sheet-range` value evidence when a rule's outcome depends on
cell values.

Sheet names are exact workbook identifiers. Copy them from `units`, `sheet-overview`, or a
managed-tool diagnostic exactly as returned. Do not title-case, lowercase, translate, trim internal
spacing, or replace punctuation. If a diagnostic reports `didYouMean`, rerun the same bounded
request with that exact sheet name; do not try another guessed spelling first.

`sheet-overview` regions are candidate non-empty rectangles. They are evidence for possible table
boundaries, footers, spacer columns, formulas, and blank tails; they are not final business
semantics.

Recover from managed inspect diagnostics by fixing the evidence request, not by dumping more data by
default:

- `maxCells` exceeded: use `sheet-overview` or used-range evidence first, then split the target into
  smaller `sheet-range` requests. Raise `maxCells` only when the task truly requires broad range
  evidence.
- unsupported `include`: choose one of the supported include fields listed by the diagnostic, or use
  a dedicated managed tool for that evidence surface.
- unsupported semantic style trait: choose a supported trait, request `semanticStyles`/`cellData`
  when those evidence fields answer the question, or use the managed style/resource tool. Do not
  inspect workbook internals as the recovery path.

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
