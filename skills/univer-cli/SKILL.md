---
name: univer-cli
description: "Use when solving spreadsheet workbook problems with the `univer` CLI as a terminal-native spreadsheet engine: Excel-compatible `.xlsx` handoff, `.univer` univerfiles, SaC sidecar authoring, sidecar inspect scripts, formulas, formatting, charts, shapes, floating images, live preview and viewer review comments, versioning, or export/import handoffs."
---

# univer-cli

`univer` is a spreadsheet engine in the terminal. Use it when an agent needs real workbook
semantics: sheets, ranges, formulas, formatting, layout, previews, imports, exports, or versioned
workbook state.

Install the CLI with `npm i -g univer-cli`. Update the CLI with `univer update`. The executable is
`univer`.

## Core Mental Model

Treat workbook-visible state as the source of truth. A successful command summary, local metadata,
or internal storage state does not prove that sheet names, cell values, formulas, formatting, or
exported handoff files are correct.

The workbook path is the local identity. Pick one explicit path such as `./budget.univer` and use
that path as the CLI target. Do not target workbooks by `sessionId`, internal storage ids, or
runtime ids. When a multi-unit command asks for a local unit scope, pass the explicit
`--local-unit-id` for that command without treating it as the file identity.

`.univer` files are CLI operation targets, not agent-editable data stores. Do not read or patch
univerfile internals. For durable workbook changes, the current path is SaC source:
`univer sac materialize`, `univer sac migration create`, `univer sac apply`, and
`univer sac verify`.

Pure import/export handoff work may stay on `univer import` and `univer export`. Other workbook
inspection or mutation work should first materialize the SaC sidecar and use the returned
`sidecarPath` as the agent's primary workspace. The materialized sidecar already contains useful
structure, docs, generated source, and type information.

`univer inspect <univerfile> --file <script.js>` is a read-only auxiliary probe. The script must be
a `.js` file under `<sidecarPath>/inspect-scripts/`. It is scratch space: create scripts as needed,
read the JSON-compatible stdout, and delete them when they no longer help. Durable workbook changes
belong in SaC migration packs, not inspect scripts.

Use `univer help` and `univer help <command...>` for exact syntax. Important current topics include
`univer help inspect`, `univer help sac`, `univer help sac workflow`, `univer help sac authoring`,
`univer help sac assertions`, `univer help view`, and `univer help status`.

## Use When

Use this skill when the task involves spreadsheet or workbook work, especially:

- creating, importing, exporting, or handing off `.xlsx`, `.csv`, or `.univer` files
- inspecting workbook shape, sheets, ranges, formulas, formatting, or visible cell state
- locating content-defined rows, columns, headers, or cells before editing
- making bounded edits to cells, formulas, formatting, charts, shapes, floating images, layout, or
  sheet structure
- writing generated matrix data back into a sheet-qualified range
- previewing workbook state locally with `univer view`
- reading submitted local viewer review comments with `univer view comments`
- creating, restoring, resetting, pulling, or syncing local workbook changesets
- proving that a workbook-visible mutation or export is correct enough to hand back

## Default Operating Loop

1. Pick one explicit workbook path, for example `./budget.univer`.
2. Create or import a workbook first if no `.univer` target exists.
3. Unless the task is pure import/export, run `univer sac materialize "$WB" --json` and read the
   returned `sidecarPath`.
4. Inspect the materialized sidecar first: README, generated migration source, generated types,
   plans, success criteria, applied-state docs, and existing assertions.
5. Use `inspect-scripts/*.js` only when the materialized sidecar does not already expose the
   workbook-visible fact you need.
6. Mutate durable workbook behavior through SaC migration packs, not ad hoc runtime scripts.
7. Verify with `univer sac verify "$WB" --json` and the returned assertion evidence when assertions
   exist.
