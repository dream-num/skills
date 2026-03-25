---
name: sheet-git
description: workspace-scoped Spreadsheet Git CLI for staged spreadsheet revisions, history, diff, checkpoints, and blame on persisted local workbook entries. Use when the task is about commit history, multi-workbook staging, revision review, blame, or checkpointed spreadsheet change control rather than workbook editing itself.
metadata:
  openclaw:
    os:
      - linux
      - macos
    requires:
      bins:
        - sheet-git
        - agent-sheet
    install:
      - kind: none
    links:
      repository: https://github.com/dream-num/skills
      documentation: https://github.com/dream-num/skills
---

# sheet-git

`sheet-git` is the Spreadsheet Git control plane that sits beside `agent-sheet`.

Use `agent-sheet` to edit workbook content. Use `sheet-git` when the task changes from editing to repo control:

- stage one or more local workbook entries
- inspect staged vs committed spreadsheet changes
- create commits and named checkpoints
- review semantic diff output
- trace a committed cell with `blame`

## Use it for

- workspace-scoped staging across one or more local workbook entries
- `status`, `diff`, `history`, `show`, `checkpoint`, and `blame`
- preparing reviewable spreadsheet change sets after workbook edits are already persisted

## Do not use it for

- workbook editing, cell writes, imports, exports, or sheet lifecycle changes
- reading live in-memory runner state
- recovering dirty local state directly; recover through `agent-sheet persist --entry-id <id>`

## First path

1. Make or verify workbook edits with `agent-sheet`.
2. Ensure local mutations are flushed. If needed, run `agent-sheet persist --entry-id <id>`.
3. Use `sheet-git stage --entry-id <id>` or `sheet-git stage --all`.
4. Inspect with `sheet-git status` or `sheet-git diff`.
5. Commit with `sheet-git commit --message "..."`.

## Hard defaults

- `sheet-git` operates on persisted local entry files only
- `status` is the first place to check staged, unstaged, and blocked local changes
- `stage --all` is for workspace-wide capture; `stage --entry-id` is for selective review bundles
- `checkpoint` is a named pointer, not a second commit type
- `blame` in Phase 1 is cell-level only

## Highest-signal gotchas

- if capture is blocked by dirty local state, recover through `agent-sheet persist --entry-id <id>`
- first commits may be mostly structural, so review the initial payload summary as well as raw cell changes
- `status` can show blocked local entries even when staged entries already exist
- `sheet-git` is local-first in Phase 1; it does not replace `agent-sheet` import/export flows

## Quick routes

| Task | Command |
|---|---|
| initialize repo | `sheet-git init` |
| stage one workbook | `sheet-git stage --entry-id <id>` |
| stage all capturable local workbooks | `sheet-git stage --all` |
| inspect current repo state | `sheet-git status` |
| inspect staged diff | `sheet-git diff` |
| create commit | `sheet-git commit --message "..."` |
| inspect history | `sheet-git history` |
| inspect one revision | `sheet-git show [<commit-or-checkpoint>]` |
| create/list checkpoints | `sheet-git checkpoint create <name>` / `sheet-git checkpoint list` |
| blame one cell | `sheet-git blame --entry-id <id> --cell 'Sheet1!A1'` |

## Output style

- prefer `status` before guessing what is staged
- treat semantic summary as the default review surface
- drop to raw cell diff only when needed
- when reporting blame, include the exact cell and commit selector used
