# Command Surface

Use this before a mutation so the path stays small and verifiable.

## Command selection

| If the intent is... | Prefer | Why |
|---|---|---|
| inspect workbook shape, formulas, or a target range before deciding | `inspect workbook|sheet|range|formulas` | workbook-visible reconnaissance first |
| locate rows or cells that match a condition before editing | `search` | first-class hit discovery |
| extend an existing formula, series, or filled pattern | `fill` | preserves workbook-native propagation behavior |
| move a bounded rectangle through shell tools and write it back | `pipe out` -> shell transform -> `pipe in` | explicit bulk data plane |
| start from a local workbook file | `import` | creates a `.univer` workbook package from the source file |
| export a handoff workbook to disk | `export` | explicit final artifact path |
| apply bounded workbook-native logic or formatting | `run` | default programmable workbook surface |
| none of the smaller surfaces fit cleanly | `run` | avoid forcing a bulk-data workflow onto workbook logic |

## Workbook lifecycle

- `univer new <univer-path> [--name <name>] [--json]`
- `univer import <input-path> <univer-path> [--name <name>] [--json]`
- `univer export <univer-path> <output-path> [--json]`

`new` is the public command for a brand-new workbook package. Do not use `create` as a top-level CLI command.

## Reconnaissance

- `univer inspect workbook <univer-path> [--json-summary]`
- `univer inspect sheet <univer-path> [--sheet <name>|<sheet-name>] [--json-summary]`
- `univer inspect range <univer-path> --range <sheet!A1:B2> [--json-summary]`
- `univer inspect formulas <univer-path> [--sheet <name>] [--range <sheet!A1:B2>] [--json-summary]`
- `univer inspect lint <univer-path> [--json-summary]`
- `univer search <univer-path> [--query <text>|<text>] [--format jsonl|ndjson|csv|tsv] [--to-stdout]`

Start with `inspect workbook` for unknown workbooks. Use `search` when target rows or cells are content-defined.

## Mutation

- `univer fill <univer-path> --sheet <name> --source-range <A1> --target-range <A1> [--json]`
- `univer fill <univer-path> --range <sheet!A1:B2> --value <value> [--json]`
- `univer pipe out <univer-path> --range <sheet!A1:B2> [--type displayValue|rawValue|formula] [--format csv|tsv|json] [--to-stdout] [--output <path>]`
- `univer pipe in <univer-path> --range <sheet!A1:B2> [--input-format json|csv|tsv] [--data-file <path>|--data-stdin|--data-json <json>] [--json]`
- `univer run <univer-path> (--code <script>|--file <path>|<path>|-) [--json-summary] [--json]`

Use `fill` for propagation, `pipe` for bounded rectangular data movement, and `run` for bounded workbook-local logic, structure, formatting, or formula orchestration.

## Verification defaults

- after `new` or `import`: `univer inspect workbook <univer-path>`
- after formula work: `univer inspect formulas <univer-path> --range <sheet!A1:B2>`
- after rectangular writeback: inspect the header row, first sample rows, and key columns
- before handoff: inspect the source workbook, export, check the output file exists, then re-import or inspect the handoff path when needed
