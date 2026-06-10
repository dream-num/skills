# univer-cli workflow recipes

These are verified command shapes. Replace paths, sheet names, and ranges with inspected workbook
facts. Mandatory rules, command selection, and completion evidence live in `../SKILL.md`.

## Create Or Import, Then Materialize

```bash
WB=./orders.univer
univer import --file ./orders.csv "$WB" --json
univer sac materialize "$WB" --json > ./materialize.json
```

Use `new` when the task starts from a blank workbook:

```bash
WB=./workbook.univer
univer new "$WB" --name "Workbook"
univer sac materialize "$WB" --json > ./materialize.json
```

Read `sidecarPath` from the JSON. Use that path for plans, success criteria, migration source,
generated types, and scratch inspect scripts.

Before unit-specific evidence, discover the relevant unit's `localUnitId`, unit type, name, and
capability status from the materialized sidecar, command JSON, or `inspect-tools/units.js`.
Replace `replace-with-discovered-sheet-localUnitId` in examples with that discovered sheet unit id.

## Locate Before Editing

Use a read-only managed inspect tool before editing when the target is defined by visible workbook
content. `sheet-search.js` is a good starting point when you know visible text but not coordinates;
switch to `sheet-neighborhood.js` or `sheet-range.js` once an anchor or rectangle is clear:

```bash
SIDECAR=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('./materialize.json','utf8')).sidecarPath)")
cat > ./find-west.params.json <<'JSON'
{
  "localUnitId": "replace-with-discovered-sheet-localUnitId",
  "sheetName": "Orders",
  "rangeA1": "A1:Z200",
  "query": "West",
  "types": ["normalizedValues"],
  "match": "contains",
  "neighborhood": 1,
  "maxResults": 50
}
JSON
univer inspect "$WB" --script "$SIDECAR/inspect-tools/sheet-search.js" --params ./find-west.params.json
```

Return match metadata that is useful for the edit: sheet name, row, column, header context, and a
bounded value preview. Keep the scan bounded to the task's known sheets or likely used ranges.

## Read Range Data

Use read-only managed inspect tools when the agent needs rectangular workbook data. Prefer
normalized values for ordinary labels, copied text, matching, grouping, and write decisions. Request
raw values, display values, cell data, or value details only when the task explicitly depends on
exact storage text, multi-line cell contents, typed value/display distinctions, rich cell data, or
export/debug evidence.

When sheet shape is unclear, `sheet-overview.js` is a useful first read. Inspect `regions` when
present: region evidence exposes candidate non-empty rectangular areas with their own bounded
head/tail samples, which is useful for spotting side-by-side tables, uneven table heights, footers,
formulas, spacer columns, and true blank tails without dumping the whole sheet. This is guidance,
not a required sequence; combine managed tools or fall back to a bounded scratch probe when the
evidence question needs something else.

```bash
cat > ./read-sheet1.params.json <<'JSON'
{
  "localUnitId": "replace-with-discovered-sheet-localUnitId",
  "sheetName": "Sheet1",
  "rangeA1": "A1:D4",
  "include": ["normalizedValues", "valueDetails", "formulas", "numberFormats", "semanticStyles"]
}
JSON
univer inspect "$WB" --script "$SIDECAR/inspect-tools/sheet-range.js" --params ./read-sheet1.params.json
```

Use this contract-oriented `sheet-range.js` read when assertions depend on typed values, formulas,
formats, or semantic style traits. Keep raw style ids and raw `cellData.s` snapshots out of plans and
assertions; use `styles` or `backgroundColors` assertions for workbook-visible style contracts.
For large evidence, add `--format compact` to get a lossless scan-friendly view; keep JSON for
programmatic parsing and tests.

## Write Generated Table Data

Write workbook changes as SaC migration source. Create one migration pack, edit the generated
`pack.ts`, add one or more unit migration files with explicit workbook, sheet, and A1 boundaries,
and write `assertions.ts` for the workbook-visible result.

```bash
univer sac migration create "Write West Summary" "$WB" --json
# Edit <sidecarPath>/migrations/<pack-id>/pack.ts and unit migration files.
# Add assertions.ts beside pack.ts.
univer sac apply "$WB" --json
univer sac verify "$WB" --json
```

Verification should prove headers, sample rows, key columns, formulas, and changed workbook
resources. Use `styles`, `backgroundColors`, `conditionalFormats`, `filter`, or `tables` assertions
when formatting, native conditional formatting, filters, or table resources are part of the task.
Row count alone is weak evidence because shifted columns can still preserve row count.

## Use A Sidecar Inspect Script

Inspect scripts should:

