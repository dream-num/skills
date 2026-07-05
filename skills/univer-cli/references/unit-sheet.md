# Sheet Unit

Unit-specific reference for `sheet` units. Content moved verbatim from the workflow-phase references; open it when the target unit is a sheet.

## Managed sheet inspect tools

Tool roles:

| Tool | Use when |
| --- | --- |
| `units` | You need target unit inventory, `unitId`, type, name, or capabilities. |
| `sheet-overview` | You need sheet names, used ranges, bounded samples, formulas, warnings, or candidate non-empty regions. |
| `sheet-search` | You know visible text or values but not coordinates. |
| `sheet-neighborhood` | You have an anchor and need nearby headers, labels, totals, or context. |
| `sheet-range` | You know explicit bounded sheet/range rectangles and need default slim cell facts or exact values, formulas, formats, direct static style traits, or typed facts. |
| `sheet-formulas` | You need to audit formula locations or formula text. |
| `sheet-conditional-formats` | You need conditional formatting rule resources, their target ranges, and rule config. |

Use default slim evidence for ordinary labels, copied text, grouping, matching, and write
planning. For reusable or large evidence, pass `--out ./name.result.json`; stdout becomes a short
Agent Index Output and the full pretty JSON artifact can be reused with `jq` or bounded `sed`
without rerunning inspect. Use paired names such as `overview.params.json` and
`overview.result.json`. Without `--out`, stdout stays compact JSON. For review, add `--md` to
render the same evidence as Markdown; Markdown is an agent-readable view, not a JSON pointer codec
or roundtrip machine format. Request exact
`values`, `displayValues`, `cellData`, `valueDetails`, `richTextRuns`, `cellFacts`,
`numberFormats`, formulas, or `semanticStyles` only when the task depends on exact display strings,
typed values, formulas, formats, static style traits, rich text runs, rich cell model data,
multi-line content, or export/debug details. `semanticStyles` is for supported stable traits and
does not expose raw style ids.

Before rerunning an equivalent inspect command, check whether the existing `--out` artifact answers
the same sheet/range/evidence question. Reuse artifact paths and Agent Index Output read hints until
the target changes through `sac apply`, rollback, restore, reset, import/export roundtrip, or a new
range/sheet question. Do not treat an old artifact as current evidence after mutation.

For `sheet-range` and range-like cell facts, `value` uses `cellData.v`/raw readback for typed cell
content and `valueType` prefers `cellData.t` when available; `displayValue` mirrors Facade
`getDisplayValues()`. Inspect tools do not synthesize `value` from display text; request `cellData`
explicitly when the full cell model itself is the evidence.

Use `sheet-conditional-formats` when the question is whether conditional formatting rules exist,
where they apply, and what conditions/styles they encode. It does not prove every cell's final
rendered appearance; combine it with `sheet-range` value evidence when a rule's outcome depends on
cell values.

Sheet names are exact workbook identifiers. Copy them from `units`, `sheet-overview`, or a
managed-tool diagnostic exactly as returned. Do not title-case, lowercase, translate, trim internal
spacing, or replace punctuation. If a diagnostic reports `didYouMean`, rerun the same bounded
request with that exact sheet name; do not try another guessed spelling first.

`sheet-overview` regions are candidate non-empty rectangles. They are evidence for possible table
boundaries, footers, spacer columns, formulas, and blank tails; they are not final business
semantics.

Recover from managed inspect diagnostics by fixing the evidence request, not by dumping more data by
default:

- `maxCells` exceeded: use `sheet-overview` or used-range evidence first, then split the target into
  smaller `sheet-range` requests. Raise `maxCells` only when the task truly requires broad range
  evidence.
- unsupported `include`: choose one of the supported include fields listed by the diagnostic, or use
  a dedicated managed tool for that evidence surface.
- unsupported semantic style trait: choose a supported trait, request `semanticStyles`/`cellData`
  when those evidence fields answer the question, or use the managed style/resource tool. Do not
  inspect workbook internals as the recovery path.

## SaC Common API Pocket Guide

Use these stable primitives before lookup when the task is ordinary range read/write/format or
assertion work. If a diagnostic names a missing overload, enum, helper, or unsupported surface not
covered here, use one short lookup or exact declaration read, then return to authoring.

