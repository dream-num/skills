# Run API Advanced Boundary

This page defines the current boundary for advanced `run` coverage.

## In Scope Today

The `run-api` reference family currently documents the stable, high-signal surface for:

- workbook and worksheet access
- bounded structural edits
- range reads and writes
- formulas with async readback
- merge flows
- formatting and presentation

## Future Expansion Areas

These areas may be added later, but they are not documented as part of the current stable reference set:

- charts
- pivot tables
- conditional formatting
- data validation
- filters
- sort views

If a task depends on one of these areas, do not guess APIs from object names or external snippets. Confirm the supported surface first, then extend this reference family deliberately instead of mixing undocumented calls into ordinary examples.
