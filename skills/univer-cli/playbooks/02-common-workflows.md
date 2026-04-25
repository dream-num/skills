# Common Workflows

Use this page by matching the task to a workflow. Each workflow starts with the smallest command surface that keeps the job explicit and verifiable.

## I need to understand the workbook before deciding anything

When to use: every task that starts from an existing workbook or imported template.

```bash
univer inspect workbook <univer-path>
univer inspect sheet <univer-path> --sheet "<worksheet>"
univer inspect range <univer-path> --range "<worksheet>!A1:H40"
```

Key verification:

- worksheet names are correct
- header row and sample rows match the task
- the intended write area is bounded

## I need to find the target rows before editing

When to use: the target rows are defined by content rather than fixed coordinates.

```bash
univer search <univer-path> --query "<query>"
univer inspect range <univer-path> --range "<worksheet>!A1:H40"
```

Key verification:

- the hits are on the expected sheet
- the mutation range is derived from real hits, not guessed coordinates

## I need to extend a correct seed formula or series

When to use: the workbook already contains a correct formula, pattern, or series that should propagate naturally.

```bash
univer inspect range <univer-path> --range "<worksheet>!A1:E8"
univer fill <univer-path> --sheet "<worksheet>" --source-range A2:E2 --target-range A2:E200
univer inspect range <univer-path> --range "<worksheet>!A1:E8"
univer pipe out <univer-path> --range "<worksheet>!A1:E8" --format csv
```

Key verification:

- propagated formulas appear in the target rows
- displayed values on sample rows look correct

## I need a shell transform on a bounded rectangle

When to use: the data movement is rectangular and shell tools express the transform more cleanly than workbook-local code.

```bash
univer pipe out <univer-path> --range "<worksheet>!A1:H200" --format csv > /tmp/input.csv
awk 'NR==1{print; next} {print}' /tmp/input.csv > /tmp/output.csv
univer pipe in <univer-path> --range "<worksheet>!A1:H200" --input-format csv --data-file /tmp/output.csv
univer pipe out <univer-path> --range "<worksheet>!A1:H8" --format csv
```

Key verification:

- header row is unchanged or intentionally changed
- first 2-5 rows still align with key columns
- row count alone is not enough

## I need workbook-local logic or structure changes

When to use: bounded logic, structural edits, formatting, or workbook APIs that `fill` and `pipe` do not cover cleanly.

```bash
univer run <univer-path> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Review");
  if (!sheet) return { success: false, error: "Review not found" };
  sheet.getRange("A1").setValue("ready");
  return { success: true, touchedSheets: ["Review"], changedRanges: ["Review!A1"] };
}'
univer inspect range <univer-path> --range "Review!A1:B5"
```

Key verification:

- touched sheets and ranges are explicit
- verify from workbook-visible surfaces after the run

## I need to start from a local file and hand back a local file

When to use: a workbook comes from disk and the result also needs to leave as a file artifact.

```bash
univer import ./input.xlsx ./workbook.univer --json
univer inspect workbook ./workbook.univer
univer inspect range ./workbook.univer --range '<worksheet>!A1:H20'
univer export ./workbook.univer ./output.xlsx
```

Key verification:

- imported workbook structure is proven with `inspect workbook`
- exported file exists and is non-empty
- if worksheet names are non-English, quote the full A1 range string
