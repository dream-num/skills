# Command Selection Matrix

Use this before a mutation so the path stays small and verifiable.

| If the intent is... | Prefer | Why |
|---|---|---|
| inspect workbook shape, formulas, or a target range before deciding | `inspect workbook|sheet|range|formulas` | workbook-visible reconnaissance first |
| locate rows or cells that match a condition before editing | `search` | first-class hit discovery |
| extend an existing formula, series, or filled pattern | `fill` | preserves workbook-native propagation behavior |
| move a bounded rectangle through shell tools and write it back | `pipe out` -> shell transform -> `pipe in` | explicit bulk data plane |
| start from a local workbook file | `file import` | creates a local entry and returns the working handle |
| export a handoff workbook to disk | `file export --output <path>` | explicit final artifact path |
| apply bounded workbook-native logic or formatting | `run` | default programmable workbook surface |
| none of the smaller surfaces fit cleanly | `run` | avoid forcing a bulk-data workflow onto workbook logic |
