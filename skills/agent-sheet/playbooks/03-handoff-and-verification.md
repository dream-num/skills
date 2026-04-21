# Handoff And Verification

## Verification rules that matter here

- `file info` is metadata only. It does not prove worksheet names, sheet count, headers, or changed cells.
- use `inspect workbook` to prove workbook-visible structure
- after mutation, verify from workbook-visible surfaces, not from exit status

## Structure proof

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<worksheet>"
agent-sheet inspect range --entry-id <entry-id> --range "<worksheet>!A1:H20"
```

Use this to prove:

- worksheet names
- sheet count
- header row
- bounded changed area

## Shell roundtrip proof

For `pipe out` -> shell -> `pipe in`, verify all of:

- header row
- first 2-5 sample rows
- key columns such as `order_id`, `claim_id`, or other task anchors

Example:

```bash
agent-sheet pipe out --entry-id <entry-id> --range "<worksheet>!A1:H5" --format csv
agent-sheet pipe out --entry-id <entry-id> --range "<worksheet>!B2:B6" --format csv
```

Row count alone is weak evidence.

## Imported workbook and handoff reality

```bash
agent-sheet file info --entry-id <entry-id> --json
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet file export --entry-id <entry-id> --output ./handoff.xlsx
test -s ./handoff.xlsx
```

- `file info` proves entry metadata
- `inspect workbook` proves the imported workbook you actually mutated
- `test -s` proves the exported file exists and is non-empty

## Quoting rule for non-English worksheet names

Quote the full A1 range string:

```bash
agent-sheet inspect range --entry-id <entry-id> --range '工作表1!A1:J20'
agent-sheet pipe out --entry-id <entry-id> --range '工作表1!A1:J20' --format csv
```

Do not quote only the sheet name fragment.

## Mutation verification default

After `fill`, `pipe in`, or `run`:

```bash
agent-sheet inspect range --entry-id <entry-id> --range "<verify-range>"
agent-sheet pipe out --entry-id <entry-id> --range "<verify-range>" --format csv
```

Prefer the smallest range that still proves the result.
