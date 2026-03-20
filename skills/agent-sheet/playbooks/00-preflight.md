# Preflight Playbook

## When to use

Use this first when workspace root, CLI resolution, or workbook target is not already clear.

## Goal

- confirm `agent-sheet` is available
- avoid nested-workspace mistakes
- resolve a workbook before deeper reads or writes

## Default sequence

1. Confirm `agent-sheet` is available.

```bash
command -v agent-sheet >/dev/null 2>&1
```

If it is missing, stop and report the blocker.

2. Before running `init`, check whether this directory already behaves like an `agent-sheet` workspace.

```bash
agent-sheet file list --json
```

If that succeeds, stay on the current workspace and do not run `init`.

3. Run `init` only when this directory is the intended new workspace root and step 2 did not already resolve one.

```bash
agent-sheet init
```

If `init` fails because the directory is nested inside another workspace, do not retry in deeper subdirectories. Move to the intended root or reuse the existing workspace.

4. Resolve the workbook by listing, creating, or importing one.

```bash
agent-sheet file list --json
agent-sheet file create Budget --json
agent-sheet file import ./budget.xlsx --json
```

5. Capture the returned `entryId` and inspect the workbook once before deeper work.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Defaults

- do not re-run `init` inside an existing workspace tree
- keep the workbook target explicit with `--entry-id`
- if the task starts from `file import`, trust the returned `entryId` even if later metadata surfaces are sparse

## Stop / escalate

Stop and escalate when:

- the working directory is not the intended workspace root
- `agent-sheet` is unavailable
- the workbook cannot be resolved cleanly
- the workbook cannot be opened for the requested task
