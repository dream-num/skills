# Evidence Tools

Use evidence tools to understand target-visible state before deciding coordinates, ranges,
formulas, styles, resources, or handoff readiness. Evidence tools do not make durable target
changes. Examples use `UNIVERFILE=./orders.univer` as a shell variable for the target path; set it
in the same shell or replace `$UNIVERFILE` with the literal `.univer` path.

## Managed Inspect Tools

Start with managed tools:

```bash
UNIVERFILE=./orders.univer

univer inspect tools list --json
univer inspect tools resolve sheet-overview --json
```

Pass params as either a JSON file path or one JSON object on stdin:

```bash
cat > ./overview.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-overview --params ./overview.params.json

printf '%s' '{"localUnitId":"replace-with-localUnitId"}' \
  | univer inspect "$UNIVERFILE" --tool sheet-overview --params -
```

Do not pass inline JSON as the `--params` value. `--params '{}'` is interpreted as a params file
path named `{}`. Use `--params -` and stdin for inline JSON, or write the JSON to a file and pass
that file path.

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
printf '%s' '{"reason":"bounded-readonly-evidence","sampleLimit":5}' \
  | univer inspect "$UNIVERFILE" --script "$SIDECAR/inspect-scripts/probe.js" --params -
```

Keep custom probes:

- readonly
- small and task-local
- parameterized through JSON params for variable targets such as `localUnitId`, sheet names, ranges,
  labels, and thresholds
- focused on the sheets, ranges, and columns needed for the question
- compact in output, returning facts such as `count`, `total`, `mismatches`, `head`, and `tail`
- fail-compact: if extraction or matching fails, return `ok: false`, totals such as
  `unknownCount`/`mismatchCount`, field diagnostics, and bounded samples rather than dumping every
  unknown row
- JSON-oriented when another command or agent will consume the output

Do not use inspect scripts for durable workbook changes.
