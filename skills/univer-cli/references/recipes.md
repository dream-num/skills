# Recipes

These are concise command shapes. Replace paths, unit ids, sheet names, and ranges with inspected
facts. Use `../SKILL.md` for mandatory product boundaries and command selection. Examples use
`UNIVERFILE=./orders.univer` as a shell variable for the target path. When copying a command by
itself, set `UNIVERFILE` in the same shell first or replace `$UNIVERFILE` with the literal
`.univer` path.

## Import, Materialize, Discover Units

```bash
UNIVERFILE=./orders.univer
univer import --file ./orders.csv "$UNIVERFILE" --json
univer sac materialize "$UNIVERFILE" --json > ./materialize.json
printf '%s' '{}' | univer inspect "$UNIVERFILE" --tool units --params -
```

Read `sidecarPath` from command JSON. Use `localUnitId` from `units` for unit-specific reads.

## Check Univerfile And Unit Versioning State

```bash
UNIVERFILE=./orders.univer

univer status "$UNIVERFILE" --json
univer status "$UNIVERFILE" --local-unit-id "replace-with-localUnitId" --json
```

Use the actual target `.univer` file path. Do not run bare `univer status`, and do not substitute a
directory, display name, sheet name, `remoteUnitId`, or `sessionId` for the target path.

## Open Hosted Viewer Handoff

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --json
```

Open the returned `url` with agent-browser, Playwright, or another browser tool. `SOURCE_URL` must
be browser-fetchable with CORS enabled. If you only have `UNIVERFILE=./orders.univer`, do not run
`univer open "$UNIVERFILE"`; first provide or create an HTTP(S) source URL, or use the viewer file
picker as a manual human-browser fallback.

Use local fallback only when `file.univer.ai` is unreachable:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --local --json
```

Keep the command process running while using the returned local viewer URL. `--local` serves viewer
assets only; it still requires an HTTP(S), browser-fetchable, CORS-enabled source URL.

## Read A Known Range

```bash
UNIVERFILE=./orders.univer

cat > ./range.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId",
  "sheetName": "replace-with-sheetName",
  "rangeA1": "A1:D20"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-range --params ./range.params.json
```

Default output returns slim cell facts for ordinary text and value decisions. Add exact include
fields such as `values`, `displayValues`, `valueDetails`, `cellFacts`, `formulas`,
`numberFormats`, `semanticStyles`, or `cellData` only when the task depends on those distinctions.
In these cell facts, `value` uses `cellData.v`/raw readback for typed cell content and
`displayValue` mirrors Facade `getDisplayValues()`; inspect does not synthesize `value` from
display text.
Use `--md` only when the same evidence should be easier to review as Markdown; keep JSON for
machine parsing. Use the real `sheetName` from `units`/`sheet-overview`; do not default to
`Sheet1`.

## Read Related Ranges

Use `ranges` when one evidence question spans multiple rectangles. Put `sheetName` on each range
entry; do not rely on a top-level sheet name for multi-range params.

```bash
UNIVERFILE=./orders.univer

cat > ./related-ranges.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId",
  "ranges": [
    { "label": "keys", "sheetName": "Sheet1", "rangeA1": "A1:A20" },
    { "label": "status", "sheetName": "Sheet1", "rangeA1": "K1:K20" }
  ]
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-range --params ./related-ranges.params.json
```

## Locate A Label Then Read Around It

```bash
UNIVERFILE=./orders.univer

cat > ./search.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId",
  "sheetName": "Orders",
  "rangeA1": "A1:Z200",
  "query": "Total",
  "types": ["normalizedValues"],
  "match": "contains",
  "maxResults": 20
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-search --params ./search.params.json
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
  "localUnitId": "replace-with-localUnitId",
  "sheetName": "Sheet1",
  "rangeA1": "K2:K100"
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-conditional-formats --params ./conditional-formats.params.json
```

This reports rule facts and target ranges. It is not a final rendered-style proof for every cell.

## Custom Readonly Probe

