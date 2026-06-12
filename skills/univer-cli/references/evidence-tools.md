# Evidence Tools

Use evidence tools to understand workbook-visible state before deciding coordinates, ranges,
formulas, styles, resources, or handoff readiness. Evidence tools do not make durable workbook
changes.

## Managed Inspect Tools

Start with managed tools:

```bash
univer inspect tools list --json
univer inspect tools resolve sheet-overview --json
univer inspect "$WB" --tool sheet-overview --params ./overview.params.json
```

Use `--params <file>` when params should be reviewed, reused, or referenced later. Use
`--params -` for a one-off JSON object:

```bash
printf '%s' '{"localUnitId":"replace-with-localUnitId","sheetName":"Sheet1","rangeA1":"A1:D20"}' \
  | univer inspect "$WB" --tool sheet-range --params -
```

Tool roles:

| Tool | Use when |
| --- | --- |
| `units` | You need target unit inventory, `localUnitId`, type, name, capabilities, or remote binding metadata. |
| `sheet-overview` | You need sheet names, used ranges, bounded samples, formulas, warnings, or candidate non-empty regions. |
| `sheet-search` | You know visible text or values but not coordinates. |
| `sheet-neighborhood` | You have an anchor and need nearby headers, labels, totals, or context. |
| `sheet-range` | You know explicit sheet/range rectangles and need values, formulas, formats, styles, or typed facts. |
| `sheet-formulas` | You need to audit formula locations or formula text. |
| `sheet-conditional-formats` | You need conditional formatting rule resources and target ranges. |

Use normalized evidence by default for ordinary labels, copied text, grouping, matching, and write
planning. Request exact `rawValues`, `displayValues`, `cellData`, or value details only when the
task depends on exact storage text, display strings, rich cell model data, multi-line content, or
export/debug details.

`sheet-overview` regions are candidate non-empty rectangles. They are evidence for possible table
boundaries, footers, spacer columns, formulas, and blank tails; they are not final business
semantics.

## Custom Inspect Scripts

Use a custom script when managed tools cannot answer a bounded readonly evidence question. Before
writing migration source for large-table aggregate, rebuild, split, or reconciliation tasks, prefer
a custom summary probe over repeated `sheet-range` calls when the useful evidence is an aggregate
rather than the raw grid: grouped totals, counts, missing labels, mismatches, formula coverage, or
head/tail samples. A managed overview that only reports used ranges and bounded samples is not a
substitute for source-derived aggregate facts. The summary probe should replace full source-table
dumps for that same evidence question; do not also dump the same large source tables unless exact
row-level evidence is needed for a named ambiguity.

```bash
univer inspect "$WB" --script "$SIDECAR/inspect-scripts/probe.js" --params ./probe.params.json
```

Keep custom probes:

- readonly
- small and task-local
- parameterized through JSON params for variable targets such as `localUnitId`, sheet names, ranges,
  labels, and thresholds
- focused on the sheets, ranges, and columns needed for the question
- compact in output, returning facts such as `count`, `total`, `mismatches`, `head`, and `tail`
- JSON-oriented when another command or agent will consume the output

Do not use inspect scripts for durable workbook changes.
