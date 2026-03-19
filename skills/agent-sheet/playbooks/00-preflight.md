# Preflight Playbook

## When to use

Use this first when workspace or workbook context is not already clear.

## Goal

- confirm `agent-sheet` is available
- initialize the workspace only when needed
- resolve a workbook before deeper reads or writes

## Default sequence

1. Confirm the CLI is available.

```bash
command -v agent-sheet >/dev/null
```

If it is missing:

```bash
npm install -g agent-sheet
```

2. Initialize the workspace only if this root is intended for spreadsheet work and no workspace exists yet.

```bash
agent-sheet init
```

3. Resolve a workbook by listing, creating, or importing one.

```bash
agent-sheet file list --json
agent-sheet file create Budget --json
agent-sheet file import ./budget.xlsx --json
```

4. Inspect the workbook once before deeper work.

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Defaults

- do not re-run `init` inside an existing workspace tree
- keep the workbook target explicit with `--entry-id`
- stop if the working directory is not the intended workspace root

## Stop / escalate

Stop and escalate when:

- the working directory is not the intended workspace root
- the workbook cannot be resolved cleanly
- the workbook cannot be opened for the requested task
