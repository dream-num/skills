# Write Safe Playbook

## When to use

Use this for workbook mutations that should stay small, explicit, and verifiable.

## Choose the smallest edit lane

| Intent | Best command | Notes |
|---|---|---|
| propagate formulas or series from a known seed | `fill` | first-class primitive for workbook-native propagation |
| replace an explicit bounded rectangle from shell data | `pipe in --range "<worksheet>!A1:D200"` | rectangular data plane; shape must already be correct |
| perform workbook-local logic, bounded edits, formatting, or structural work | `run` | default programmable workbook surface |
| inspect structure before deciding | `inspect workbook|sheet|range` | reduces accidental broad mutations |
| localize target rows before deciding | `search` | shrinks the mutation boundary before you edit |

If the requested change is not obviously covered, read [../references/command-selection-matrix.md](../references/command-selection-matrix.md) first.

## Default sequence

1. Reconfirm the target worksheet or range.

```bash
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<worksheet>"
```

2. Use the smallest matching command.

```bash
agent-sheet fill --entry-id <entry-id> --sheet "<worksheet>" --source-range A2:A2 --target-range A2:A200
cat ./rows.tsv | agent-sheet pipe in --entry-id <entry-id> --range "<worksheet>!A2:C100" --input-format tsv
agent-sheet run --entry-id <entry-id> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Review");
  if (!sheet) {
    return { success: false, error: "Review not found" };
  }
  sheet.getRange("A1").setValue("ready");
  return { success: true, touchedSheets: ["Review"], changedRanges: ["Review!A1"] };
}'
```

3. Verify immediately after the mutation with [15-verify.md](15-verify.md).

```bash
agent-sheet inspect range --entry-id <entry-id> --range "<verify-range>"
agent-sheet pipe out --entry-id <entry-id> --range "<verify-range>" --format csv
```

4. Add a broader inspection after structural changes.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Mutation-specific rules

- for `pipe in`, make sure the incoming data shape matches the replacement rectangle
- for shell-generated data, stage an artifact if needed and inspect its head before writeback
- for `fill`, verify both formula view and displayed values on a small sample
- for `run`, state the touched worksheets and A1 ranges before execution whenever possible
- verify only from the workbook result, not from command optimism

## Defaults

- inspect before broad or structural mutations
- search before edits when the target rows are not already pinned down
- verify every data-visible mutation
- keep the target tightly bounded
- do not claim shell roundtrip success from row count alone
- do not fake visual verification for presentation-only changes

## Stop / escalate

Stop and escalate when:

- the mutation would touch a large unknown region
- the target changed between inspection and mutation
- the source artifact shape is unclear
- verification fails or reveals an unexpected structural change
