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

## Read A Known Range

```bash
UNIVERFILE=./orders.univer

cat > ./range.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId",
  "sheetName": "Sheet1",
  "rangeA1": "A1:D20",
  "include": ["normalizedValues", "valueDetails", "formulas", "numberFormats", "semanticStyles"]
}
JSON
univer inspect "$UNIVERFILE" --tool sheet-range --params ./range.params.json
```

Prefer normalized values for ordinary text decisions. Opt into exact raw/display/cell data only
when the task needs that distinction.

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

## Roll Back Latest Applied Boundary

```bash
UNIVERFILE=./orders.univer

univer status "$UNIVERFILE"
univer sac rollback "$UNIVERFILE"
univer sac verify "$UNIVERFILE" --json
```

Rollback moves across a SaC applied migration boundary. Verify or inspect the resulting target state
before continuing.
