# Recipes

These are concise command shapes. Replace paths, unit ids, sheet names, and ranges with inspected
facts. Use `../SKILL.md` for mandatory product boundaries and command selection.

## Import, Materialize, Discover Units

```bash
WB=./orders.univer
univer import --file ./orders.csv "$WB" --json
univer sac materialize "$WB" --json > ./materialize.json
printf '%s' '{}' | univer inspect "$WB" --tool units --params -
```

Read `sidecarPath` from command JSON. Use `localUnitId` from `units` for unit-specific reads.

## Read A Known Range

```bash
cat > ./range.params.json <<'JSON'
{
  "localUnitId": "replace-with-localUnitId",
  "sheetName": "Sheet1",
  "rangeA1": "A1:D20",
  "include": ["normalizedValues", "valueDetails", "formulas", "numberFormats", "semanticStyles"]
}
JSON
univer inspect "$WB" --tool sheet-range --params ./range.params.json
```

Prefer normalized values for ordinary text decisions. Opt into exact raw/display/cell data only
when the task needs that distinction.

## Locate A Label Then Read Around It

```bash
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
univer inspect "$WB" --tool sheet-search --params ./search.params.json
```

Use the returned coordinate as input to `sheet-neighborhood` or `sheet-range` when context is
needed.

## Custom Readonly Probe

```bash
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
  | univer inspect "$WB" --script "$SIDECAR/inspect-scripts/probe.js" --params -
```

Scratch probes are function expressions, not ESM or CommonJS modules; do not use `export default` or
`module.exports`. Keep custom probes readonly and task-local. Keep output bounded: return aggregate
facts and a few samples; if matching fails, return `ok: false`, counts, field diagnostics, and
bounded samples instead of dumping every unknown row. Promote repeated useful probes to managed tools
in a separate product change.

## Template Migration, Apply, Verify

```bash
univer sac migration templates --json
univer sac migration create "update-by-key" "$WB" --template sheet-keyed-write
# edit generated TODO source under the returned sidecar migration path
univer sac apply "$WB"
univer sac verify "$WB" --json
```

Choose a template only after workbook-visible evidence shows it fits. If no template fits, create an
ordinary migration pack.

## Roll Back Latest Applied Boundary

```bash
univer status "$WB"
univer sac rollback "$WB"
univer sac verify "$WB" --json
```

Rollback moves across a SaC applied migration boundary. Verify or inspect the resulting workbook
state before continuing.
