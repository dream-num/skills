# Command Selection Matrix

Use this before a mutation so the path stays small and verifiable.

| If the intent is... | Prefer | Why |
|---|---|---|
| inspect workbook shape or formulas before deciding | `inspect workbook|sheet|range|formulas` | reconnaissance is the first step |
| localize rows or cells before acting | `search` | first-class hit discovery |
| copy formulas or series from a known seed | `fill` | preserves workbook-native propagation behavior |
| move a bounded rectangle through shell tools | `pipe out` plus shell tools, then `pipe in` | explicit bulk data plane |
| import a source workbook and continue editing | `file import` | resolves a local entry first |
| export a final handoff file | `file export --output <path>` | explicit final path |
| perform bounded workbook-local logic or formatting | `run` | default programmable workbook surface |

## Fast heuristics

- if the task starts with uncertainty, start with `inspect`
- if the task starts with "find the rows/cells that match ...", start with `search`
- if the destination already has the right seed pattern, prefer `fill`
- if the plan depends on shell output, use `pipe out` and verify header, sample rows, and key columns before `pipe in`
- if the task starts with a local file, `file import` first and keep the returned `entryId`
- if none of the small surfaces fit cleanly, switch to `run`
