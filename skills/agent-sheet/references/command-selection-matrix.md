# Command Selection Matrix

Use this before writing so the mutation path stays small and verifiable.

| If the intent is... | Prefer | Why |
|---|---|---|
| change a few known cells | `write cells` | smallest possible surface |
| replace an explicit bounded rectangle | `write range` | rectangle is the contract |
| replace or create a review table starting at `A1` | `write table` | table semantics and header row are the contract |
| copy formulas or series from a known seed | `write fill` | preserves workbook-native propagation behavior |
| create, rename, copy, or delete sheets | `sheet ...` | sheet lifecycle is first-class |
| inspect structure or formulas before deciding | `inspect workbook|sheet|range` | reduces accidental broad writes |
| build a shell pipeline from workbook data | `read range --to-stdout` plus shell tools | keeps workbook read path on `agent-sheet` |
| import a source workbook and continue editing | `file import` | resolves a local entry first |
| export a final handoff file | `file export --output <path>` | explicit final path |
| change formatting or a missing workbook-native behavior | `script js` | fallback only when built-ins do not express it cleanly |

## Fast heuristics

- if the destination is conceptually a whole sheet table, prefer `write table`
- if the destination is conceptually a coordinate-bounded rectangle, prefer `write range`
- if the plan depends on shell output, add verification for header, sample rows, and key columns
- if the task starts with a local file, `file import` first and keep the returned `entryId`
