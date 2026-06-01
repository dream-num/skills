# Testing Anti-Patterns

**Load this reference when:** writing or changing assertions, creating workbook fixtures, using
readonly probes as completion evidence, tempted to add test-only migration or facade methods, or
debugging an assertion that seems easier to satisfy by changing the test.

## Overview

Assertions must verify workbook behavior, not migration output, readonly probe findings, or
incomplete fixture shape.

Do not treat readonly probes as completion evidence. Verify workbook behavior through
`univer sac verify` and its `verify-report.json`.

**Core principle:** Test what the workbook does, not what the migration happened to write.

Following strict Test-Driven Univer Development prevents these anti-patterns.

## The Iron Laws

```text
1. NEVER test migration echo.
2. NEVER add test-only migration or facade methods.
3. NEVER use readonly probes as completion evidence.
4. NEVER treat partial workbook fixtures as complete workbook evidence.
```

## Anti-Pattern 1: Testing Migration Echo

The violation:

```ts
// Bad: expected values copied from the migration implementation.
assertRange("Summary!B2:B4", ["East", "West", "Total"]);
```

Why this is wrong:

- It verifies what the migration wrote, not what the plan requires.
- It passes even when the mapping, ordering, or truncation rule is wrong.
- It hides missing workbook-visible evidence.

The fix:

```ts
// Good: expected values come from plan evidence and source-to-target mapping.
assertRange("Summary!B2:B4", ["East", "North", "West"]);
assertComputedValue("Summary!E4", 12840);
```

Gate function:

```text
Before writing any expected value:
  Ask: "Did this expectation come from the plan and workbook evidence?"

  IF it came from migration output:
    STOP - rewrite the assertion from the plan.
```

### Variant: Assertion Rewritten To Match Migration Output

The violation:

```text
Verify failed because actual Summary!B3 was "West".
The assertion was changed from "North" to "West" without updating the plan evidence.
```

Why this is wrong:

- It turns `verify-report.json` actual output into the new requirement.
- It erases the signal that the Migration Pack disagreed with the plan.
- It lets implementation order decide workbook semantics.

The fix:

- Reopen the plan and identify which evidence decides the value, order, formula, format, or range.
- If the plan is wrong or underdetermined, update the plan first.
- If the plan is right, repair the Migration Pack and keep the assertion unchanged.

## Anti-Pattern 2: Test-Only Migration Or Facade Methods

The violation:

```ts
// Bad: production migration API exists only for assertion convenience.
pack.__dumpInternalRowsForTest();
```

Why this is wrong:

- It adds production surface that workbook users do not need.
- It can bypass the workbook runtime, formula engine, formatting, validation, or protection state.
- It makes the assertion depend on implementation internals instead of workbook-visible behavior.

The fix:

- Put test helpers in assertion utilities or readonly probes.
- Verify through workbook-visible ranges, formulas, computed values, formats, validation, protection,
  or report output.
- Keep Migration Packs focused on durable workbook behavior.

## Anti-Pattern 3: Readonly Probe As Completion Evidence

The violation:

```text
Readonly probe:
  Summary!E4 => 12840

Claim:
  "The workbook is done."
```

Why this is wrong:

- A readonly probe is a sample observation, not a repeatable pack-level contract.
- It may read stale apply output, one convenient coordinate, or a state unrelated to the changed
  pack.
- It does not prove skipped packs, unchecked changed packs, formula recomputation, preservation, or
  negative constraints.
- It does not leave assertion evidence in `internal/sac/runs/<run-id>/verify-report.json`.

The fix:

1. Use readonly probes only for baseline discovery or debugging.
2. Convert useful probe findings into the plan, assertion source, or Migration Pack source.
3. Run `univer sac verify <package.univer> --json`.
4. Read `internal/sac/runs/<run-id>/verify-report.json`.
5. Mention probes in the handoff only as auxiliary evidence, not completion evidence.

## Anti-Pattern 4: Partial Workbook Fixtures

The violation:

```text
Fixture contains only the target sheet and values, but omits lookup sheets, formats,
validations, protected ranges, hidden helper rows, or formula dependencies.
```

Why this is wrong:

- partial workbook fixtures hide structural assumptions.
- Missing sheets or metadata can make assertions pass in isolation and fail in real workbooks.
- Formatting, validation, protection, and formula dependencies are workbook behavior.

The fix:

- Include all workbook structures the behavior may consume.
- Name omitted structures explicitly in the plan as non-goals or impossible evidence.
- Use readonly probes to confirm fixture shape before relying on it.
- Do not shrink the workbook to only the target sheet unless the plan explains why omitted
  structures cannot affect behavior.

## Anti-Pattern 5: Integration Verification As Afterthought

The violation:

```text
Migration implemented.
No plan-derived failing assertion observed.
"Ready for testing."
```

Why this is wrong:

- Testing is part of implementation, not a handoff chore.
- Without RED, the assertion may not catch missing behavior.
- Without `verify-report.json`, there is no pack-level completion evidence.

The fix:

```text
1. Write plan-derived assertion.
2. Run `univer sac verify <package.univer> --json`.
3. Confirm expected FAIL.
4. Implement minimal Migration Pack change.
5. Verify PASS and read `verify-report.json`.
```

## Common Rationalizations

| Excuse | Reality |
| --- | --- |
| "I'll write assertions after the migration works." | Tests-after mirror the implementation. Start over from a failing assertion. |
| "This is only formatting." | Formatting is workbook-visible behavior and needs an assertion gate. |
| "SaC apply passed." | Apply success is not behavior proof. Verify assertions and read the report. |
| "The readonly probe shows the right value." | Probe output is auxiliary evidence. Convert it into assertions and verify. |
| "The answer range already proves it." | Answer ranges are evidence windows, not complete contracts. |
| "A broad snapshot is enough." | Snapshots hide which workbook rule failed. Use representative assertions. |
| "The fixture is smaller but equivalent." | Equivalence must be proven or recorded in the plan. |
| "I changed the expected value because verify showed the actual value." | That rewrites the contract from implementation output. Re-check plan evidence. |

## Red Flags - STOP and Start Over

- Migration source before a failing assertion
- Assertion passes immediately for new behavior
- Failure reason is setup, typo, stale apply state, or invalid assertion
- Assertion copied from migration output
- Assertion changed after a migration failure without a plan update
- Readonly probe used as final proof
- Verify run has zero assertions, all skipped packs, or unchecked changed packs
- Fixture omits sheets, formats, validations, protected ranges, helper rows, or formula dependencies
- Helper exists only to make the assertion convenient
- You cannot explain which plan decision the assertion proves

When any red flag appears, return to the plan, delete or revert premature migration source if needed,
write the smallest assertion that should fail, and re-run `univer sac verify <package.univer> --json`.

## When Probes Or Fixtures Become Too Comfortable

Warning signs:

- probe recipe is longer than the assertion logic
- fixture setup recreates workbook behavior by hand
- fixture data omits structures that real workbook behavior consumes
- the same migration passes in a reduced fixture but fails in the real workbook
- assertion failures disappear only after current output is copied into expected values

Ask: "Can this be a real plan-derived assertion against the workbook, or is it only a convenient
observation?"