8. Export only after verification when the user needs a handoff file.
9. After changes have been verified, if the user may need to inspect, audit, or review the final
   workbook, check the current agent tool surface first. If a browser tool is available, run
   `univer view "$WB" --no-open --json`, open the returned URL with that browser tool, and include
   the URL in your response. If no browser tool is available, run `univer view "$WB" --open --json`;
   `--open` uses the OS browser opener, and the CLI returns a prepared URL and diagnostic if the
   browser cannot be opened automatically.
10. Commit or sync only after verified changes when versioning is part of the workflow.

## Hard Rules

- Do not read `.univer` internals to infer workbook contents.
- Do not write, patch, rewrite, rename, or manipulate internal univerfile storage contents.
- Do not inspect internal metadata, snapshots, mutation logs, or storage fragments as a substitute
  for workbook-visible reads.
- Do not guess sheet names, row numbers, formulas, ranges, or changed cells from memory or file
  metadata.
- Do not treat stdout summaries as proof of workbook state. Verify with workbook-visible evidence.
- Do not put durable workbook changes in `inspect-scripts/`.
- Do not invent commands or runtime APIs. Check `univer help` and the materialized sidecar docs.

Direct storage access can corrupt workbooks or teach the agent false state. If the CLI cannot read
what you need, diagnose the CLI/runtime path instead of bypassing it.

## Command Selection

| Need | Prefer |
| --- | --- |
| Discover exact command syntax | `univer help`, `univer help <command...>` |
| Start a local univerfile from a blank file or spreadsheet source | `univer new` or `univer import --file <input.xlsx|csv|url> <file.univer>` |
| Hand back Excel-compatible output | `univer export` |
| Begin any non-export/import workbook work | `univer sac materialize <univerfile> --json`, then read `sidecarPath` |
| Understand workbook shape before editing | Materialized sidecar README/source/types first; sidecar `univer inspect` script only as auxiliary readback |
| Locate content-defined cells | Sidecar inspect script scanning bounded sheets/ranges after materialize |
| Read rectangular data | Sidecar inspect script returning `getValues()`, `getDisplayValues()`, or `getFormulas()` |
| Write a known rectangular matrix back | SaC migration pack with explicit sheet and A1 range boundaries, then `sac apply` and `sac verify` |
| Apply bounded workbook-local logic | SaC migration pack |
| Create or maintain workbook charts | SaC migration pack using chart Facade APIs, plus `univer view` for visual review |
| Create or maintain workbook shapes and connectors | SaC migration pack using shape Facade APIs, plus `univer view` for visual review |
| Create or maintain workbook floating images | SaC migration pack using drawing/image Facade APIs, plus `univer view` for visual review |
| Preview readonly workbook state | If an agent browser tool is available, run `univer view "$WB" --no-open --json` and open the returned URL with the tool; otherwise run `univer view "$WB" --open --json`. Use `--no-open --json` for known headless, remote, CI, server, or no-browser environments |
| Read local viewer review feedback | `univer view comments "$WB" --json` |
| Check local versioning state | `univer status` |
| Create a local changeset from local mutations | `univer commit --message <message>` |
| Discard uncommitted local mutations | `univer restore` |
| Reset local unsynced commits | `univer reset --soft HEAD~N` or `univer reset --hard HEAD~N` |
| Append an existing remote unit to a local `.univer` file | `univer import --remote-unit-id <unitId> <file.univer>` |
| Initialize an empty local file from an existing remote unit | `univer clone <file.univer> --unit-id <unitID>` |
| Pull remote-only changes for a bound local unit | `univer pull` |
| Sync local and remote versioning state | `univer sync` |
| Create a SaC migration pack | `univer sac migration create <description> <univerfile>` |
| Apply, roll back, or verify SaC source | `univer sac apply <univerfile>`, `univer sac rollback <univerfile>`, `univer sac verify <univerfile> --json` |
| Diagnose runtime problems | `univer doctor`, `univer daemon status` |
| Prepare a bug report or Univer team support artifact after user authorization | `univer doctor collect` |

Use canonical command help such as `univer help inspect`, `univer help sac workflow`,
`univer help view`, and `univer help status`. Top-level help group headings are visual sections
only; do not run group-prefixed topics.

