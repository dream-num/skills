# File Lifecycle Playbook

## When to use

Use this lane when the task is about starting, attaching, promoting, opening, or exporting a workbook entry rather than editing cell contents directly.

## Required input

- workspace root
- one of: workbook name, local file path, `entryId`, or remote `unitId`
- desired end state: local entry, remote entry, exported file, or opened metadata

## Command routes

| Intent | Command | Result |
|---|---|---|
| start a fresh local workbook | `file create <name> --json` | new local `entryId` |
| start from local `xlsx` / `csv` | `file import <path> --json` | imported local `entryId` |
| import and immediately go remote | `file import <path> --push --json` | same `entryId`, now remote |
| promote existing local entry | `file push --entry-id <id> --json` | same `entryId`, now remote |
| bind a raw remote workbook id | `file attach <unit-id> --json` | remote `entryId` |
| inspect entry metadata | `file info --entry-id <id> --json` | entry mode and binding |
| open resolved workbook | `file open --entry-id <id> --json` | session/open payload |
| export workbook | `file export --entry-id <id> --output <path>` | local or remote file output |

## Boundary rules

- only `file attach` accepts a raw remote `unitId`
- `file push` only works on local entries
- `file import --push` bootstraps locally first, then upgrades the same entry to remote mode
- local import is runtime-managed and may fail if the installed `uexcli` converter cannot be resolved
- `file export` supports local and remote entries
- local export is runtime-managed and may fail if the installed `uexcli` converter cannot be resolved
- local export hard-fails when the local snapshot JSON exceeds `100MB`; remote export is the fallback path

## Core flows

### Fresh local workbook

```bash
CREATE_JSON=$(agent-sheet file create <name> --json)
ENTRY_ID=$(printf '%s' "$CREATE_JSON" | jq -r '.entryId')
agent-sheet inspect workbook --entry-id "$ENTRY_ID"
```

### Local file import

```bash
IMPORT_JSON=$(agent-sheet file import ./input.xlsx --json)
ENTRY_ID=$(printf '%s' "$IMPORT_JSON" | jq -r '.entryId')
agent-sheet inspect workbook --entry-id "$ENTRY_ID"
```

If local import fails with a converter/runtime readiness error, stop and report the blocker. Do not claim the workbook is available unless `file import` actually returned an `entryId`.

### Local to remote handoff

```bash
PUSH_JSON=$(agent-sheet file push --entry-id <entry-id> --json)
REMOTE_UNIT_ID=$(printf '%s' "$PUSH_JSON" | jq -r '.data.remote.unitId')
```

### Remote attach

```bash
ATTACH_JSON=$(agent-sheet file attach <remote-unit-id> --json)
ENTRY_ID=$(printf '%s' "$ATTACH_JSON" | jq -r '.entryId')
```

### Export

```bash
agent-sheet file export --entry-id <entry-id> --output ./output.xlsx
```

## Stop / escalate

Stop and escalate when:

- the user gives a raw remote id on a command other than `file attach`
- the task tries to `file push` an already-remote entry
- local import or local export is blocked by missing runtime converter
- local export is blocked by the `100MB` snapshot guard
- auth is required for remote handoff/export and `doctor --json` shows no workable credential path

## Output contract

Report:

- entry source and resulting mode
- `entryId`
- remote `unitId` when the workflow went remote
- exported file path when applicable
