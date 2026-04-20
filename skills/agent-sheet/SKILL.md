---
name: agent-sheet
description: shell-native spreadsheet CLI for agent work. Use it for reconnaissance, search, fill propagation, programmable workbook logic, and bulk data roundtrips with explicit verification.
metadata:
  openclaw:
    os:
      - linux
      - macos
    requires:
      bins:
        - agent-sheet
      anyBins:
        - awk
        - sed
        - python3
        - python
    install:
      - kind: node
        package: agent-sheet@latest
        bins:
          - agent-sheet
    links:
      repository: https://github.com/dream-num/skills
      documentation: https://github.com/dream-num/skills
---

# agent-sheet

`agent-sheet` is a local-first spreadsheet CLI for agents. Route tasks through the canonical public surface:

- `inspect` for reconnaissance
- `search` for first-class localization
- `fill` for first-class propagation
- `run` for default programmable workbook work
- `pipe out` / `pipe in` for bulk rectangular data transfer

Prefer it when the task needs real workbook structure, formulas, workbook-local logic, or a safe shell roundtrip instead of ad hoc CSV-only handling.

## Use it for

- resolving a workbook and keeping the target explicit with `--entry-id`
- inspecting workbook structure, ranges, formulas, and lint signals
- localizing hits before a mutation with `search`
- propagating formulas or series with `fill`
- importing a local workbook, continuing edits, and exporting a final file
- streaming workbook data through shell tools with `pipe out` / `pipe in`
- using bounded `run` logic when the smaller primitives do not express the task cleanly

## Do not default to

- reopening the workbook with another local workbook library for work `agent-sheet` already covers
- using `run` when `inspect`, `search`, `fill`, or `pipe` already gives a smaller, clearer surface
- trusting entry metadata alone as proof of workbook-visible structure
- finishing after a mutation without a task-specific verification pass

## First path

1. Run [playbooks/00-preflight.md](playbooks/00-preflight.md).
2. Resolve the workbook and keep using `--entry-id`.
3. Choose the smallest matching lane via [references/command-selection-matrix.md](references/command-selection-matrix.md).
4. Verify with [playbooks/15-verify.md](playbooks/15-verify.md) before finishing.

## Hard defaults

- prefer `entryId` over `unitId` for local workbooks and imports
- treat `inspect` as the default first step for reconnaissance
- treat `search` as the default hit-localization surface
- treat `fill` as the default propagation primitive when the workbook already has a correct seed
- treat `run` as the default programmable workbook surface
- treat `pipe out` / `pipe in` as stdin/stdout-first bulk transfer
- verify shell roundtrips with structure plus sample rows, not row count alone
- use `inspect workbook` for workbook-visible structure and handoff verification

## Highest-signal gotchas

- imported local entries can be healthy even when later `file info` shows `unitId: null`; keep operating on `entryId`
- do not use `agent-sheet` as the tool for "user directly edits origin workbook"; that actor should be a real remote user in the browser
- `file info` is metadata only; it does not prove worksheet count, worksheet names, or formula state
- non-English worksheet names work, but quote the full A1 range string in the shell
- shell pipelines can preserve the expected row count while still shifting headers or keys; verify the first rows and key columns after writeback
- if the same `run` fallback repeats, that is product-surface feedback rather than a permanent prompt habit

Read [references/gotchas.md](references/gotchas.md) when the task looks routine but has import/handoff, shell roundtrip, or workspace ambiguity.

## Task routing

| Task | Read next |
|---|---|
| workspace root, CLI resolution, or workbook target is unclear | [playbooks/00-preflight.md](playbooks/00-preflight.md) |
| inspect workbook state, extract bounded data, search, or review formulas | [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) |
| plan the smallest safe mutation path | [references/command-selection-matrix.md](references/command-selection-matrix.md) |
| make data-visible edits or workbook-local changes | [playbooks/20-write-safe.md](playbooks/20-write-safe.md) |
| verify a mutation, shell roundtrip, or handoff | [playbooks/15-verify.md](playbooks/15-verify.md) |
| create, import, open, or export a local workbook | [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) |
| stream workbook data through shell tools | [references/shell-patterns.md](references/shell-patterns.md) |
| formatting, layout, or other primitive gaps | [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) |
| import/handoff, `entryId` targeting, metadata-only checks, or shell verification edge cases | [references/gotchas.md](references/gotchas.md) |

## Output style

- prefer bounded previews, file paths, or stream output over oversized inline dumps
- use `pipe out` for shell pipelines
- use explicit artifacts when the result is large or reused
- when reporting success, include the verification surface you actually used

## Ready-made assets

Use these before improvising shell snippets:

| Asset | Use when |
|---|---|
| [examples/roundtrip-pipe-review-rectangle.md](examples/roundtrip-pipe-review-rectangle.md) | building a review-style dataset through shell roundtrip |
| [examples/handoff-verify.md](examples/handoff-verify.md) | exporting, importing, and proving handoff structure |
| [examples/template-import-anchor-check.md](examples/template-import-anchor-check.md) | importing a template workbook and checking anchor cells |
| [scripts/verify_csv_preview.py](scripts/verify_csv_preview.py) | comparing header, head sample rows, and a key column |
| [scripts/check_csv_cells.py](scripts/check_csv_cells.py) | asserting anchor values or non-empty cells from a CSV snippet |

## Read next

Read only the file needed for the task:

| File | Use when |
|---|---|
| [playbooks/00-preflight.md](playbooks/00-preflight.md) | workspace or workbook context is not yet resolved |
| [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) | inspecting workbook state, extracting data, searching, or reviewing formulas |
| [references/command-selection-matrix.md](references/command-selection-matrix.md) | picking the smallest correct command before a mutation |
| [playbooks/15-verify.md](playbooks/15-verify.md) | proving a mutation or handoff actually succeeded |
| [playbooks/20-write-safe.md](playbooks/20-write-safe.md) | choosing the smallest safe mutation path |
| [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) | creating, importing, opening, or exporting a local workbook |
| [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) | built-in primitives cannot express the requested workbook change |
| [references/shell-patterns.md](references/shell-patterns.md) | the task is naturally a shell pipeline |
| [references/gotchas.md](references/gotchas.md) | the task involves common real-world failure modes |
| [references/js-api-minimal.md](references/js-api-minimal.md) | `run` is necessary and must stay tightly bounded |
| [examples/roundtrip-pipe-review-rectangle.md](examples/roundtrip-pipe-review-rectangle.md) | you need a concrete shell roundtrip example |
| [examples/handoff-verify.md](examples/handoff-verify.md) | you need a concrete export/import handoff example |
| [examples/template-import-anchor-check.md](examples/template-import-anchor-check.md) | you need a concrete non-English template import example |
