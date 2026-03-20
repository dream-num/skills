# Gotchas Reference

Use this when the task looks straightforward but real-world workflows have hidden failure modes.

## Workspace root and `init`

- do not assume you need `init`
- if `file list --json` already works, you are already in a workspace
- nested `init` refusal is expected behavior, not a signal to keep retrying in subdirectories

## CLI availability

- this skill assumes `agent-sheet` is the command surface
- if `agent-sheet` is unavailable, stop and report the blocker rather than switching to a repo-specific invocation inside the public skill

## `entryId` vs `unitId`

- for local workbooks and imports, the stable working handle is `entryId`
- `file import` can return a `unitId`, while a later `file info` on the same local entry may report `unitId: null`
- do not switch targeting strategy mid-task; keep using `--entry-id`

## `file info` boundary

- `file info` is useful for metadata such as `mode`, `origin`, `name`, and timestamps
- it is not sufficient for sheet count, sheet names, formula state, or handoff structure
- use `sheet list` or `inspect workbook` for workbook-visible structure

## Shell roundtrip verification

- correct row count is not enough
- verify header row, first data rows, key columns, and row count together
- if the transformed artifact looks suspicious, inspect the staged file before writeback

## `write table` vs `write range`

- use `write table --sheet <name>` for an A1-anchored table with a header row
- use `write range` when the destination rectangle is explicit and not naturally an A1 table
- if you are thinking in terms of "replace this review sheet", `write table` is usually right
- if you are thinking in terms of "replace exactly B4:F200", `write range` is usually right

## Formula verification

- `inspect range` is the quickest way to confirm formula groups
- `read range --type formula` shows actual formulas
- `read range` without `--type formula` proves displayed results, not formula presence

## Imported templates and non-English sheet names

- imported workbooks can contain non-English sheet names and still work normally
- quote the full range string in the shell, for example `--range '工作表1!A1:J3'`
- verify imported templates with readback, not assumptions about the original file

## Legacy surfaces

- `file export --manifest ...` is no longer supported
- `file use` is not a valid current subcommand
- invalid-args failure on those legacy paths is expected, not a task failure
