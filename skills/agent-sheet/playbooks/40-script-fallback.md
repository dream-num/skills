# Script Fallback Playbook

## When to use

Use `script js` when workbook-native API logic is the clearest bounded path, or when built-in `agent-sheet` commands cannot express the requested workbook change cleanly.

Typical reasons:

- workbook formatting or layout work
- freeze panes, row or column sizing, or visibility changes
- merge or unmerge behavior
- bounded clear/rewrite flows inside a sheet
- multi-step workbook-native range logic that would be awkward as shell stitching
- another workbook-native API flow with a clear sheet and range boundary

Do not use `script js` for:

- ordinary cell writes, table writeback, or sheet lifecycle already covered by built-in commands
- broad mutations with unclear workbook boundaries
- guessed API methods

## Before you run it

- state why built-in commands are not enough
- list the touched sheets and A1 ranges
- decide how the result will be verified
- read [../references/js-api-minimal.md](../references/js-api-minimal.md) and stay inside the documented subset

## Hard rules

- keep the script workbook-local: no network, filesystem, shell, or process side effects
- use explicit `getSheetByName(...)`
- keep the script small and scoped
- return a structured object
- if formulas are written and then read, wait for calculation to finish
- if the same fallback keeps recurring, treat that as product work rather than a permanent prompt habit

## Verification

- data-visible changes: verify with `read range`, `inspect sheet`, or `inspect workbook`
- presentation-only changes: return a structured execution summary and do not claim independent verification when built-in commands cannot inspect that visual state

## Minimal examples

Data-visible change:

```bash
agent-sheet script js --entry-id <entry-id> --code '() => {
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
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:B5"
```

Bounded clear and rewrite:

```bash
agent-sheet script js --entry-id <entry-id> --code '() => {
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
agent-sheet script js --entry-id <entry-id> --code '() => {
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

- the script would touch broad or poorly understood regions
- you cannot describe the touched sheets/ranges before execution
- the plan depends on guessed API methods instead of documented ones
- the same category of script keeps recurring and should likely become a first-class product surface

## Output contract

Include:

- why built-in commands were insufficient
- exact workbook boundary touched
- what the script changed or returned
- verification outcome
