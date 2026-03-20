# Verification Playbook

## When to use

Use this after any mutation, shell roundtrip, import/export handoff, or bounded `script js` execution.

## Rule

Do not stop at "the command succeeded". Prove the workbook state that matters for the task.

## Verification stack

1. Confirm structure.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet sheet list --entry-id <entry-id> --json
```

2. Confirm the changed region.

```bash
agent-sheet read range --entry-id <entry-id> --range "<sheet>!A1:H20" --format csv --to-stdout
agent-sheet inspect range --entry-id <entry-id> --range "<sheet>!A1:H20"
```

3. Confirm the task-specific invariant.

- row count
- exact search hits
- formula groups
- first and last sample rows
- key-column alignment
- exported file existence

## Verification recipes

### Row count

Use a bounded column that should be populated for every data row.

```bash
agent-sheet read range --entry-id <entry-id> --range 'OrdersRaw!A2:A2801' --format csv --to-stdout \
  | awk -F ',' '{v=$1; gsub(/^"|"$/, "", v); if (v != "") c++} END {print c + 0}'
```

### Search hit count

```bash
agent-sheet read search --entry-id <entry-id> urgent --match-entire-cell --sheet OrdersRaw --limit 5000 --format jsonl --to-stdout \
  | wc -l | tr -d ' '
```

### Formula verification

Use both structure and sample values.

```bash
agent-sheet inspect range --entry-id <entry-id> --range 'OrdersRaw!O1:S20'
agent-sheet read range --entry-id <entry-id> --range 'OrdersRaw!O2:S6' --type formula --format csv --to-stdout
agent-sheet read range --entry-id <entry-id> --range 'OrdersRaw!O2:S6' --format csv --to-stdout
```

### Shell roundtrip verification

Never rely on row count alone.

Verify all of:

- destination header row
- first 2-5 data rows
- a key column such as `claim_id` or `order_id`
- total row count

Example:

```bash
agent-sheet read range --entry-id <entry-id> --range 'ApprovalQueue!A1:G5' --format csv --to-stdout
agent-sheet read range --entry-id <entry-id> --range 'ApprovalQueue!B2:B6' --format csv --to-stdout
```

Reusable assets:

- [../examples/roundtrip-awk-write-table.md](../examples/roundtrip-awk-write-table.md)
- [../scripts/verify_csv_preview.py](../scripts/verify_csv_preview.py)

### Import/export handoff verification

Use metadata plus workbook structure.

```bash
agent-sheet file info --entry-id <entry-id> --json
agent-sheet sheet list --entry-id <entry-id> --json
test -s ./handoff.xlsx
```

`file info` proves metadata only. It does not prove sheet count or sheet names.

Reusable assets:

- [../examples/handoff-verify.md](../examples/handoff-verify.md)

### Presentation-only `script js`

If built-in commands cannot inspect the visual state, return a structured script summary and state that the verification mode is execution-only rather than independently observable.

## Anti-patterns

- counting rows and skipping header or sample checks after a shell transform
- using `file info` as a substitute for `sheet list` or `inspect workbook`
- verifying formulas from displayed values only when the formula surface matters
- claiming success because the export command returned zero without checking the output file
- skipping quoted-range verification for imported non-English sheets

## Stop / escalate

Stop and escalate when:

- the verification surface for the requested outcome does not exist
- the workbook result differs from the staged artifact
- the structure is right but key rows are shifted or malformed
