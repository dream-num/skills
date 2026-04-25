# Getting Started

## Mental model

- `univer-cli` is workbook-first and path-explicit.
- Resolve one `<univer-path>` and stay on that workbook for the whole task.
- Read workbook-visible state before deciding how to mutate it.

## First touch: choose a workbook path

If the workbook package does not already exist, start with one of these:

```bash
univer new ./workbook.univer --name "<workbook-name>" --json
univer import ./input.xlsx ./workbook.univer --json
```

- use `new` when you need a brand-new workbook package
- use `import` when the workbook starts from a local file
- keep the resulting `.univer` path as the target for later commands

## Why `inspect` comes first

Use `inspect` first because command success does not tell you worksheet names, layout, headers, or the real write boundary.

Start small:

```bash
univer inspect workbook <univer-path>
univer inspect sheet <univer-path> --sheet "<worksheet>"
univer inspect range <univer-path> --range "<worksheet>!A1:H40"
```

## Why keep `<univer-path>`

- it pins every command to the same workbook package
- it avoids drifting between imported, created, or exported files
- it keeps file identity separate from internal manifest ids

## Choose the command

### `inspect`

Use when you need workbook structure, sheet shape, a bounded rectangle, or formulas before choosing a write path.

```bash
univer inspect workbook <univer-path>
univer inspect range <univer-path> --range "Sheet1!A1:H20"
```

### `search`

Use when the target rows are not pinned down yet and you need to localize matches before editing.

```bash
univer search <univer-path> --query "renewal"
```

### `fill`

Use for workbook-native propagation from a known seed range into a larger target range.

```bash
univer fill <univer-path> --sheet "Sheet1" --source-range B2:B3 --target-range B2:B200
```

### `run`

Use for workbook-local logic or structural work that smaller primitives do not express cleanly. Keep the touched sheets and A1 ranges explicit.

```bash
univer run <univer-path> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sheet1");
  if (!sheet) return { success: false, error: "Sheet1 not found" };
  sheet.getRange("A1").setValue("ready");
  return { success: true };
}'
```

### `pipe`

Use `pipe out` when the shell should inspect or transform rectangular data. Use `pipe in` when writing a known rectangle back into the workbook.

```bash
univer pipe out <univer-path> --range "Sheet1!A1:D20" --format tsv
cat ./patch.tsv | univer pipe in <univer-path> --range "Sheet1!F2:I20" --input-format tsv --data-stdin
```

## Default first steps

```bash
univer inspect workbook <univer-path>
univer inspect sheet <univer-path> --sheet "<worksheet>"
univer search <univer-path> --query "<query>"
```
