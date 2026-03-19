# Write Safe Playbook

## When to use

Use this for workbook mutations: sparse patches, range writeback, review tables, fills, and sheet lifecycle changes.

## Choose the smallest edit

| Intent | Command |
|---|---|
| sparse patches | `write cells` |
| anchored rectangular payload | `write range` |
| review table or replacement sheet | `write table --sheet <name>` |
| bounded propagation | `write fill` |
| sheet lifecycle | `sheet create|rename|copy|delete` |

If the requested change is mainly about formatting, layout, merge behavior, or another workbook-native feature, switch to [40-script-fallback.md](40-script-fallback.md).

## Default sequence

1. Reconfirm the target sheet or range.

```bash
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<sheet>"
```

2. Use the smallest matching command.

```bash
printf '{"<sheet>!D7":2815}\n' | agent-sheet write cells --entry-id <entry-id> --json
agent-sheet write range --entry-id <entry-id> "<sheet>!A2:C100" ./rows.tsv --input-format tsv
agent-sheet write table --entry-id <entry-id> --sheet "Review" ./review.tsv --input-format tsv
agent-sheet write fill --entry-id <entry-id> --sheet "<sheet>" --source-range A2:A2 --target-range A2:A200
```

3. Verify immediately after the mutation.

```bash
agent-sheet read range --entry-id <entry-id> --range "<verify-range>"
```

4. Add a broader inspection after structural changes.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Defaults

- inspect before broad or structural writes
- verify every data-visible mutation
- keep the target tightly bounded
- do not fake visual verification for presentation-only changes

## Stop / escalate

Stop and escalate when:

- the write would touch a large unknown region
- the target changed between inspection and write
- verification fails or reveals an unexpected structural change
