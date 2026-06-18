# Managed Inspect Tools

This legacy directory previously contained CLI-managed readonly evidence tool implementations for the target `.univer` file.
Official managed tools are now installed product capabilities executed by tool id. If a managed tool cannot answer the question, use a bounded scratch probe under `inspect-scripts/`.

Run official managed tools through the public inspect runner:

```bash
univer inspect <file.univer> --tool <tool-id> --params <params.json|->
```

Use `--md` when evidence is easier to scan as Markdown. Use default JSON or `--json` for programmatic parsing.

## Suggested Routing

| Evidence need | Prefer | Why |
| --- | --- | --- |
| Discover local unit ids and unit types | `units` | First step when `localUnitId` is unknown. |
| Understand sheet names, used ranges, samples, or candidate regions | `sheet-overview` | Gives bounded shape evidence before choosing exact ranges. |
| Locate visible text, labels, keys, or values | `sheet-search` | Returns sheet/A1 coordinates and optional neighborhood evidence. |
| Expand around a known anchor cell or range | `sheet-neighborhood` | Adds nearby labels, headers, totals, and context. |
| Read a known rectangle | `sheet-range` | Returns slim cell facts by default and exact fields on request. |
| Inspect conditional formatting rules | `sheet-conditional-formats` | Returns rule facts, target ranges, conditions, and style config without claiming final rendered styles. |
| Audit or locate formulas | `sheet-formulas` | Lists formula cells and optional neighboring labels. |

These are preferences, not hard rules. Use the smallest tool that answers the evidence question, keep ranges bounded, and combine tools when that makes the workbook reasoning clearer.

## Reading Output

- Use default slim cell facts for ordinary labels, copied text, matching, grouping, and write planning.
- Request exact fields such as `displayValues`, `values`, `cellData`, `formulas`, `numberFormats`, `semanticStyles`, or `valueDetails` only when the task depends on exact display, model, formula, format, style, or value distinctions.
- Treat `regions` as candidate non-empty rectangles, not semantic classifications.
- Treat neighbor labels as hints; inspect the relevant range before durable edits.
- Inspect evidence supports planning and debugging. Durable completion evidence still comes from SaC source and `univer sac verify` assertions.

## Params

Use `univer inspect tools list --json` for effective tool ids and `univer inspect tools resolve <tool-id> --json` for each tool's required params, suggested use cases, example params, output hints, provider, and compatibility state. Use `univer inspect tools list --json --all-candidates` only for resolver diagnostics.
