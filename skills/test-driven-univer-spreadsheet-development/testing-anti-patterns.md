# Testing Anti-Patterns

**Load this reference when:** writing or changing assertions, adding mocks, creating workbook fixtures,
tempted to add test-only migration or facade methods, or debugging an assertion that seems easier to
satisfy by changing the test.

## Overview

Assertions must verify workbook behavior, not migration output, mock behavior, or incomplete fixture
shape.

Do not test mock behavior. Test workbook behavior.

**Core principle:** Test what the workbook does, not what the migration happened to write.

Following strict Test-Driven Univer Spreadsheet Development prevents these anti-patterns.

## The Iron Laws

```
1. NEVER test migration echo.
2. NEVER add test-only migration or facade methods.
3. NEVER mock workbook or runtime structures without understanding their side effects.
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

## Anti-Pattern 3: Mocking Workbook Runtime Without Understanding

The violation:

```ts
// Bad: mock returns the expected number without formula recalculation.
mockSheet.getRange("E4").getValue.mockReturnValue(12840);
```

Why this is wrong:

- Formula calculation, used range updates, formatting, validation, and protection have side effects.
- A mock can skip the runtime behavior the assertion is supposed to prove.
- The test can pass while the real workbook fails.

The fix:

- Use real `univer sac verify` assertions when behavior depends on workbook runtime state.
- Mock only lower-level slow or external dependencies after identifying side effects.
- Prefer readonly `univer` probes for debugging, then convert findings into assertions or plan
  updates.

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
2. Run `univer sac verify <workspace> --json`.
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
| "The answer range already proves it." | Answer ranges are evidence windows, not complete contracts. |
| "A broad snapshot is enough." | Snapshots hide which workbook rule failed. Use representative assertions. |
| "Mocking the runtime is faster." | Mocks that hide workbook side effects test the mock, not spreadsheet behavior. |

## Red Flags - STOP and Start Over

- Migration source before a failing assertion
- Assertion passes immediately for new behavior
- Failure reason is setup, typo, stale apply state, or invalid assertion
- Assertion copied from migration output
- Verify run has zero assertions, all skipped packs, or unchecked changed packs
- Helper or mock exists only to make the assertion convenient
- You cannot explain which plan decision the assertion proves

When any red flag appears, return to the plan, delete or revert premature migration source if needed,
write the smallest assertion that should fail, and re-run `univer sac verify <workspace> --json`.

## When Mocks Become Too Complex

Warning signs:

- mock setup is longer than the assertion logic
- mocks recreate workbook runtime behavior
- fixture data omits structures that real workbook behavior consumes
- assertion failures change when mock shape changes

Ask: "Do we need this mock, or should this be a real workbook assertion/probe?"
