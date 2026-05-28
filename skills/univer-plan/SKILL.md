---
name: univer-plan
description: "Use when planning complex SaC workbook behavior, Facade Migration Packs, workbook range roles, migration boundaries, or assertion gates before implementation."
---

# univer-plan

Plan complex SaC workbook behavior before editing migration source. The plan is a source-first authoring artifact, not chat-only notes.

## Output Location

Write or update a plan file under the SaC workspace:

```text
<workspace>/plans/<topic>.md
```

Use an existing project naming convention if one exists. Keep the plan close to `migrations/` and `assertions.ts` so future agents can understand the workbook behavior from source.

## Required Plan Shape

```md
## Workbook Intent

- User-visible outcome:
- Explicit non-goals:

## Baseline Evidence

- Source already read:
- Readonly probes:
- Unknowns:

## Range Roles

- Source data:
- Target output:
- Helper/control input:
- Lookup/reference:
- Example/demo:
- Existing output:
- Preserve-only:

## Workbook Behavior Contract

- Visible target/state:
- Source/input dependency:
- Shape/layout boundary:
- Ordering/grouping/mapping policy:
- Value/formula semantics:
- Formatting/presentation semantics:
- Interaction/validation/protection behavior:
- Preservation and negative constraints:
- Example/demo/answer-range handling:

## Migration Packs

1. `<pack-id>`: durable workbook intent
   - reads:
   - writes:
   - must preserve:
   - rollback/verify boundary:
   - assertion gate:

## TDD Gates

- Assertions to write or update first:
- Allowed bootstrap/probe:
- Completion verify command:
```

## Range Role Rules

For every relevant range role, say whether the migration may read it, write it, replace it, or must preserve it.

Range roles include source data, target output, helper/control input, lookup/reference, example/demo, existing output, and preserve-only areas.

Source data, helper/control input, lookup/reference, example/demo, existing output, and preserve-only ranges are not target output unless the user explicitly says to change them. If an example/demo range is used to infer a formula, layout, or behavior, capture that reasoning in the plan and add assertion gates that distinguish the real target output from the example.

Answer ranges and output ranges are constraints and evidence windows. They do not prove that the top-left cell is the output start or that the range contains the full contract.

## Workbook Behavior Contract Rules

For complex workbook behavior, fill the relevant Workbook Behavior Contract fields before editing migration source. The contract should turn ambiguous workbook-visible behavior into explicit plan choices that assertions can verify.

Output-heavy transformations should capture shape, mapping, ordering, and value/formula semantics. Formatting, validation, protection, chart, comment, layout, or sheet-structure changes should capture visible state, presentation or interaction semantics, preservation rules, and negative constraints.

## Pack Decomposition

Split by durable workbook intent:

- create or reshape a sheet
- load or normalize a data model
- add a formula family
- generate review or summary output
- add presentation or validation behavior

Do not split by individual cells, individual Facade calls, or incidental implementation steps. A pack is well-sized when it has one clear workbook intent, a reasonable rollback boundary, and its own assertion gate.

## Completion Gate

Do not edit migration source for a complex SaC behavior until the plan identifies:

- workbook-visible intent and non-goals
- range roles and preservation rules
- workbook behavior contract choices for complex behavior
- ordered Migration Packs
- assertion gate for each non-trivial changed pack

If `univer-tdd` verification changes the expected behavior, update the plan in `plans/` before or alongside source/assertion repairs.
