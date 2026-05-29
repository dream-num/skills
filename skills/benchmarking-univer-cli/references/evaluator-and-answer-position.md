# Evaluator And Answer Position

Load this reference before interpreting benchmark `answer_position`, final output layout, high-risk
semantic decisions, or evaluator-facing verification.

## Evaluator Contract

- answer_position is the final evaluator inspection window.
- The evaluator compares stored values from the final `.xlsx` with openpyxl `data_only=True`.
- Formula text, styles, and formatting may still matter to the workbook task, but benchmark value
  scoring reads the final cached/stored values in `answer_position`.
- Exact text, casing, whitespace, abbreviations, blank-versus-zero values, text-versus-number
  values, dates, percentages, currencies, identifiers, and error placeholders matter when they are
  workbook-visible.
- spreadsheet_content is only a first-rows preview. It is not the complete workbook and is not a
  substitute for inspecting the prepared SaC workspace.

## Range Roles

Before editing, classify nearby workbook ranges by role:

- source data
- target output
- example/demo result
- helper/control input
- lookup/reference table
- existing output
- preserve-only area

Use `answer_position` to constrain ambiguous placement and to define evaluator-visible checks, but
do not let it suppress explicit instruction requirements.

## Answer Position Rules

- Treat `answer_position` as the final target/check range.
- If the instruction explicitly asks for workbook-visible changes outside `answer_position`, perform
  and verify those changes.
- Do not preserve cells immediately before `answer_position` as headers or examples unless the
  instruction or workbook evidence says to preserve them.
- For large `answer_position` ranges, verify representative first, middle, and last cells plus
  boundary rows, blank-versus-zero cases, exact text, and helper/example ranges that should remain
  unchanged.
- For structural edits, reason about the final workbook layout before interpreting answer_position.
  Inserted/deleted rows, moved tables, section headers, transposition, or reshaping can shift where
  the final evaluator window lands.

## Complex Output Contract

For sorting, filtering, grouping, matching, consolidation, dynamic ranges, formulas, or multiple
output columns, write a concise output contract before migration source changes. Include:

- final target shape
- source-to-target mapping
- ordering/sort precedence
- whether sorting happens before grouping, filtering, or truncation
- exact text provenance, including casing, whitespace, and abbreviations
- blank/zero/error/display-text policy
- formula boundary cases
- segmented table headers, examples, demo ranges, and preserve-only ranges

When an instruction combines sorting with grouped or filtered extraction, sort the source range first
in the final-layout model, then derive each group's output order from that final source order unless
the instruction names a separate intra-group sort key. Do not independently sort computed output
values unless explicitly requested.

## High-Risk Semantic Gate

Evidence must be discriminating evidence: it must make at least one plausible interpretation
unlikely, not merely be compatible with the chosen interpretation.

For each high-risk semantic decision:

1. List plausible interpretations.
2. Identify the instruction phrase, source cells, sample/reference cells, headers, or
   workbook-visible pattern that supports the chosen interpretation.
3. Mark evidence strength as `explicit`, `inferred`, or `underdetermined assumption`.
4. Add an assertion or readonly probe that would fail if a plausible wrong interpretation were used.

High-risk decisions include:

- conflicting sort clauses
- whether sorting happens before grouping/filtering/truncation
- source-to-target column mapping
- sign-to-column mapping such as positive/negative, debit/credit, increase/decrease, in/out, or
  inflow/outflow
- blank-versus-zero-versus-text-placeholder policy
- exact text provenance
- section or segmented-table boundary handling
- formula repair strategy versus static value materialization

Separate observed workbook facts from semantic labels. Source-side facts such as sign patterns,
adjacent balance changes, or category frequencies can prove source behavior, but they do not by
themselves prove which target label or output column should receive that source category.

If evidence supports multiple interpretations, mark it as `underdetermined assumption`. In this
non-interactive benchmark, proceed with the best-effort rule only when necessary and keep the
uncertainty visible.

## Structural Verification

For structural changes or data reshaping, verify at least three mappings after the final layout is
determined:

- first target cell
- one middle target cell
- last target cell

For each mapping, record the source coordinate, final target coordinate, and semantic key such as
date, header, category, identifier, or section.

When process-order wording conflicts with final-output wording, treat explicit final-output wording
as the final target contract. For sorting/filtering/grouping tasks, build the full candidate set,
apply the final ordering rule, then truncate to the evaluator/output range unless the instruction
explicitly says to truncate first.
