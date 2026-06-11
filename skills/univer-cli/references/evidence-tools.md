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

Use a custom script when managed tools cannot answer a bounded readonly evidence question:

```bash
univer inspect "$WB" --script "$SIDECAR/inspect-scripts/probe.js" --params ./probe.params.json
```

Keep custom probes:

- readonly
- small and task-local
- parameterized through JSON params
- explicit about target path, `localUnitId`, sheet names, and ranges
- JSON-oriented when another command or agent will consume the output

Do not use inspect scripts for durable workbook changes. If a custom probe becomes generally useful,
consider promoting it to a managed inspect tool in a separate product change.
