# Univer Facade Benchmark Pitfalls

Load this reference before writing or reviewing benchmark Migration Pack code, Facade scripts,
formatting-sensitive workbook behavior, copy/move logic, formula work, rich text, active sheet
state, or value-type verification.

## Workbook Reads

- `getCellDatas()` is the source for complete cell model verification.
- `getValues()` is not a universal raw read. It can be affected by formats, interceptors, and
  display logic, and it does not preserve `t`, `f`, `p`, `s`, `si`, or `custom`.
- Rule anchor: getValues() is not a universal raw read.
- `getRawValues()` returns stored values as-is. It does not trim text, normalize NBSP, remove
  commas, or convert numeric-looking strings to numbers.
- Use `getFormula()` or `getFormulas()` for formulas; use `getCellDatas()` when formula cells also
  need value type, style, rich text, or custom data verification.
- `inspect` and `pipe out` are quick planning tools. They cannot prove true cell model, forced text,
  date serials, formulas, rich text, styles, or number formats.
- `pipe out --type rawValue` is not Facade `getRawValues()`; treat it as a visible planning probe,
  not model proof.

When exact row numbers, section boundaries, total rows, blank separator rows, or formulas matter,
prefer a readonly `univer run` probe that returns explicit coordinates and `getCellDatas()` output.
TSV/CSV has no row numbers, large `inspect range` output can omit rows, and formula group summaries
are not per-cell formula evidence.

## Value Models

The real cell model is `ICellData`, not a plain JavaScript value. Common fields:

- `v`: stored value
- `t`: type enum (`1=STRING`, `2=NUMBER`, `3=BOOLEAN`, `4=FORCE_STRING`)
- `f`: formula
- `si`: formula id
- `p`: rich text
- `s`: style id or inline style object
- `custom`: custom data

Write explicit `ICellData` objects for benchmark edits:

```ts
range.setValues([[
  { v: "2-2", t: 4 },
  { v: 123, t: 2 },
  { v: 1, t: 3 },
  { f: "=A1+B1" },
]]);
```

Use `t: 4` for text that must not be auto-converted, including scores, hyphenated codes, leading-zero
identifiers, phone-like values, postal codes, SKU/account ids, and literal formula text.

Dates, percentages, and currencies are numbers plus number formats:

```ts
{ v: serial, t: 2, s: { n: { pattern: "yyyy-mm-dd" } } }
{ v: 0.25, t: 2, s: { n: { pattern: "0%" } } }
{ v: 1234.5, t: 2, s: { n: { pattern: "$#,##0.00" } } }
```

After writing, `getCellDatas()` may show `s` as a style id. Resolve styles with style APIs or the
workbook snapshot when number format proof matters.

## Copy, Move, And Clear

- For copy, extract, move, preserve formatting, keep date formatting, or keep number formatting
  tasks, do not use `getValues()`/`getDisplayValues()` followed by `setValues()`.
- Preserve type, formula, format, rich text, or custom data with `getCellDatas()` -> deep clone ->
  clear target range -> `setValues()`.
- Moving ranges should prefer a move-range command or Facade row/column move API when available.
- `setValues()` merges object cell data into existing cells. Passing `{}` or style-only objects such
  as `{ s: ... }` does not clear old values, formulas, rich text, or custom data.
- Rule anchor: setValues() merges object cell data.
- When replacing a range, call `clearContent()` first, then write the rectangular values with
  `setValues()`.
- To clear individual cells through `setValues()`, use explicit null content fields such as
  `{ v: null, f: null, p: null, si: null, custom: null }`.
- To clear cells, use `clearContent()` for contents only or `clear()` for contents plus formatting.
  Do not use `setValue(null)`.

## Coordinates And Bounds

- `sheet.getLastRow()` and `sheet.getLastColumn()` return 0-based last used indexes.
- Numeric `sheet.getRange(row, column, numRows, numColumns)` uses 0-based start coordinates, while
  `numRows` and `numColumns` are counts.
- Before writing outside current sheet bounds, extend the sheet first and create the range only after
  extension.
- `getRange()` validates current `rowCount` and `columnCount` when the range object is created.
- Use `setColumnCount(requiredColumnCount)` when only far-right columns must become writable.
- Use insert-column or insert-row APIs only when the task requires shifting existing data.

## Styles And Rich Text

For background colors, use Facade style APIs instead of guessing style internals:

```ts
range.setBackgroundColor("#ffff00");
range.setBackground("#ffff00");
range.getBackgrounds();
```

Do not rely only on `getCellDatas()` or `cellData.s` to decide whether background color succeeded.

For rich text or partial text highlighting, use the official builder:

```ts
const richText = univerAPI.newRichText()
  .insertText("Hello World")
  .setStyle(0, 5, { bl: 1, cl: { rgb: "#ff0000" } });
sheet.getRange("A1").setRichTextValueForCell(richText);
```

For ranges, use `setRichTextValues([[richText, richText]])`. Read rich text with `getValue(true)` or
`getValues(true)` when needed. Do not hand-write `cell.p.body.textRuns` unless only diagnosing an
existing file structure.

## Normalization

For comparisons, blank detection, sums, sorting, and filters, normalize explicitly:

```ts
const cleanText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
const isBlank = (v) => cleanText(v) === "";
const parseNumberLoose = (v) => {
  const s = cleanText(v).replace(/,/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
```

Use normalization for internal logic. Do not blindly trim values written back when the task requires
preserving original text, trailing spaces, or exact formatting.

## Sheet State And Macros

- Treat workbook-visible sheet names as authoritative. If instruction wording names a sheet that
  differs from the inspected workbook and `answer_position` does not explicitly include that sheet,
  do not rename sheets unless requested.
- If the instruction requires a sheet to be active at the end, use
  `workbook.setActiveSheet(sheet)` with an `FWorksheet` or `workbook.setActiveSheet(sheetId)`.
- After verifying requested `answer_position` and active sheet once, export and stop.
- If the instruction asks for VBA or a macro, implement the described workbook effect directly in
  the spreadsheet and export the resulting workbook. Do not place VBA code in cells unless the
  request explicitly asks to store code text in cells.
