# Script Fallback Playbook

## When to use

Use `script js` only when the canonical command surface cannot express the requested operation with acceptable precision.

Typical acceptable reasons:

- the mutation requires a JS-only API that has no `write.*` or `sheet.*` equivalent
- the task needs bounded workbook formatting or advanced API calls not exposed canonically
- the script is tightly scoped and you can explain exactly which sheet/range it will touch

Common examples:

- borders, fonts, colors, alignment, number formats
- freeze panes or row/column sizing and visibility
- merge / unmerge behavior
- direct workbook-native API flows that are awkward with current canonical commands

Do not use `script js` just because it is flexible. If `write.*` or `sheet.*` already expresses the task clearly, stay on the canonical path.

## Required input

- explicit statement of the canonical gap
- explicit workbook boundary
- planned touched sheets and A1 ranges
- verification plan

Before writing the script, read [../references/js-api-minimal.md](../references/js-api-minimal.md) and restrict yourself to documented methods.

## Defaults

- prefer explicit sheet lookup via `getSheetByName`
- keep `script js` workbook-local only: no network, no filesystem, no shell or process side effects
- keep the script minimal and return a structured object
- if formulas are written and then read, wait for calculation to apply
- if the same fallback keeps recurring, it should probably become product work rather than a permanent prompt habit
- prefer returning changed ranges, affected sheet names, or computed values so follow-up verification stays cheap

## Verification modes

Choose the verification strategy that matches the kind of change:

### Data-verifiable script

Use this when the script changes values, formulas, merge state that affects layout, or structure that canonical CLI can observe.

Verify with one or more of:

- `read range`
- `inspect sheet`
- `inspect workbook`

### Presentation-only script

Use this when the script changes styling or workbook presentation that current CLI surfaces do not expose directly, for example:

- borders
- fonts
- colors
- alignment
- freeze panes

In this mode:

- return a structured execution summary from the script itself
- include target sheet names and A1 ranges in the returned payload
- do not claim canonical CLI independently verified the visual state when no such inspect surface exists
- report the result as "execution confirmed, visual state not independently inspectable via canonical CLI"

## Core sequence

1. Prove the canonical gap

```bash
agent-sheet --help
```

If the gap is about styling, freeze panes, merge behavior, or other workbook-native presentation APIs, `script js` is a reasonable path.

2. Run the smallest bounded script

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

3. If formulas were written, use async calculation sync

```bash
agent-sheet script js --entry-id <entry-id> --code 'async () => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sales");
  if (!sheet) {
    return { success: false, error: "Sales not found" };
  }
  sheet.getRange("A1").setFormula("=SUM(B1:B10)");
  await univerAPI.getFormula().onCalculationResultApplied();
  return {
    success: true,
    touchedSheets: ["Sales"],
    changedRanges: ["Sales!A1"],
    value: sheet.getRange("A1").getValue(),
  };
}'
```

4. Verify according to change type

```bash
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:B5"
```

For structural changes, add a structural check as well:

```bash
agent-sheet inspect sheet --entry-id <entry-id> --sheet "Sheet1"
```

For presentation-only changes, prefer a richer script return object instead of pretending `read range` can verify styling:

```bash
agent-sheet script js --entry-id <entry-id> --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Summary");
  if (!sheet) {
    return { success: false, error: "Summary not found" };
  }
  const range = sheet.getRange("A1:D10");
  range.setBackgroundColor("#f3f4f6");
  return {
    success: true,
    verificationMode: "presentation-only",
    touchedSheets: ["Summary"],
    changedRanges: ["Summary!A1:D10"],
    note: "Visual state applied but not independently inspectable via canonical CLI",
  };
}'
```

## Stop / escalate

Stop and escalate when:

- the script would touch broad or poorly understood regions
- you cannot describe the touched sheets/ranges before execution
- the plan depends on guessed API methods instead of documented ones
- the same category of script is being repeated often enough that it should likely become a product surface or bundled helper

## Output contract

Include:

- why canonical commands were insufficient
- exact workbook boundary touched
- what the script changed or returned
- verification outcome

Prefer mentioning:

- target sheet names
- changed A1 ranges
- whether formula sync was required
- whether verification was canonical or presentation-only
