# Local Workbook Lifecycle Playbook

## When to use

Use this lane when the task is about creating, importing, opening, or exporting a local workbook rather than editing cell contents directly.

## Required input

- workspace root
- one of: workbook name, local file path, or `entryId`
- desired end state: created workbook, imported workbook, opened metadata, or exported file

## Command routes

| Intent | Command | Result |
|---|---|---|
| start a fresh local workbook | `file create <name> --json` | new local `entryId` |
| start from local `xlsx` / `csv` | `file import <path> --json` | imported local `entryId` |
| inspect entry metadata | `file info --entry-id <id> --json` | metadata only |
| inspect workbook structure | `sheet list --entry-id <id> --json` or `inspect workbook --entry-id <id>` | sheets and workbook-visible structure |
| open resolved workbook | `file open --entry-id <id> --json` | workbook open payload |
| export workbook | `file export --entry-id <id> --output <path>` | local file output |

## Boundary rules

- resolve an `entryId` first and keep using `--entry-id`
- for imported local entries, trust the `entryId` from `file import` even if later `file info` shows `unitId: null`
- use `file info` for mode, origin, and local-vs-remote metadata only
- use `sheet list` or `inspect workbook` for sheet count, sheet names, and handoff structure checks
- local export hard-fails when the local snapshot JSON exceeds `100MB`
- legacy `file export --manifest ...` and `file use` are removed surfaces; treat invalid-args failure as expected

## Core flows

### Fresh local workbook

```bash
agent-sheet file create <name> --json
agent-sheet inspect workbook --entry-id <entry-id>
```

Extract the returned `entryId` from the JSON response, then continue with `--entry-id`.

### Local file import

```bash
agent-sheet file import ./input.xlsx --json
agent-sheet sheet list --entry-id <entry-id> --json
```

If local import fails, stop and report the blocker. Do not claim the workbook is available unless `file import` actually returned an `entryId`.

Import semantics:

- `file import` does not mutate the source file in place
- the imported workbook is maintained as an isolated local entry inside the runner/workspace
- whether edits land on the original path or a new path is decided later by `file export --output <path>`

### Explicit export target workflow

Use this when you want to import one file and later export the edited workbook to a specific path.

```bash
agent-sheet file import <source.xlsx> --json
agent-sheet sheet list --entry-id <entry-id> --json
...
agent-sheet file export --entry-id <entry-id> --output <target.xlsx>
test -s <target.xlsx>
```

Keep the workbook target explicit with `--entry-id`, and keep the export path explicit as well.

### Inspect local entry metadata

```bash
agent-sheet file info --entry-id <entry-id> --json
```

Treat this as metadata, not workbook structure.

### Open local workbook

```bash
agent-sheet file open --entry-id <entry-id> --json
```

### Export

```bash
agent-sheet file export --entry-id <entry-id> --output ./output.xlsx
test -s ./output.xlsx
```

### Imported workbook with non-English sheet names

Quote the full A1 range string in the shell:

```bash
agent-sheet read range --entry-id <entry-id> --range '工作表1!A1:J3' --format csv --to-stdout
```

Reusable assets:

- [../examples/template-import-anchor-check.md](../examples/template-import-anchor-check.md)
- [../scripts/check_csv_cells.py](../scripts/check_csv_cells.py)

## Stop / escalate

Stop and escalate when:

- local import or local export is unavailable in the installed build
- local export is blocked by the `100MB` snapshot guard
- the requested `entryId` does not resolve to a workbook in the current workspace
- handoff verification depends on `file info` alone

## Output contract

Report:

- entry source and workbook status
- `entryId`
- workbook structure verification surface used
- exported file path when applicable