## Execution Results

Treat non-zero exit as failure even when stdout is partially present. Read stderr before changing
approach; it usually contains the stable diagnostic code, usage, and retry examples.

Keep command stdout machine-readable when a script consumes it. If diagnostics are needed, capture
stderr separately so downstream tools receive only the intended JSON or file path.

```bash
univer sac materialize "$WB" --json > ./materialize.json
SIDECAR=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('./materialize.json','utf8')).sidecarPath)")
mkdir -p "$SIDECAR/inspect-scripts"
cat > "$SIDECAR/inspect-scripts/read-range.js" <<'JS'
() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sheet1");
  if (!sheet) return { success: false, error: "Sheet1 not found" };
  return {
    success: true,
    displayValues: sheet.getRange("A1:D20").getDisplayValues()
  };
}
JS
univer inspect "$WB" --file "$SIDECAR/inspect-scripts/read-range.js" > ./range.json 2> ./range.err
status=$?
if [ "$status" -ne 0 ]; then
  sed -n '1,80p' ./range.err
  exit "$status"
fi
sed -n '1,40p' ./range.json
rm -f "$SIDECAR/inspect-scripts/read-range.js"
```

## Workflow Recipes

These are verified command shapes. Replace paths, sheet names, and ranges with inspected workbook
facts.

### Create Or Import, Then Materialize

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

### Locate Before Editing

Use a read-only sidecar inspect script before editing when the target is defined by visible workbook
content:

```bash
SIDECAR=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('./materialize.json','utf8')).sidecarPath)")
mkdir -p "$SIDECAR/inspect-scripts"
cat > "$SIDECAR/inspect-scripts/find-west.js" <<'JS'
() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Orders") ?? workbook.getActiveSheet();
  const values = sheet.getRange("A1:Z200").getDisplayValues();
  const matches = [];
  for (let row = 0; row < values.length; row += 1) {
    for (let col = 0; col < values[row].length; col += 1) {
      if (String(values[row][col]).includes("West")) {
        matches.push({ row: row + 1, col: col + 1, value: values[row][col] });
      }
    }
  }
  return { sheetName: sheet.getSheetName(), matches };
}
JS
univer inspect "$WB" --file "$SIDECAR/inspect-scripts/find-west.js"
rm -f "$SIDECAR/inspect-scripts/find-west.js"
```

Return match metadata that is useful for the edit: sheet name, row, column, header context, and a
bounded value preview. Keep the scan bounded to the task's known sheets or likely used ranges.

### Read Range Data

Use read-only sidecar inspect scripts when the agent needs rectangular workbook data. Return display
values for human-facing checks, raw values for numeric comparisons, and formulas when formula
structure matters.

```bash
cat > "$SIDECAR/inspect-scripts/read-sheet1.js" <<'JS'
() => {
  const sheet = univerAPI.getActiveWorkbook().getSheetByName("Sheet1");
  if (!sheet) throw new Error("Sheet1 not found");
  return {
    displayValues: sheet.getRange("A1:D4").getDisplayValues(),
    formulas: sheet.getRange("A1:D4").getFormulas()
  };
}
JS
univer inspect "$WB" --file "$SIDECAR/inspect-scripts/read-sheet1.js"
rm -f "$SIDECAR/inspect-scripts/read-sheet1.js"
```

### Write Generated Table Data

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

Verification should prove headers, sample rows, key columns, and formulas. Row count alone is weak
evidence because shifted columns can still preserve row count.

### Use A Sidecar Inspect Script

Inspect scripts should:

- live under `<sidecarPath>/inspect-scripts/`
- use a `.js` extension
- wrap code in `() => { ... }` or `async () => { ... }`
- return JSON-compatible data with explicit success or error fields
- use explicit workbook, sheet, and A1 range boundaries
- prefer A1 notation for fixed workbook-facing locations
- remember numeric coordinate overloads are 0-based
- wait for formula calculation with the documented formula wait API before reading same-probe
  computed results
- remain read-only; any persistable write, create unit, or delete unit should fail

