---
name: test-driven-univer-spreadsheet-development
description: "Use when implementing or repairing Univer SaC spreadsheet behavior with assertions.ts, Facade Migration Packs, univer sac apply, univer sac verify, or verify-report loops."
---

# Test-Driven Univer Spreadsheet Development

Test-Driven Univer Spreadsheet Development is SaC adapted TDD: workbook behavior is complete only
when assertion contracts prove the changed packs through `univer sac verify`.

This is not generic code TDD. The goal is correct spreadsheet behavior: Excel domain semantics,
range roles, formulas, computed values, formatting, validation, protection, preservation, and
negative constraints.

<EXTREMELY-IMPORTANT>
NO MIGRATION PACK IMPLEMENTATION WITHOUT A PLAN-DERIVED FAILING ASSERTION FIRST.

If you wrote migration source before the assertion failed for the intended workbook-visible reason:
Delete or revert the migration source change and restart from the plan-derived assertion gate.

No exceptions:

- Do not keep it as reference.
- Do not adapt it while writing assertions.
- Do not leave it commented out.
- Implement fresh from the plan-derived failing assertion.
</EXTREMELY-IMPORTANT>

## When to Use

Use this skill for:

- new or changed Facade Migration Packs
- `assertions.ts` coverage
- `univer sac apply` or `univer sac verify` repair loops
- workbook-visible behavior changes in SaC source
- refactoring SaC source while preserving workbook behavior

Exceptions require explicit user agreement and must be recorded in the handoff.

## Operating Contract

- Use `writing-univer-plans` first for complex workbook behavior.
- Use `executing-univer-plans` when following a written plan pack-by-pack.
- Treat `assertions.ts` as the workbook-visible contract for each non-trivial changed pack.
- Allow bounded bootstrap or readonly probes when needed, but never use them as final completion
  evidence.
- Do not claim completion from `univer sac apply` success.
- Do not claim completion from a zero-assertion, all-skipped, or unchecked changed pack verify run.

## Testing Anti-Patterns Reference

Load this reference when writing or changing assertions, creating workbook fixtures, using readonly
probes as proof, or tempted to add test-only migration or facade methods:
`testing-anti-patterns.md`.

The reference covers migration echo, readonly probe completion claims, partial workbook fixtures,
test-only production surface, rationalizations, and STOP conditions.

## Good Assertions

| Quality | Good | Bad |
| --- | --- | --- |
| Minimal | One workbook behavior decision per assertion | One broad snapshot covering many rules |
| Clear | Names the sheet, range, and behavior being proved | `assert output is correct` |
| Domain-grounded | Derives expected values from plan evidence | Copies whatever the migration wrote |
| Runtime-aware | Checks computed values when formulas matter | Checks formula text only |

## Why Order Matters

Assertions written after migration source are biased by implementation. They answer "what did this
migration write?" instead of "what workbook behavior should exist?"

Plan-derived failing assertions force Excel-domain decisions to happen before code. Watching the
assertion fail proves the gate catches missing behavior. Passing later proves the Migration Pack
satisfied that workbook contract.

Manual preview, `univer sac apply`, and readonly probes are useful evidence, but they are not a
repeatable completion gate. The repeatable gate is `univer sac verify <workspace> --json` plus the
corresponding `verify-report.json`.

## Red-Green-Repair

```dot
digraph test_driven_univer_spreadsheet_development {
    rankdir=LR;
    red [label="RED\nPlan-derived assertion", shape=box, style=filled, fillcolor="#ffcccc"];
    verify_red [label="Verify fails\nfor right workbook reason", shape=diamond];
    green [label="GREEN\nMinimal Migration Pack", shape=box, style=filled, fillcolor="#ccffcc"];
    verify_green [label="Verify passes\nwith report evidence", shape=diamond];
    repair [label="REPAIR\nSource, assertion, or plan", shape=box, style=filled, fillcolor="#ccccff"];
    next [label="Next pack", shape=ellipse];

    red -> verify_red;
    verify_red -> green [label="yes"];
    verify_red -> red [label="wrong failure"];
    green -> verify_green;
    verify_green -> repair [label="yes"];
    verify_green -> green [label="no"];
    repair -> verify_green [label="stay green"];
    verify_green -> next;
}
```

