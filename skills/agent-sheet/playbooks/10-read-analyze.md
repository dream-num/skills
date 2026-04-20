# Read and Analyze Playbook

## When to use

Use this lane for workbook reconnaissance, task scoping, bounded extraction, search, and formula review.

## Start with the smallest reconnaissance surface

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<worksheet>"
agent-sheet inspect range --entry-id <entry-id> --range "<worksheet>!A1:H80"
agent-sheet search --entry-id <entry-id> --query "<query>"
agent-sheet pipe out --entry-id <entry-id> --range "<worksheet>!A1:H80" --format csv
```

## Exact values

When the task depends on typed workbook values rather than formatted display text, use `pipe out --type rawValue`.

```bash
agent-sheet pipe out --entry-id <entry-id> --range "<worksheet>!A1:H80" --type rawValue --format tsv
agent-sheet pipe out --entry-id <entry-id> --range "<worksheet>!A1:H80" --type rawValue --format json > ./artifacts/range.json
```

## Structured follow-up work

- keep workbook-visible reads on `agent-sheet`
- if external transform is needed, start from `pipe out`
- do not reopen the workbook with another local library for reconnaissance that `agent-sheet` already covers

## Output choices

- human review: keep inline output bounded with `inspect`
- shell pipeline: use `pipe out`
- reusable artifact: redirect `pipe out` into a file path

## This lane verifies

- workbook structure
- worksheet and range existence
- hit locations
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

- the target worksheet or range is unclear
- the observed workbook state changes the mutation plan
- the result is too large for inline use and the output path is still unclear
