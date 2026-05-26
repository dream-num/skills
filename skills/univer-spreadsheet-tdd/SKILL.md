---
name: univer-spreadsheet-tdd
description: "Use when authoring SaC or Facade Migration Pack spreadsheet migrations that need assertion-backed Spreadsheet TDD with assertions.ts and univer sac verify feedback."
---

# univer-spreadsheet-tdd

Spreadsheet TDD means developing spreadsheet behavior as SaC source: ordered Facade Migration Packs plus executable `assertions.ts` contracts verified by `univer sac verify`.

Ordinary workbook edits can and should be verification-first, but they are not Spreadsheet TDD. For direct workbook inspection, import/export, bounded edits, preview, or versioning work, use `univer-cli`.

## Operating Contract

- Treat `migrations/` as source and the workbook artifact as generated output.
- Treat each non-trivial migration pack's `assertions.ts` as the workbook-visible contract.
- Do not read `.univer` or `.unv` package internals as assertion evidence.
- Do not claim a SaC migration is complete from `univer sac apply` success alone.
- Completion requires the latest relevant `univer sac verify <workspace> --json` run to report `passed`.

## Plan First

Before editing migration source, write a short plan:

1. Requested workbook-visible outcomes.
2. Ordered Facade Migration Packs needed to deliver them.
3. Assertion gate for each planned migration.
4. Explicit non-goals for the current migration or pass.

Use multiple focused migrations when the task has multiple durable workbook intents, such as creating a sheet, loading a data model, adding formulas, and adding review output. Each migration should have one clear rollback boundary and its own assertion gate.

Do not split by individual cells, individual commands, or incidental implementation steps. A single migration is correct when the task has one coherent workbook intent.

## Assertion Contract

Every non-trivial migration pack you create or modify needs an `assertions.ts` in the same pack before handoff. Assert workbook-visible outcomes: sheet existence, used range, representative values, formulas, and other stable user-facing facts.

Keep assertions small and deterministic. Prefer representative ranges over broad workbook snapshots.

```ts
import { defineAssertions } from "univer:sac/assertions";

export default defineAssertions(({ sheet, range }) => [
  sheet("Revenue").exists(),
  sheet("Revenue").usedRange("A1:C4"),
  range("Revenue!A1:C2").values([
    ["Region", "Q1", "Q2"],
    ["West", 1200, 1400],
  ]),
  range("Revenue!C4").formula("=SUM(C2:C3)"),
]);
```

For exact helper behavior, run `univer help sac assertions`.

## Feedback Loop

After editing source or assertions:

1. Run `univer sac apply <workspace>` when the migration is not yet applied.
2. Run `univer sac verify <workspace> --json`.
3. Read the JSON summary and the referenced `.sac/runs/<run-id>/verify-report.json`.
4. If status is `failed`, inspect failures for pack id, assertion kind, target, expected value, actual value, and first difference when present.
5. Decide whether the migration source is wrong or the assertion expectation is wrong, repair it, then apply or verify again.
6. If status is `error`, treat it as setup failure: fix config, missing target, source validation, bundling, or runtime setup before judging workbook behavior.
7. Repeat until the relevant verification status is `passed`.

If verification passes with skipped packs, mention skipped packs when they are relevant. A changed pack must not be skipped unless the task explicitly excludes assertions.

## Handoff

Final handoff for a SaC Spreadsheet TDD task must include:

- the migration plan outcome, including any multiple migration sequence actually used
- the final verification command
- the final status
- the `verify-report.json` path
- any relevant skipped packs or explicit assertion-free scope
