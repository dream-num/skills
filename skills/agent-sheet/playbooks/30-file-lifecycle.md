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
| inspect entry metadata | `file info --entry-id <id> --json` | workbook status and metadata |
| open resolved workbook | `file open --entry-id <id> --json` | workbook open payload |
| export workbook | `file export --entry-id <id> --output <path>` | local file output |

## Boundary rules

- prefer flows that resolve an `entryId` first and then keep using `--entry-id`
- if local import or export is unavailable in the installed build, stop and report the blocker
- local export hard-fails when the local snapshot JSON exceeds `100MB`

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
agent-sheet inspect workbook --entry-id <entry-id>
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
agent-sheet inspect workbook --entry-id <entry-id>
...
agent-sheet file export --entry-id <entry-id> --output <target.xlsx>
```

Keep the workbook target explicit with `--entry-id`, and keep the export path explicit as well.

### Inspect local entry metadata

```bash
agent-sheet file info --entry-id <entry-id> --json
```

### Open local workbook

```bash
agent-sheet file open --entry-id <entry-id> --json
```

### Export

```bash
agent-sheet file export --entry-id <entry-id> --output ./output.xlsx
```

## Stop / escalate

Stop and escalate when:

- local import or local export is unavailable in the installed build
- local export is blocked by the `100MB` snapshot guard
- the requested `entryId` does not resolve to a workbook in the current workspace

## Output contract

Report:

- entry source and workbook status
- `entryId`
- exported file path when applicable
