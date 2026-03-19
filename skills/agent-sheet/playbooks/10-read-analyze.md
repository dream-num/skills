# Read and Analyze Playbook

## When to use

Use this lane for workbook understanding, task scoping, data extraction, search, and formula review.

## Start with the smallest read

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<sheet-name>"
agent-sheet inspect range --entry-id <entry-id> --range "<sheet>!A1:Z200"
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80"
agent-sheet read search --entry-id <entry-id> --query "<query>"
```

## Exact values

When the task depends on typed workbook values rather than formatted display text, use `--type rawValue`.

```bash
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80" --type rawValue --format tsv --to-stdout
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80" --type rawValue --format json --to-file --output ./artifacts/range.json
```

## Structured follow-up work

- keep workbook reads on `agent-sheet`
- if external transform is needed, start from `read --type rawValue --to-stdout|--to-file`
- do not reopen the workbook with a local workbook library for reads that `agent-sheet` already covers

## Output choices

- human review: keep inline output bounded
- shell pipeline: use `--to-stdout`
- reusable artifact: use `--to-file --output <path>`

## This lane verifies

- workbook structure
- sheet and range existence
- cell values and formulas

## This lane does not verify

- borders
- fonts
- colors
- alignment
- freeze panes

If the task depends on those presentation states, switch to [40-script-fallback.md](40-script-fallback.md).

## Stop / escalate

Stop and escalate when:

- the target sheet or range is unclear
- the observed workbook state changes the write plan
- the result is too large for inline use and the output path is still unclear
