# Safety Guardrails

Risk controls for spreadsheet execution.

## Risk tiers

### Tier 0: Read-only

Commands:

- `inspect.*`
- `read.*`
- `doctor`
- `file list`
- `file info`
- `file open`

Rules:

- no mutation
- safe to chain when independent

### Tier 1: Localized write

Commands:

- `write cells`
- bounded `write range`
- bounded `write fill`
- `sheet create`
- `sheet rename`
- `sheet copy`

Rules:

- explicit target required
- immediate readback required

### Tier 2: Broad or structural mutation

Commands:

- `write table`
- wide `write range`
- `sheet delete`
- `script js`

Rules:

- preflight first
- justify command choice
- verify with both targeted readback and structural inspection when relevant

## Hard rules

1. Never mutate without resolved workbook context.
2. Never finish after a write without either canonical verification or an explicit note that the applied visual state is not independently inspectable via current canonical CLI surfaces.
3. Prefer canonical commands over `script js`.
4. Shell pipelines must opt into `--to-stdout`.
5. Large extracts should become files, not bloated inline output.
6. High-risk flows should execute one bounded step at a time.

## Escalation triggers

Escalate before continuing when:

- deleting sheets with ambiguous dependencies
- rewriting a large unknown region
- running JS across multiple sheets without a crisp boundary

## Mandatory verification set

For Tier 1 mutations, and for Tier 2 mutations whose effects are visible to canonical CLI surfaces, verify with at least one of:

- `read range --entry-id <id> --range <changed-range>`
- `inspect sheet --entry-id <id> --sheet <sheet>`
- `inspect workbook --entry-id <id>`

For presentation-only `script js` changes that current CLI cannot independently inspect, return an explicit execution summary instead of claiming canonical verification.
