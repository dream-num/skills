# Recipes

These are concise command shapes. Replace paths, unit ids, sheet names, and ranges with inspected
facts. Use `../SKILL.md` for mandatory product boundaries and command selection. Examples use
`UNIVERFILE=./orders.univer` for the target path and `WORKTREE_ID=<id>` for the worktree returned by
`worktree add`. Scope commands (`inspect`, `status`, `export`, `open`, `screenshot`, and the SaC
write path) require `--worktree "$WORKTREE_ID"`. When copying a command by itself, set both
variables in the same shell first or replace them with literals.

## Create, Isolate, Materialize, Discover Units

```bash
UNIVERFILE=./orders.univer
univer import --file ./orders.csv "$UNIVERFILE" --json   # or: univer new "$UNIVERFILE"
univer worktree add "$UNIVERFILE" --name task-a       # prints the new worktree id; use it below
WORKTREE_ID=<id-from-add>
univer sac materialize "$UNIVERFILE" --worktree "$WORKTREE_ID" --json > ./materialize.json
printf '%s' '{}' | univer inspect "$UNIVERFILE" --tool units --worktree "$WORKTREE_ID" --params -
```

Read `sidecarPath` from command JSON. Use `unitId` from `units` for unit-specific reads. Pass
`--worktree "$WORKTREE_ID"` (or set `$WORKTREE_ID`) on every read and SaC write so all work stays in
one isolated copy.

## Check Scope State

```bash
UNIVERFILE=./orders.univer

univer status "$UNIVERFILE" --worktree "$WORKTREE_ID" --json    # lifecycle + commit count
univer status "$UNIVERFILE" --worktree "$WORKTREE_ID" --unit "replace-with-unitId" --json
```

Use the actual target `.univer` file path. Do not substitute a directory, display name, sheet name,
or `sessionId` for the target path.

## Open Hosted Viewer Handoff

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --json
```

Open the returned `url` with agent-browser, Playwright, or another browser tool. `SOURCE_URL` must
be browser-fetchable with CORS enabled. A local `.univer` path resolves to its own trunk/worktree
viewer room instead: `univer open "$UNIVERFILE" --worktree "$WORKTREE_ID" --json`.

Use local fallback only when `file.univer.ai` is unreachable:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --local --json
```

Keep the command process running while using the returned local viewer URL. `--local` serves viewer
assets only; it still requires an HTTP(S), browser-fetchable, CORS-enabled source URL.

## Sheet Data Recipes

Sheet range/label/conditional-format/aggregation recipes moved to `unit-sheet.md`. Open it for `sheet`-unit data reads.

## Template Migration, Apply, Verify

```bash
UNIVERFILE=./orders.univer

univer sac migration templates --json
univer sac migration create "update-by-key" "$UNIVERFILE" --template sheet-keyed-write
# edit generated TODO source under the returned sidecar migration path
univer sac apply "$UNIVERFILE" --worktree "$WORKTREE_ID"
univer sac verify "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
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
    units().contains([{ unitId: "replace-with-sheet-unitId", unitType: "sheet" }]);
  });

  sheetUnit("replace-with-sheet-unitId", ({ sheet, range }) => {
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
univer sac verify "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
```

Inside `sheetUnit`, `range()` is sheet-qualified A1. For `values`/`rawValues`, assert dates and
numbers as numbers (dates are serial numbers like `45344`), not quoted strings; use
`displayValues` or `displayValue` for formatted text. See `references/sac-authoring.md` for the full
method/value-type table and Base/slide/doc/cross-unit examples.
For numeric display requirements such as currency, percent, date formatting, or dash-for-zero, keep
logical values typed, apply number/date formatting, and assert both `values` and `displayValues`
when both semantics and presentation matter. Use literal strings or `CellValueType.FORCE_STRING`
only when text identity is the contract, such as SKU, ZIP, ID, code, or preserved leading zeros.

`sheet-keyed-write` is useful after inspecting a stable key column and the target column to update.
It creates ordinary TODO TypeScript source; it does not interpret `--params` as workbook mutation
data. Fill placeholders such as `unitId`, `sheetName`, `keyColumn`, `targetColumn`, row scope,
and `valuesByKey` from inspected evidence before applying.

## Roll Back Latest Applied Boundary

```bash
UNIVERFILE=./orders.univer

univer status "$UNIVERFILE" --worktree "$WORKTREE_ID"
univer sac rollback "$UNIVERFILE" --worktree "$WORKTREE_ID"
univer sac verify "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
```

Rollback removes the latest worktree commit (LIFO). Verify or inspect the resulting scope state
before continuing.

## Hand Off A Worktree For Review

```bash
UNIVERFILE=./orders.univer

univer worktree ready "$UNIVERFILE" --worktree "$WORKTREE_ID"    # mark ready
univer open "$UNIVERFILE" --worktree "$WORKTREE_ID" --json       # give the user a viewer link
univer worktree merge "$UNIVERFILE" --worktree "$WORKTREE_ID"    # user merges (or from the viewer)
univer worktree discard "$UNIVERFILE" --worktree "$WORKTREE_ID"  # or discards
```

After the task is done, mark the worktree ready and `open` it for the user; the user reviews and
decides merge or discard. Merging is normally the user's decision, not an automatic agent step. Merge
is the only path into trunk; on conflict it leaves trunk unchanged, so re-author on the worktree and
merge again. See `worktrees-and-handoff.md`.
