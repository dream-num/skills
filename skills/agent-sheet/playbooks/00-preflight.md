# Preflight Playbook

## When to use

Run this before spreadsheet work whenever workspace or entry context is not already known.

## Required input

- one of: `entryId`, local file path, or explicit plan to create a fresh workbook
- intended operation class: `read`, `write`, `file`, or `script`

## Defaults

- initialize the workspace deliberately; never assume implicit creation
- reuse an existing workspace when the current tree already has one; do not re-run `init` inside that tree
- keep `--entry-id` explicit in business commands
- inspect the workbook once after resolving an entry

## Core sequence

1. Resolve binary and workspace intent

```bash
if ! command -v agent-sheet >/dev/null 2>&1; then
  echo "agent-sheet not found in PATH" >&2
  exit 1
fi

command -v agent-sheet >/dev/null
```

If the binary is unavailable, stop and install it first:

```bash
npm install -g agent-sheet
```

2. Decide whether this tree needs initialization

- if the current tree already belongs to an intended `agent-sheet` workspace, reuse it
- if no workspace exists yet and the current directory is the intended root, run:

```bash
agent-sheet init
```

- if no workspace exists yet but you are not at the intended root, stop and fix the working directory before continuing

3. Resolve or create workbook context

```bash
agent-sheet file list --json

agent-sheet file create <workbook-name> --json
agent-sheet file import ./input.xlsx --json
```

Extract the returned `entryId` from the JSON response with the JSON tool already available in the environment.

4. Prove workbook reachability before deeper work

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

## Stop / escalate

Stop and escalate when:

- the current directory is not the intended workspace root and initializing here would be risky
- the current tree already belongs to an existing workspace but the task is about to re-run `init`
- no valid `entryId` or local file path can be resolved
- the workbook cannot be opened for the requested operation scope
- the task depends on local import or local export but runtime cannot resolve the installed `uexcli` converter

## Output contract

Return a short preflight outcome containing:

- resolved workspace root
- resolved entry source
- chosen command lane

## Minimal example

```bash
agent-sheet init   # only when no workspace exists yet at this root
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id>
```