- Read values: use `range.getCellDatas()` for the authoritative logical cell model (`{ v, t, f, s }`).
  Do **not** trust `range.getValues()` for logical values — for a cell with a number format it returns
  the formatted display string (a date serial `44900` reads back as `"2022-12-05"`) and `1`/`0` for
  booleans, exactly like `getDisplayValues()`. Use `getDisplayValues()` only when you want display
  text. Managed `inspect` `value` fields are unaffected because they read `cellData.v`.
- Write values: use rectangular `range.setValues(matrix)` only with concrete values. Normalize
  nullable readback first; do not pass `null` or `undefined` inside `setValues()` matrices.
- Write sparse cells: prefer single-cell writes or skip blank writes instead of rewriting a large
  grid of blanks when only a few cells change.
- Clear content: use the Facade clear-content surface for old output bodies before writing a shorter
  final output; verify blank display tails only when the requested output window requires them.
- Formats and styles: set number format or supported style traits only when the task or target
  pattern requires them. If rich text, merge, or semantic style support is absent, use a bounded
  capability check and choose a supported representation or report the gap instead of adjacent
  exploration.
- Assertions: use logical value assertions for typed semantics and display assertions for formatted
  output. Style assertions should cover only output cells or necessary preservation invariants.


## Cell model (`{ v, t, f, s }`)

A cell is not a bare value but `{ v, t, f?, s? }`:

| field | meaning |
| --- | --- |
| `v` | stored logical value — used by formulas, sorting, filters, comparison, and write-back |
| `t` | value type (`CellValueType`): `1`=text, `2`=number, `3`=boolean, `4`=force-text — tells the engine how to read `v` |
| `f` | formula text; its computed result is cached separately in `v`, so `f` and `v` are different things |
| `s.n.pattern` | number format — controls display only, never changes `v` |

When writing, prefer explicit `ICellData` over bare values, because a bare `"2-2"`, a leading-zero id,
or a date-like string gets auto-inferred into a number or date. Pin identity with the type code:

```ts
range.setValue({ v: "text", t: 1 });
range.setValue({ v: 42, t: 2 });
range.setValue({ v: 1, t: 3 });        // boolean (v: 0 = false)
range.setValue({ v: "00123", t: 4 });  // force-text: ids, leading zeros, scores like 2-2, phone, zip
range.setValue({ f: "=A1+B1" });       // formula
```

Dates, percentages, and currency are a number **plus a number format**, not separate types. A date
stores the serial number, not the rendered string:

```ts
range.setValue({ v: 44900, s: { n: { pattern: "yyyy-MM-DD" } } }); // serial number, displays as 2022-12-05
range.setValue({ v: 0.25, s: { n: { pattern: "0%" } } });          // displays as 25%
```

## Spreadsheet value surfaces

Map the task's wording to the cell-model surfaces above:

- Words like "show", "display", "appear", "formatted as", currency, percent, date format, or
  dash-for-zero usually describe the **display** side — keep the logical `v` typed and apply a
  number/date format; do not write the formatted string into `v`.
- Words like "literal", "text", "cell value should be", "preserve leading zeros", SKU, ZIP, ID, or
  code usually describe **logical/storage text identity** — use `t: 4` (force-text) /
  `CellValueType.FORCE_STRING`.

For numeric, date, amount, count, total, difference, or formula-referenced cells, do not satisfy
display requirements by writing formatted strings. For example, "show `-` instead of zero" in an
amount column should keep logical `0`, assert display `"-"`, and assert the number format:

```ts
range("Summary!F5").values([[0]]);
range("Summary!F5").displayValues([["-"]]);
range("Summary!F5").numberFormat("0;\\-0;\\-");
```

Do not use this shape for numeric display placeholders:

```ts
range("Summary!F5").values([["-"]]);
```

A literal formatted string in a numeric or formula-referenced column can break formulas, filters,
sorts, and exported XLSX readback.

When `univer sac verify` fails, read the report failure's `valueSemantics`, `actualDiagnostics`,
and `firstDifference`. A string `"10"` and number `10` are different logical values even when they
display the same; use the suggested next evidence such as `displayValues`, `valueDetails`, or
`cellData` to decide whether the migration source or the assertion helper is wrong.

Use raw/value assertions when null-like storage identity is the contract.
For `displayValues`, assert blank cells as empty strings (`""`) because display readback returns
strings.
For style contracts, prefer semantic assertion helpers such as `styles` or `backgroundColors`.
Avoid raw style ids, `styleId`, `style.id`, generated resource ids, or raw `cellData.s` snapshots as
the expected contract unless a lower-level implementation test specifically needs storage identity.

## Grid dimensions

