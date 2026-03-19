---
name: agent-sheet
description: a local spreadsheet CLI for AI agents, to spreadsheets what SQLite is to databases, shell-native, structured, and built for spreadsheet work such as inspecting sheets, reading ranges, making precise edits safely, analyzing formulas, or automating workbook tasks.
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

`agent-sheet` is to spreadsheets what SQLite is to databases: a local, shell-native interface for structured spreadsheet work.

Use it when the task needs local workbook inspection, table analysis, precise edits, or workbook-native automation instead of plain CSV cleanup or direct `xlsx` hacking.

```bash
npm install -g agent-sheet
```

## Best for

- creating, importing, opening, or exporting local workbooks
- inspecting sheets, ranges, formulas, and workbook structure
- streaming spreadsheet data through shell pipelines
- writing back precise workbook edits
- using bounded workbook-local `script js` for workbook-native operations, complex range logic, or formatting/layout work

## Not for

- plain text or CSV cleanup that does not need a workbook
- reopening `xlsx` with a local workbook library when `agent-sheet` already covers the read/write/clear/inspect path
- jumping to broad workbook libraries before checking whether `inspect`, `read`, `write`, `sheet`, `file`, or bounded `script js` already solves it

## Default path

1. Initialize the workspace once at the intended root.
2. Resolve a workbook by listing, creating, or importing one.
3. Inspect before editing.
4. Use the smallest direct command that matches the task, including bounded `script js` when workbook-native logic is the clearest path.
5. Verify the changed area before finishing.

```bash
agent-sheet init
agent-sheet file list --json
agent-sheet file create Budget --json
agent-sheet file import ./budget.xlsx --json
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:D20"
printf '{"Sheet1!A1":"done"}\n' | agent-sheet write cells --entry-id <entry-id> --json
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:A1"
```

## Defaults

- keep the workbook target explicit with `--entry-id`
- prefer `agent-sheet` commands and bounded `script js` before external workbook libraries
- when exact typed values matter, use `--type rawValue`
- `file import` works on an isolated local entry; choose the final file path later with `file export --output <path>`
- keep output bounded and composable
- verify every mutation before finishing
- do not reopen the workbook with a local workbook library as the main read/write path

## Task routing

| Task | Read next |
|---|---|
| workspace or workbook context is still unclear | [playbooks/00-preflight.md](playbooks/00-preflight.md) |
| inspect workbook state, extract data, or analyze formulas | [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) |
| make data-visible edits or structural workbook changes | [playbooks/20-write-safe.md](playbooks/20-write-safe.md) |
| create, import, open, or export a local workbook | [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) |
| stream workbook data through shell tools | [references/shell-patterns.md](references/shell-patterns.md) |
| formatting, layout, or other built-in command gaps | [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) |

## Companion tools

- `awk`, `sed`, `python3`, and `python` are optional helpers for shell transforms
- they are not required for every task
- the main path stays on `agent-sheet` reads/writes and bounded `script js`
- if external processing is needed, start from `agent-sheet read --type rawValue --to-stdout|--to-file` output instead of reopening the workbook with a local workbook library

## Output style

- prefer bounded previews, file paths, or stream output over oversized inline dumps
- use `--to-stdout` for shell pipelines
- use `--to-file --output <path>` for large reusable extracts

## Read next

Read only the file needed for the task:

| File | Use when |
|---|---|
| [playbooks/00-preflight.md](playbooks/00-preflight.md) | workspace or workbook context is not yet resolved |
| [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) | inspecting workbook state, extracting data, or reviewing formulas |
| [playbooks/20-write-safe.md](playbooks/20-write-safe.md) | choosing the smallest safe mutation path |
| [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) | creating, importing, opening, or exporting a local workbook |
| [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) | built-in commands cannot express the requested workbook change |
| [references/shell-patterns.md](references/shell-patterns.md) | the task is naturally a shell pipeline |
| [references/js-api-minimal.md](references/js-api-minimal.md) | `script js` is necessary and must stay tightly bounded |