### Create Or Maintain Charts

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

### Create Or Maintain Shapes

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

### Create Or Maintain Floating Images

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

### Preview Locally

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

### Version Verified Changes

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

### Clone, Pull, And Sync

Use `import --remote-unit-id` when a remote workbook unit already exists and should be appended to a local `.univer` file. The target file is created when missing; if it already exists, the
remote-bound unit is added without replacing existing units. The command accepts the raw remote unit
id; URLs are not accepted.

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

### SaC Sidecar Baseline

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

### Export Handoff

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

## Script And Handoff Rules

Use small sidecar inspect scripts or exported handoff files to reduce large ranges before bringing
data back to the agent. Diagnostics and help belong outside the data stream a script consumes.

- Keep ranges explicit and sheet-qualified.
- Quote the full A1 range string, especially for non-English or shell-sensitive sheet names.
- Stage intermediate files when you need a stable preview or assertion.
- Keep inspect scripts under `<sidecarPath>/inspect-scripts/` and delete scratch probes when done.
- Put durable workbook edits in migration packs, not inspect scripts.
- Verify with `univer sac verify`, sidecar inspect readback, `view`, or export/import roundtrip
  after every writeback.

Avoid `pnpm dev -- ...` in clean machine-readable examples. The pnpm/tsx wrapper can print logs to
stdout and corrupt streamed data. Use the installed `univer` executable or another entrypoint you
have proven emits clean stdout.

## Gotchas

- Internal metadata does not prove sheet names, formulas, changed cells, or handoff correctness.
- Univerfile storage contents are not a meaningful way to infer spreadsheet data. Use public CLI
  reads instead.
- Local file identity is the workbook path, such as `./budget.univer`, not `unitId`, `sessionId`, or
  internal ids.
- Command success is not enough after import, mutation, export, or handoff. Verify
  workbook-visible state.
- A non-zero exit means the operation failed. Read stderr for the diagnostic, usage, and retry
  guidance.
- Quote the full range: `Sheet1!A1:J20`, not just the sheet name fragment.
- Shell row counts can pass while headers, columns, or keys shift. Check headers, samples, and key
  columns together.
- `inspect` is read-only auxiliary probing. It is not a mutation surface and is not SaC completion
  evidence.
- `view` is readonly preview. Do not treat it as mutation verification unless the task is visual
  review.
- Charts are maintained through SaC migration packs and the Pro Charts facade. Do not edit chart
  resource internals or expect CLI probes to export chart images.
- Shapes are maintained through SaC migration packs and the Pro Shapes facade. Do not inspect
  private drawing resource storage or expect CLI probes to export shape images.
- Floating images are maintained through SaC migration packs and the Sheets Drawing facade. Do not
  invent a top-level image command or inspect private drawing resource storage.
- `commit` is local only; use `sync` to push local changesets.
- `restore` discards only uncommitted local mutations; it does not remove local commits.
- `reset` is local-only and limited to `HEAD~N` over unsynced local commits. Do not use it as a
  remote revert or force-push workflow.
- `sync` does not push uncommitted local mutations. Commit verified workbook changes first.
- If `sync` reports an invalid remote binding, stop and diagnose the local unit or remote setup.
- `pull` requires a local unit already bound to a remote unit. Use `sync` for first remote creation,
  `import --remote-unit-id` to append an existing remote unit to a `.univer` file, or
  `clone --unit-id` to initialize an empty local file from an existing remote unit.
- `clone` replaced older remote binding wording. Do not use or invent a `bind` command.
- If runtime-backed commands fail to start, inspect `univer daemon status` before retrying blindly.
- If workbook-visible reads disagree with internal metadata, trust workbook-visible reads first.

## Support

Only enter support flow when the user asks to report a suspected CLI bug. Public issues: https://github.com/dream-num/skills/issues. Community support and builder discussions: https://discord.gg/nThHPupraR. Private artifacts: email developer@univer.ai; get authorization before guiding `univer doctor collect`.

Skill document revision: 2026-06-06.