- live under `<sidecarPath>/inspect-scripts/`
- use a `.js` extension
- wrap code in `() => { ... }` or `async () => { ... }`
- return JSON-compatible data with explicit success or error fields
- use explicit target path, `localUnitId`, sheet, and A1 range boundaries
- prefer A1 notation for fixed workbook-facing locations
- remember numeric coordinate overloads are 0-based
- wait for formula calculation with the documented formula wait API before reading same-probe
  computed results
- remain read-only; any persistable write, create unit, or delete unit should fail

## Create Or Maintain Charts

Use SaC migration packs for workbook-local charts and `univer view` for visual inspection.
Command-line verification can use sidecar inspect scripts to read facade state such as
`sheet.getCharts()`, `chart.getChartId()`, `chart.getRange()`, `chart.getSeriesData()`, and
`chart.getCategoryData()`.

In migration source, seed or choose a source range, configure `sheet.newChart()`, call `build()`,
then insert it with `sheet.insertChart(chartInfo)`. Use `chart.updateRange()` or
`sheet.removeChart(chart)` for maintenance.

Special chart types have stricter source shapes:

- Most charts use a category-plus-series table, for example `month, sales, cost`.
- Relation charts require a node/type matrix: first column is node, second column is type/category,
  remaining columns are the numeric relation matrix. For `N` nodes, use `N` data rows and `N + 2`
  columns.
- Sankey charts require a `source, target, value` edge list. The third column must be numeric; avoid
  reverse edges that create circular Sankey data.
- Bubble charts need numeric `x`, `y`, and `size` columns.
- Heatmap charts use the first column as y-axis labels, remaining headers as x-axis labels, and
  remaining cells as numeric heat values.

## Create Or Maintain Shapes

Use SaC migration packs for workbook-local shapes and connectors and `univer view` for visual
inspection. Command-line verification can use sidecar inspect scripts to read facade state such as
`sheet.getShapes()`, `shape.isLineShape()`, `shape.getShapeId()`, `shape.getShapeType()`,
`shape.getPosition()`, `shape.getSize()`, `shape.getStartConnectInfo()`, and
`shape.getEndConnectInfo()`.

In migration source, configure `sheet.newShape()`, call `build()`, then insert it with
`sheet.insertShape(shapeInfo)`. Use `sheet.newConnector()` for connector lines,
`sheet.connectShapes()` to attach connector endpoints to facade shape objects from the same
worksheet, `sheet.newShape(existingShape)` with `sheet.updateShape(updatedShapeInfo)` for updates,
and `sheet.removeShape(shape)` for deletion.

Use `univerAPI.Enum.ShapeTypeEnum` with `setShapeType()`. Common starts are `Rect`, `RoundRect`,
`Ellipse`, `Diamond`, flowchart values such as `FlowchartProcess`, and connector values such as
`StraightConnector1`, `BentConnector3`, or `CurvedConnector3`. Use shape facade enums for fill,
stroke, dash, cap, join, and arrows: `ShapeFillEnum`, `ShapeGradientTypeEnum`, `ShapeLineTypeEnum`,
`ShapeLineDashEnum`, `ShapeLineCapEnum`, `ShapeLineJoinEnum`, `ShapeArrowTypeEnum`, and
`ShapeArrowSizeEnum`.

The shapes guidance covers workbook-local floating shapes and connectors only. It does not export
shape images, perform browser screenshots, or provide an interactive shape editor.

## Create Or Maintain Floating Images

Use SaC migration packs for workbook-local floating images and `univer view` for visual inspection.
Command-line verification can use sidecar inspect scripts to read facade state such as
`sheet.getImages()`, `sheet.getImageById(id)`, `image.getId()`, `image.toBuilder().getSource()`,
`image.toBuilder().getSourceType()`, and update or delete return values.

In migration source, configure `sheet.newOverGridImage()`, call `buildAsync()`, then insert it with
`sheet.insertImages([image])`. Use `image.toBuilder()` with `sheet.updateImages([newImage])`,
direct `FOverGridImage` methods such as `setSizeAsync()` or `setPositionAsync()`, or
`sheet.deleteImages([image])` for maintenance.

Use `univerAPI.Enum.ImageSourceType.URL` for HTTP(S) image URLs and full data URLs,
`ImageSourceType.BASE64` for raw base64 payloads, and `ImageSourceType.UUID` only for existing
Univer-managed image or file UUIDs. For predictable report placement, start with
`univerAPI.Enum.SheetDrawingAnchorType.Position`.

The images guidance covers floating images only. It does not cover cell images, floating DOM,
screenshot export, local image upload helpers, or a top-level image command.

## Preview Locally

