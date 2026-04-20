# Script Fallback Playbook

## When to use

Use `run` when workbook-native API logic is the clearest bounded path, or when built-in `agent-sheet` primitives cannot express the requested workbook change cleanly.

Typical reasons:

- workbook formatting or layout work
- freeze panes, row or column sizing, or visibility changes
- merge or unmerge behavior
- bounded clear/rewrite flows inside a worksheet
- multi-step workbook-native range logic that would be awkward as shell stitching
- another workbook-native API flow with a clear worksheet and range boundary

Do not use `run` for:

- ordinary reconnaissance already covered by `inspect`
- ordinary localization already covered by `search`
- propagation already covered by `fill`
- rectangular bulk transfer already covered by `pipe`
- guessed API methods

## Before you run it

- state why the smaller primitives are not enough
- list the touched worksheets and A1 ranges
- decide how the result will be verified
- read [../references/js-api-minimal.md](../references/js-api-minimal.md) and stay inside the documented subset

## Hard rules

- keep the code workbook-local: no network, filesystem, shell, or process side effects
- use explicit `getSheetByName(...)`
- keep the code small and scoped
- return a structured object
- if formulas are written and then read, wait for calculation to finish
- if the same fallback keeps recurring, treat that as product work rather than a permanent prompt habit

## Verification

- data-visible changes: verify with `inspect`, `pipe out`, or `search`
- presentation-only changes: return a structured execution summary and do not claim independent verification when built-in primitives cannot inspect that visual state

## Minimal examples

Data-visible change:

```bash
agent-sheet run --entry-id <entry-id> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sheet1");
  if (!sheet) {
    return { success: false, error: "Sheet1 not found" };
  }
  sheet.getRange("A1").setValue("done");
  return {
    success: true,
    touchedSheets: ["Sheet1"],
    changedRanges: ["Sheet1!A1"],
  };
}'
```

Then verify with a normal readback:

```bash
agent-sheet pipe out --entry-id <entry-id> --range "Sheet1!A1:B5" --format csv
```

Bounded clear and rewrite:

```bash
agent-sheet run --entry-id <entry-id> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sheet1");
  if (!sheet) {
    return { success: false, error: "Sheet1 not found" };
  }
  sheet.getRange("A20:E200").clearContent();
  return {
    success: true,
    touchedSheets: ["Sheet1"],
    changedRanges: ["Sheet1!A20:E200"],
  };
}'
```

Presentation-only change:

```bash
agent-sheet run --entry-id <entry-id> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Summary");
  if (!sheet) {
    return { success: false, error: "Summary not found" };
  }
  const range = sheet.getRange("A1:D10");
  range.setBackgroundColor("#f3f4f6");
  range.setHorizontalAlignment("center");
  return {
    success: true,
    verificationMode: "presentation-only",
    touchedSheets: ["Summary"],
    changedRanges: ["Summary!A1:D10"],
    note: "Visual state applied but not independently inspectable via built-in commands",
  };
}'
```

## Stop / escalate

Stop and escalate when:

- the code would touch broad or poorly understood regions
- you cannot describe the touched worksheets or ranges before execution
- the plan depends on guessed API methods instead of documented ones
- the same category of fallback keeps recurring and should likely become a first-class product surface

## Output contract

Include:

- why the smaller primitives were insufficient
- exact workbook boundary touched
- what the code changed or returned
- verification outcome
