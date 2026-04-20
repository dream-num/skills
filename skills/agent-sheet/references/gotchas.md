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
- it is not sufficient for worksheet count, worksheet names, formula state, or handoff structure
- use `inspect workbook` for workbook-visible structure

## Shell roundtrip verification

- correct row count is not enough
- verify header row, first data rows, key columns, and row count together
- if the transformed artifact looks suspicious, inspect the staged file before writeback

## `pipe in` vs `run`

- use `pipe in --range '<worksheet>!A1:D200'` when the task is explicit rectangular data replacement
- use `run` when the task needs workbook-native logic, formatting, or bounded structural behavior
- if you are thinking in terms of "move this rectangle through shell tools", `pipe out` plus `pipe in` is usually right
- if you are thinking in terms of "apply workbook-native behavior inside the sheet", `run` is usually right

## Formula verification

- `inspect formulas` is the quickest way to confirm formula structure
- `pipe out --type formula` shows actual formulas
- `pipe out` without `--type formula` proves displayed results, not formula presence

## Imported templates and non-English worksheet names

- imported workbooks can contain non-English worksheet names and still work normally
- quote the full range string in the shell, for example `--range '工作表1!A1:J3'`
- verify imported templates with `pipe out` readback, not assumptions about the original file

## Daemon restart boundaries

- a read-only `run` after daemon restart may reconcile local snapshot state without producing a collab-visible local batch
- do not treat that as proof the workbook changed semantically
- verify the workbook-visible result first, then inspect local-batch state only if the task actually depends on lineage production

## Pending mutations vs on-disk mutations file

- when a workbook is open through the daemon, the newest local draft may live in the git-snapshot-manager pending-mutation buffer before it is rewritten to `workbook.mutations.jsonl`
- do not assume an empty on-disk mutations file means there is no live local draft
- if the workflow depends on durable lineage production, verify workbook-visible state first, then use the normal repo path such as `sheet-git stage` or sync path such as `sheet-git pull origin` to force the system to materialize daemon-resident pending mutations into a real local batch
- when debugging collaboration recovery, inspect both workbook-visible state and `local-batch` state before concluding the draft is gone

## Legacy surfaces

- `file export --manifest ...` is no longer supported
- `file use` is not a valid current subcommand
- invalid-args failure on those legacy paths is expected, not a task failure