```bash
UNIVERFILE=./orders.univer
SIDECAR=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("./materialize.json","utf8")); console.log(j.sidecarPath)')
cat > "$SIDECAR/inspect-scripts/probe.js" <<'JS'
({ params, univerAPI }) => {
  const workbook = univerAPI.getWorkbook(params.localUnitId);
  const sampleLimit = Math.max(1, Math.min(Number(params.sampleLimit ?? 5), 20));
  const diagnostics = [];

  if (!workbook) {
    return {
      ok: false,
      error: "WORKBOOK_NOT_FOUND",
      diagnostics: [{ field: "localUnitId", value: params.localUnitId }],
    };
  }

  return {
    ok: true,
    workbookName: workbook.getName(),
    facts: {
      checkedSheets: params.sheetNames ?? [],
      sampleLimit,
    },
    diagnostics,
  };
}
JS
printf '%s' '{"reason":"bounded-readonly-evidence","sampleLimit":5}' \
  | univer inspect "$UNIVERFILE" --script "$SIDECAR/inspect-scripts/probe.js" --params -
```

Scratch probes are function expressions, not ESM or CommonJS modules; do not use `export default` or
`module.exports`. Keep custom probes readonly and task-local. Keep output bounded: return aggregate
facts and a few samples; if matching fails, return `ok: false`, counts, field diagnostics, and
bounded samples instead of dumping every unknown row. Promote repeated useful probes to managed tools
in a separate product change.

## Template Migration, Apply, Verify

```bash
UNIVERFILE=./orders.univer

univer sac migration templates --json
univer sac migration create "update-by-key" "$UNIVERFILE" --template sheet-keyed-write
# edit generated TODO source under the returned sidecar migration path
univer sac apply "$UNIVERFILE"
univer sac verify "$UNIVERFILE" --json
```

Choose a template only after target-visible evidence shows it fits. If no template fits, create an
ordinary migration pack; edit `migration.ts`, not `pack.ts`. Keep `pack.ts` as metadata and
execution order only. Follow the generated `migration.ts` comments for common safe write shapes, and
check sidecar `types/*.d.ts` before using unfamiliar Facade APIs. In `displayValues` assertions, use
`""` for blank cells.

## Author And Verify Assertions

Global assertions live under `assertions/**/*.assertions.ts` and are discovered by `verify`, not
listed in `pack.files`. Import the API by name; do not search the sidecar to find it. Assertions
should start from discovered target units, then use `target` for unit inventory and explicit typed
unit helpers for unit-local facts. Use `facts` when a shared business value must appear in multiple
units.

```ts
// assertions/values.assertions.ts
import { defineAssertions } from "univer:sac/assertions";

export default defineAssertions(({ target, sheetUnit }) => {
  target(({ units }) => {
    units().contains([{ localUnitId: "replace-with-sheet-localUnitId", unitType: "sheet" }]);
  });

  sheetUnit("replace-with-sheet-localUnitId", ({ sheet, range }) => {
    sheet("Summary").exists();
    range("Summary!A2:B2").values([["Widget", 1280]]); // typed values: number stays a number
    range("Summary!B2").displayValue("1,280");
    range("Summary!C2").formula("=SUM(B2:B10)");
    range("Summary!D2:D3").displayValues([["", "12.5%"]]); // display strings; blank = ""
  });
});
```

```bash
UNIVERFILE=./orders.univer
univer sac verify "$UNIVERFILE" --json
```

Inside `sheetUnit`, `range()` is sheet-qualified A1. For `values`/`rawValues`, assert dates and
numbers as numbers (dates are serial numbers like `45344`), not quoted strings; use
`displayValues` or `displayValue` for formatted text. See `references/sac-authoring.md` for the full
method/value-type table and Base/slide/doc/cross-unit examples.

`sheet-keyed-write` is useful after inspecting a stable key column and the target column to update.
It creates ordinary TODO TypeScript source; it does not interpret `--params` as workbook mutation
data. Fill placeholders such as `localUnitId`, `sheetName`, `keyColumn`, `targetColumn`, row scope,
and `valuesByKey` from inspected evidence before applying.

## Roll Back Latest Applied Boundary

```bash
UNIVERFILE=./orders.univer

univer status "$UNIVERFILE"
univer sac rollback "$UNIVERFILE"
univer sac verify "$UNIVERFILE" --json
```

Rollback moves across a SaC applied migration boundary. Verify or inspect the resulting target state
before continuing.