### RED - Write the Assertion First

Derive assertions from the plan: user intent, baseline evidence, range roles, final-layout reasoning,
and Contract Decision Evidence.

Do not derive assertions from whatever the migration happened to write.

Assertions should cover:

- workbook-visible final state: sheets, used ranges, headers, representative values, formulas, and
  computed values
- Excel domain semantics: signs, categories, period boundaries, text casing, blank-versus-zero,
  stored value type, display-critical values, and formula behavior
- range role preservation: source data, helper/control input, lookup/reference, example/demo,
  existing output, and preserve-only ranges
- boundary and negative constraints: no extra headings, no helper sheets, cleared tails, no
  unintended overwrite, no unwanted formatting changes
- workbook-behavior contract decisions: output shape, sorting, grouping, mapping,
  value/formula semantics, formatting/presentation, interaction/validation/protection,
  preservation, and negative constraints
- meaningful cases: first, middle, last, blank, zero, date-boundary, text-boundary, and
  grouping-boundary rows when relevant

Keep assertions small and deterministic. Prefer representative ranges over broad workbook snapshots.

### Verify RED - Watch It Fail

Run:

```bash
univer sac verify <workspace> --json
```

Confirm:

- the assertion fails
- the failure is about the intended workbook-visible behavior
- the failure is not a typo, missing fixture, setup error, stale apply state, or invalid assertion

If the assertion passes immediately, it is not a useful gate for new behavior. Strengthen it or
choose the next missing behavior from the plan.

### GREEN - Implement the Minimal Pack Change

Edit the Migration Pack only after the assertion gate fails correctly.

Implement only what the current pack and assertion require. Do not add unrelated sheets, helper
ranges, broad formatting, or future behavior.

### Verify GREEN - Use the Report

Run apply when the relevant migration is not yet applied, then verify:

```bash
univer sac apply <workspace>
univer sac verify <workspace> --json
```

Read the JSON summary and `.sac/runs/<run-id>/verify-report.json`.

If status is `failed`, inspect pack id, assertion kind, target, expected value, actual value, and
first difference when present. Decide whether the migration source or assertion expectation is wrong
before changing either.

If status is `error`, fix setup, config, missing target, source validation, bundling, or runtime setup
before judging workbook behavior.

### REPAIR - Keep the Contract Honest

Readonly probes such as inspect, pipe out, or readonly runtime commands may help debug failures.
Convert useful probe findings back into the plan, migration source, or assertions, then return to
`univer sac verify`.

If verification changes expected behavior, update the plan before or alongside source/assertion
repairs.

## Assertion Coverage Rules

For each high-risk decision recorded in the plan's Contract Decision Evidence table, add at least one
assertion or readonly probe that distinguishes the chosen rule from a plausible wrong rule.

Examples:

- sort/group/truncation decisions: verify first, middle, last, and the first excluded candidate when
  output capacity is limited
- mapping decisions: verify representative source-to-target coordinates, including one row for each
  side of a category, sign, blank/zero, or boundary mapping when relevant
- text decisions: verify exact casing, whitespace, abbreviations, and stored value type
- structural decisions: verify section headers, segment boundaries, and first/last row after the
  final layout is determined

A passed assertion that only mirrors the migration output is not enough when the underlying semantic
decision was ambiguous.

Assertions cannot turn an underdetermined assumption into workbook-proven truth. When the plan marks
a decision as `underdetermined assumption`, assertions should verify that the implementation
consistently applies the declared assumption, and the final handoff should preserve that uncertainty
instead of presenting it as decisive workbook evidence.

## Passing Gate

For non-trivial SaC TDD handoff:

- the latest relevant `univer sac verify <workspace> --json` status must be `passed`
- every pack created or modified for the task must be checked unless explicitly assertion-free
- each changed pack must have at least one passed assertion
- skipped packs must be mentioned when relevant
- zero-assertion and all-skipped runs are not completion signals

## Final Handoff

The final handoff must include:

- plan outcome and pack sequence
- verification command
- final status
- `verify-report.json` path
- changed pack assertion evidence
- skipped packs, if relevant
- auxiliary probes used, if any, and why they were not completion evidence
