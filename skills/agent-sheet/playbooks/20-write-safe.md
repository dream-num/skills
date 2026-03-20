# Write Safe Playbook

## When to use

Use this for workbook mutations: sparse patches, bounded replacements, review tables, formula propagation, and sheet lifecycle changes.

## Choose the smallest edit

| Intent | Best command | Notes |
|---|---|---|
| sparse cell patches | `write cells` | best when only a few coordinates change |
| bounded rectangular replacement | `write range --range "<sheet>!A1:D200"` | treat `--range` as the full replacement rectangle |
| review table or queue anchored at `A1` | `write table --sheet "<name>"` | include the header row in the incoming data |
| bounded propagation from a known seed | `write fill` | use for formulas or series already correct in the source cell(s) |
| sheet lifecycle | `sheet create|rename|copy|delete` | use workbook-native sheet commands, not ad-hoc rewrites |
| workbook-native bounded logic | `script js` | only when built-in commands do not express the change clearly |

If the requested change is not obviously covered, read [../references/command-selection-matrix.md](../references/command-selection-matrix.md) first.

## Default sequence

1. Reconfirm the target sheet or range.

```bash
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<sheet>"
```

2. Use the smallest matching command.

```bash
printf '{"<sheet>!D7":2815}\n' | agent-sheet write cells --entry-id <entry-id> --json
agent-sheet write range --entry-id <entry-id> --range "<sheet>!A2:C100" ./rows.tsv --input-format tsv
agent-sheet write table --entry-id <entry-id> --sheet "Review" ./review.tsv --input-format tsv
agent-sheet write fill --entry-id <entry-id> --sheet "<sheet>" --source-range A2:A2 --target-range A2:A200
```

3. Verify immediately after the mutation with [15-verify.md](15-verify.md).

```bash
agent-sheet read range --entry-id <entry-id> --range "<verify-range>"
```

4. Add a broader inspection after structural changes.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Write-specific rules

- for `write table`, verify the header row, first data rows, and total row count
- for shell-generated data, stage an artifact if needed and inspect its head before writeback
- for `write range`, make sure the source data shape matches the replacement rectangle
- for `write fill`, verify both formula view and displayed values on a small sample
- large `write table` calls may chunk internally; still verify only from the workbook result, not from command optimism

## Defaults

- inspect before broad or structural writes
- verify every data-visible mutation
- keep the target tightly bounded
- do not use `write table` for arbitrary non-`A1` offsets
- do not claim shell roundtrip success from row count alone
- do not fake visual verification for presentation-only changes

## Stop / escalate

Stop and escalate when:

- the write would touch a large unknown region
- the target changed between inspection and write
- the source artifact shape is unclear
- verification fails or reveals an unexpected structural change
