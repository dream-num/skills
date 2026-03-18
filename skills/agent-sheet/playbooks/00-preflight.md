# Preflight Playbook

## When to use

Run this before spreadsheet work whenever workspace, entry context, auth, or daemon readiness is not already known.

## Required input

- one of: `entryId`, local file path, remote `unitId`, or explicit plan to create a fresh workbook
- intended operation class: `read`, `write`, `file`, or `script`
- optional host override context for remote operations

## Defaults

- initialize the workspace deliberately; never assume implicit creation
- reuse an existing workspace when the current tree already has one; do not re-run `init` inside that tree
- keep `--entry-id` explicit in business commands
- use `doctor --json` when remote access or environment health matters
- inspect the workbook once after resolving an entry

## Core sequence

1. Resolve binary and workspace intent

```bash
if ! command -v agent-sheet >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
  export PATH="$REPO_ROOT/scripts:$PATH"
fi

command -v agent-sheet >/dev/null
```

2. Decide whether this tree needs initialization

- if the current tree already belongs to an intended `agent-sheet` workspace, reuse it
- if no workspace exists yet and the current directory is the intended root, run:

```bash
agent-sheet init
```

- if no workspace exists yet but you are not at the intended root, stop and fix the working directory before continuing

3. Check runtime readiness when environment matters

```bash
agent-sheet doctor --json
```

4. Resolve or create workbook context

```bash
agent-sheet file list --json

CREATE_JSON=$(agent-sheet file create <workbook-name> --json)
ENTRY_ID=$(printf '%s' "$CREATE_JSON" | jq -r '.entryId')

IMPORT_JSON=$(agent-sheet file import ./input.xlsx --json)
ENTRY_ID=$(printf '%s' "$IMPORT_JSON" | jq -r '.entryId')

ATTACH_JSON=$(agent-sheet file attach <remote-unit-id> --json)
ENTRY_ID=$(printf '%s' "$ATTACH_JSON" | jq -r '.entryId')
```

5. Prove workbook reachability before deeper work

```bash
agent-sheet inspect workbook --entry-id "$ENTRY_ID"
```

## Stop / escalate

Stop and escalate when:

- the current directory is not the intended workspace root and initializing here would be risky
- the current tree already belongs to an existing workspace but the task is about to re-run `init`
- `doctor --json` shows auth or bridge unavailability for the requested remote path
- no valid `entryId`, local file, or remote `unitId` can be resolved
- the workbook cannot be opened for the requested operation scope
- the task depends on local import or local export but runtime cannot resolve the installed `uexcli` converter

## Readiness signals worth checking

From `agent-sheet doctor --json`, pay attention to:

- `authConfigured`
- `credentialSource`
- `fileHttp.resolvedHost`
- `telemetry.enabled`
- `telemetry.distinctId`

## Output contract

Return a short preflight outcome containing:

- resolved workspace root
- resolved entry source
- readiness status
- chosen command lane

## Minimal example

```bash
agent-sheet init   # only when no workspace exists yet at this root
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id>
```
