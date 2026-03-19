# Command Selection Matrix

Use this matrix to choose the smallest canonical path before reaching for JS.

| Task shape | First choice | Upgrade path | Notes |
|---|---|---|---|
| initialize workspace | `init [<path>]` | none | only when no workspace exists yet at the intended root |
| inspect existing entries | `file list --json` | `file info --entry-id <id>` | use before guessing a target |
| fresh local workbook | `file create <name>` | `sheet rename` for domain sheet | prefer positional workbook name |
| local spreadsheet bootstrap | `file import <path>` | `file info --entry-id <id>` | `xlsx` / `csv` entry path, but runtime converter must be available |
| workbook topology scan | `inspect workbook` | `inspect sheet` | start here for unknown workbooks |
| range/profile inspection | `inspect range` | `inspect formulas` / `inspect lint` | use before risky writes |
| bounded rectangular extract | `read range` | `--type rawValue --to-stdout` or `--to-file` when exact machine values matter | choose output mode by consumer; stream/file output already uses real workbook data shape |
| search-driven lookup | `read search` | scope flags + stream format, add `--type rawValue` when exact values matter | prefer scope flags over post-filter hacks |
| sparse patch | `write cells` | `write range` | best for explicit cell map updates |
| anchored rectangular write | `write range` | staged writes | best for payload-shaped range writeback |
| review-sheet replacement | `write table --sheet <name>` | `write range` | high impact; verify carefully |
| fill / propagation | `write fill` | staged commands | keep target explicitly bounded |
| sheet lifecycle | `sheet create|rename|copy|delete` | chain with readback | do not script simple lifecycle |
| styling / presentation / freeze / merge-unmerge | `script js` | productize later | use when canonical commands do not expose the needed workbook-native API |
| canonical gap | `script js` | productize later | requires explicit rationale and boundary |

## Selection rules

1. Resolve workspace and entry context before choosing a mutation primitive.
2. Reuse an existing workspace when the current tree already belongs to one; do not re-run `init` inside that tree.
3. Prefer canonical commands over `script js` for data and structure changes.
4. Use `script js` for presentation-only changes only when you can state the exact workbook boundary.
5. Split dependent mutations into short steps with verification between them.
6. Use `read search` when the location is unknown; do not emulate search with wide reads unless necessary.
7. Match output mode to the next consumer instead of defaulting to inline dumps.
8. Every data-visible write path needs canonical readback verification; presentation-only changes need an explicit execution summary when CLI cannot inspect them.

## File-boundary reminders

- commands other than `init` must not create a workspace
- if a workspace already exists in the current tree, business commands should reuse it instead of re-initializing
- `file export` produces local artifacts from the current local workbook entry
- local import and local export use runtime converter resolution and may fail fast if runtime is not ready
- local export rejects snapshots larger than `100MB`; stop and report the blocker honestly