- `getMaxRows()` / `getMaxColumns()` report the sheet's current capacity; `getLastRow()` /
  `getLastColumn()` report the last used row/column (0-based).
- Before writing past the current capacity, extend the grid first with `setRowCount(n)` /
  `setColumnCount(n)`, then write — an out-of-range write otherwise has nowhere to land.

## Sheet data recipes

## Create A Fresh Sheet Unit

When the target unit does not exist yet (no baseline import, an empty univerfile), create it inside
migration source with `univerAPI.createWorkbook(data)` — there is no CLI unit-add command; unit
creation is a migration action like any other durable change. Guard it so re-applying the pack stays
safe:

```ts
const workbook = univerAPI.getWorkbook("replace-with-unitId")
  ?? univerAPI.createWorkbook({ id: "replace-with-unitId", name: "replace-with-display-name" });
```

`createWorkbook` takes `Partial<IWorkbookData>` — verified minimal: `{ id, name }` alone is enough
and produces one default sheet named `Sheet1` (`getActiveSheet()` / `getSheetByName("Sheet1")` work
immediately, no `sheetOrder`/`sheets` needed). Pin the unit's id by passing it as `data.id`, not as a
separate option — `ICreateUnitOptions` (the second argument) has no id field. `getWorkbook(id)` on a
missing id returns a falsy value (not a throw), so the `??` guard above is safe on first apply and a
no-op on re-apply.

## Read A Known Range

```bash
UNIVERFILE=./orders.univer

cat > ./range.params.json <<'JSON'
{
  "unitId": "replace-with-unitId",
  "sheetName": "replace-with-sheetName",
  "rangeA1": "A1:D20"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-range --worktree "$WORKTREE_ID" --params ./range.params.json --out ./range.result.json
```

The command writes reusable pretty JSON to `range.result.json` and prints a short index with `jq`
read hints. Without `--out`, stdout returns compact slim cell facts for ordinary text and value
decisions. Add exact include fields such as `values`, `displayValues`, `valueDetails`,
`richTextRuns`, `cellFacts`, `formulas`, `numberFormats`, `semanticStyles`, or `cellData` only when
the task depends on those distinctions.
In these cell facts, `logicalCellValue`/`value` uses `cellData.v`/raw readback for typed cell
content, `storageValueType`/`valueType` prefers `cellData.t` when available, and
`displayCellValue`/`displayValue` mirrors Facade `getDisplayValues()`; inspect does not synthesize
logical values from display text.
Use `--md` only when the same evidence should be easier to review as Markdown; keep JSON for
machine parsing. Use the real `sheetName` from `units`/`sheet-overview` exactly as returned; do not
default to `Sheet1` or normalize casing/spaces.

## Read Related Ranges

Use `ranges` when one evidence question spans multiple rectangles. Put `sheetName` on each range
entry; do not rely on a top-level sheet name for multi-range params.

```bash
UNIVERFILE=./orders.univer

cat > ./related-ranges.params.json <<'JSON'
{
  "unitId": "replace-with-unitId",
  "ranges": [
    { "label": "keys", "sheetName": "replace-with-sheetName", "rangeA1": "A1:A20" },
    { "label": "status", "sheetName": "replace-with-sheetName", "rangeA1": "K1:K20" }
  ]
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-range --worktree "$WORKTREE_ID" --params ./related-ranges.params.json
```

If an inspect diagnostic says `didYouMean`, rerun the same request with that exact sheet name.
Do not try title-case, lowercase, or translated variants first.

## Locate A Label Then Read Around It

```bash
UNIVERFILE=./orders.univer

cat > ./search.params.json <<'JSON'
{
  "unitId": "replace-with-unitId",
  "sheetName": "Orders",
  "rangeA1": "A1:Z200",
  "query": "Total",
  "types": ["normalizedValues"],
  "match": "contains",
  "maxResults": 20
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-search --worktree "$WORKTREE_ID" --params ./search.params.json
```

Use the returned coordinate as input to `sheet-neighborhood` or `sheet-range` when context is
needed.

## Inspect Conditional Formatting Rules

Use this when the question is about conditional formatting resources, status-color rules, or
value-dependent style rules. Pair it with `sheet-range` value evidence when the rendered outcome
depends on cell values.

```bash
UNIVERFILE=./orders.univer

cat > ./conditional-formats.params.json <<'JSON'
{
  "unitId": "replace-with-unitId",
  "sheetName": "Sheet1",
  "rangeA1": "K2:K100"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-conditional-formats --worktree "$WORKTREE_ID" --params ./conditional-formats.params.json
```