Use preview when visual confirmation helps. Check the current agent tool surface first. If a browser
tool is available, run `univer view "$WB" --no-open --json` and open the returned URL with that
browser tool. If no browser tool is available, use `--open --json`; `--open` uses the OS browser
opener, not an agent runtime's built-in browser. The CLI returns a prepared URL and diagnostic if
the browser cannot be opened automatically. Use `--no-open --json` in known headless, remote, CI,
server, or no-browser environments when you only need the URL. The server process remains active
until stopped.

```bash
# Agent runtime with a browser tool:
univer view "$WB" --no-open --json

# No browser tool / local desktop handoff:
univer view "$WB" --open --json

# Known headless, remote, CI, server, or no-browser environments:
univer view "$WB" --no-open --json
```

When a human submits review feedback in the local viewer, read it without reopening the browser:

```bash
univer view comments "$WB" --json
univer view comments --session "<session-id>" --all --json
```

By default, `view comments` returns actionable submitted comments that are not resolved. Use `--all`
when you need pending, submitted, and resolved comments for audit context. These are local viewer
review comments, not workbook-native cell notes or collaboration thread comments; the command is
read-only and does not start a host, open a browser, create a session, or mutate the workbook.

Use `univer help view` for port and browser-opening options.

## Version Verified Changes

Check status before committing. Commit only after workbook-visible verification.

```bash
univer status "$WB"
univer commit "$WB" --message "Update review ranges"
univer status "$WB"
```

`commit` creates a local changeset from current local mutations. It does not push to a remote.

Use `restore` when current uncommitted workbook mutations should be discarded while preserving local
commits and synced history.

```bash
univer status "$WB"
univer restore "$WB"
univer status "$WB"
```

Use `reset --soft HEAD~N` to remove the last N local unsynced commits and restore their mutations as
uncommitted local mutations. Use `reset --hard HEAD~N` to remove the last N local unsynced commits
and discard current uncommitted local mutations.

```bash
univer status "$WB"
univer reset "$WB" --soft HEAD~1
univer status "$WB"

univer reset "$WB" --hard HEAD~1
univer status "$WB"
```

`reset` only accepts `HEAD~N` targets and only operates on local unsynced commits. It does not
rewrite synced changesets or remote history.

## Clone, Pull, And Sync

Use `import --remote-unit-id` when a remote workbook unit already exists and should be appended to a
local `.univer` file. The target file is created when missing; if it already exists, the remote-bound
unit is added without replacing existing units. The command accepts the raw remote unit id; URLs are
not accepted.

```bash
WB=./budget.univer
univer import --remote-unit-id unit-remote "$WB" --json
univer status "$WB"
univer view "$WB" --no-open --json
```

Use `clone` for the narrower case where a remote workbook unit should initialize an empty local
file. The target `.univer` path must be nonexistent or empty.

```bash
WB=./budget.univer
univer clone "$WB" --unit-id unit-remote --json
univer status "$WB"
univer view "$WB" --no-open --json
```

Use `pull` when you only need missing remote changesets for a local unit already bound to a remote
unit. Use `sync` to sync local and remote versioning state.

```bash
univer status "$WB"
univer pull "$WB"
univer status "$WB"

univer commit "$WB" --message "Update review ranges"
univer sync "$WB"
univer status "$WB"
```

`sync` creates the remote workbook first when the local unit is still local-only. It pulls remote
changes and pushes local changesets, but it does not push uncommitted local mutations. Remote
endpoints come from `collaboration.defaultRemote` and `collaboration.remotes.<name>.url`.

## SaC Sidecar Baseline

Use SaC when workbook behavior should be maintained as ordered Facade Migration Pack source. The
target remains the explicit `.univer` path; authoring source lives in `<hidden-sidecar>/`. Use
`sidecarPath` and `reportPath` from SaC command JSON instead of appending `.sac` to the target. On
POSIX, `Budget.univer` resolves to `.Budget.univer.sac/`; on Windows, `Budget.univer.sac/` is used
with the hidden filesystem attribute.

```bash
univer sac materialize "$WB" --json
univer sac migration create "Add Revenue Model" "$WB" --json
univer sac apply "$WB" --json
univer sac verify "$WB" --json
```

Use `univer sac rollback "$WB"` to undo the newest applied SaC pack. Do not use stale workspace or
rebuild workflows. For non-trivial SaC source work, route through `writing-univer-plans`,
`executing-univer-plans`, and `test-driven-univer-development`.

## Export Handoff

Export after workbook-visible verification proves the workbook state. Then prove the handoff file
exists and, when useful, can be imported back.

```bash
univer sac verify "$WB" --json
univer export "$WB" ./handoff.xlsx --json
test -s ./handoff.xlsx
univer import --file ./handoff.xlsx ./handoff.univer --json
univer sac materialize ./handoff.univer --json
```

Use `.xlsx` for Excel handoff when workbook interoperability matters. Use CSV only when plain
rectangular data is enough for the handoff.
