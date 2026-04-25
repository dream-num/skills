# Handoff And Verification

## Verification rules that matter here

- package metadata is metadata only; it does not prove worksheet names, sheet count, headers, or changed cells
- use `inspect workbook` to prove workbook-visible structure
- after mutation, verify from workbook-visible surfaces, not from exit status

## Structure proof

```bash
univer inspect workbook <univer-path>
univer inspect sheet <univer-path> --sheet "<worksheet>"
univer inspect range <univer-path> --range "<worksheet>!A1:H20"
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
univer pipe out <univer-path> --range "<worksheet>!A1:H5" --format csv
univer pipe out <univer-path> --range "<worksheet>!B2:B6" --format csv
```

Row count alone is weak evidence.

## Imported workbook and handoff reality

```bash
univer inspect workbook <univer-path>
univer export <univer-path> ./handoff.xlsx
test -s ./handoff.xlsx
univer import ./handoff.xlsx ./handoff.univer --json
univer inspect workbook ./handoff.univer
```

- `inspect workbook` proves the workbook-visible structure you actually mutated
- `test -s` proves the exported file exists and is non-empty
- re-import when the task needs proof that the handoff artifact can be read back

## Quoting rule for non-English worksheet names

Quote the full A1 range string:

```bash
univer inspect range <univer-path> --range '工作表1!A1:J20'
univer pipe out <univer-path> --range '工作表1!A1:J20' --format csv
```

Do not quote only the sheet name fragment.

## Mutation verification default

After `fill`, `pipe in`, or `run`:

```bash
univer inspect range <univer-path> --range "<verify-range>"
univer pipe out <univer-path> --range "<verify-range>" --format csv
```

Prefer the smallest range that still proves the result.