This reports rule facts and target ranges. It is not a final rendered-style proof for every cell.

## Custom Readonly Aggregation Probe

```bash
UNIVERFILE=./orders.univer
SIDECAR=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("./materialize.json","utf8")); console.log(j.sidecarPath)')
cat > "$SIDECAR/inspect-scripts/aggregate-range.js" <<'JS'
({ params, univerAPI }) => {
  const workbook = univerAPI.getWorkbook(params.unitId);
  if (!workbook) {
    return {
      ok: false,
      error: "WORKBOOK_NOT_FOUND",
      diagnostics: [{ field: "unitId", value: params.unitId }]
    };
  }

  const sheet = workbook.getSheetByName(params.sheetName);
  if (!sheet) {
    return {
      ok: false,
      error: "SHEET_NOT_FOUND",
      diagnostics: [{ field: "sheetName", value: params.sheetName }]
    };
  }

  const sampleLimit = Math.max(1, Math.min(Number(params.sampleLimit ?? 5), 20));
  const range = sheet.getRange(params.rangeA1);
  const cells = range.getCellDatas(); // logical { v, t } — getValues() returns display strings for formatted cells
  const displayValues = range.getDisplayValues();
  const groupColumnOffset = Number(params.groupColumnOffset ?? -1);
  const valueColumnOffset = Number(params.valueColumnOffset ?? -1);
  const expectedByKey = params.expectedByKey ?? {};
  const groups = {};
  const mismatches = [];
  let nonBlankCellCount = 0;

  cells.forEach((row, rowIndex) => {
    row.forEach((cell) => {
      const v = cell?.v;
      if (v !== null && v !== undefined && v !== "") nonBlankCellCount += 1;
    });

    const key = groupColumnOffset >= 0 ? displayValues[rowIndex]?.[groupColumnOffset] : "";
    if (key) {
      const numericValue = valueColumnOffset >= 0 ? Number(cells[rowIndex]?.[valueColumnOffset]?.v ?? 0) : 1;
      groups[key] = {
        count: (groups[key]?.count ?? 0) + 1,
        total: (groups[key]?.total ?? 0) + (Number.isFinite(numericValue) ? numericValue : 0)
      };
    }

    if (Object.prototype.hasOwnProperty.call(expectedByKey, key)) {
      const actual = valueColumnOffset >= 0 ? cells[rowIndex]?.[valueColumnOffset]?.v : row;
      if (actual !== expectedByKey[key] && mismatches.length < sampleLimit) {
        mismatches.push({ rowOffset: rowIndex, key, expected: expectedByKey[key], actual });
      }
    }
  });

  return {
    ok: true,
    target: {
      unitId: params.unitId,
      sheetName: params.sheetName,
      rangeA1: params.rangeA1
    },
    dimensions: {
      rows: values.length,
      columns: values[0]?.length ?? 0
    },
    nonBlankCellCount,
    groups,
    mismatches: {
      count: mismatches.length,
      first: mismatches
    },
    samples: {
      head: displayValues.slice(0, sampleLimit),
      tail: displayValues.slice(Math.max(0, displayValues.length - sampleLimit))
    },
    truncation: {
      sampleLimit,
      omittedRows: Math.max(0, displayValues.length - sampleLimit * 2)
    }
  };
}
JS
cat > ./aggregate-range.params.json <<'JSON'
{
  "unitId": "replace-with-unitId",
  "sheetName": "replace-with-sheetName",
  "rangeA1": "A1:D200",
  "groupColumnOffset": 0,
  "valueColumnOffset": 3,
  "sampleLimit": 5
}
JSON
univer inspect "$UNIVERFILE" --script "$SIDECAR/inspect-scripts/aggregate-range.js" --worktree "$WORKTREE_ID" --params ./aggregate-range.params.json --out ./aggregate-range.result.json
```

Scratch probes are function expressions, not ESM or CommonJS modules; do not use `export default` or
`module.exports`. Keep custom probes readonly and task-local. Prefer this pattern when a bounded
aggregate fact would otherwise require several `sheet-range` dumps plus shell slices. Keep output
bounded: return aggregate facts, mismatch counts with first diffs, candidate dimensions, and a few
samples; if matching fails, return `ok: false`, counts, field diagnostics, and bounded samples
instead of dumping every unknown row. Treat a second broad range read or repeated shell slice for the
same question as the point to switch to this probe. Promote repeated useful probes to managed tools
in a separate product change.
