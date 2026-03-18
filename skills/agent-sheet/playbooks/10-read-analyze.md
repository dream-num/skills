# Read and Analyze Playbook

## When to use

Use this lane for workbook understanding, task scoping, data extraction, search, formula review, and pre-write inspection.

## Required input

- `--entry-id`
- analysis target: workbook, sheet, range, formulas, lint, or search query
- intended consumer of the result: human/model, shell pipeline, or reusable file

## Defaults

- start wide with `inspect workbook`
- drill down with `inspect sheet` or `inspect range`
- use `read range` for bounded extraction
- use `read search` when the target cells are not already known
- prefer TSV for shell pipelines
- `read` stream/file output already uses real workbook data shape; do not plan around synthetic header/index
- keep inline output bounded unless a file or stream is more appropriate
- treat this lane as data/structure/formula inspection; it is not a visual styling inspection path

## Decision order

1. Need topology or target discovery

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<sheet-name>"
agent-sheet inspect range --entry-id <entry-id> --range "<sheet>!A1:Z200"
```

2. Need concrete rectangular data

```bash
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80"
```

3. Need exact machine values instead of formatted display values

Use this when the task depends on typed workbook values such as numeric comparison, date-range logic, formula/result separation, or other cases where inline preview formatting could mislead the next step.

```bash
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80" --type rawValue --format tsv --to-stdout
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H80" --type rawValue --format json --to-file --output ./artifacts/range.json
agent-sheet read search --entry-id <entry-id> --query "<query>" --type rawValue --format tsv --to-stdout
```

If the business value is the formatted display text itself, keep `displayValue`. Do not switch to external workbook parsers before you have tried canonical `read` with the right cell type.

4. Need search-driven discovery

```bash
agent-sheet read search --entry-id <entry-id> --query "<query>"
agent-sheet read search --entry-id <entry-id> --query "<query>" --format tsv --to-stdout
```

5. Need machine parsing rather than human review

```bash
agent-sheet inspect workbook --entry-id <entry-id> --json-summary | jq -r '.sheets[].name'
```

## Output mode rules

- human/model review: default inline output, optionally with `--artifact-max-bytes`
- shell/dataflow: `--to-stdout --format tsv`
- precise machine extract: add `--type rawValue`, usually with `--to-stdout` or `--to-file`
- reusable artifact: `--to-file --output <path>`

## What this lane can and cannot verify

This lane can verify:

- workbook structure
- sheet/range existence
- cell values and formulas
- lint-visible spreadsheet issues

This lane cannot independently verify:

- borders
- fonts
- colors
- alignment
- freeze panes

If the task depends on those presentation states, route to `script js` fallback and report the visual result honestly instead of pretending `read` or `inspect` validated it.

## Shell-native examples

Read [../references/shell-patterns.md](../references/shell-patterns.md) when the task wants streaming transforms or large-data review sheets.

## Stop / escalate

Stop and escalate when:

- the target sheet or range does not exist and guessing would be destructive
- the observed workbook state contradicts the user request in a way that changes the write plan
- the result is too large for inline consumption and the consumer path is still unclear

## Output contract

Summarize:

- in-scope sheet/range
- observed data shape or search hits
- formula/lint risks when relevant
- recommended next mutation primitive, if any
- chosen output mode
- any capability gap between requested visual verification and current canonical CLI surfaces

## Minimal example

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:D20"
```
