# Error Recovery Policy

Use structured error signals first. Retry only the minimum failed step.

## Recovery sequence

1. capture `command`, `error.code`, and the actionable part of `error.message`
2. classify the failure family
3. apply the smallest recovery action
4. rerun only the failed command
5. if the failed command was a write and recovery succeeds, run verification readback

## Error matrix

| Error pattern | Likely cause | First recovery action | Next step |
|---|---|---|---|
| `UNIVER_TOOL_INVALID_ARGS` | CLI surface mismatch | `agent-sheet --help` | normalize args and retry |
| `No agent-sheet workspace found` | workspace missing or wrong cwd | run `agent-sheet init` at the intended root | retry in that workspace |
| `UNIVER_AUTH_REQUIRED` | missing or invalid credential path | `agent-sheet doctor --json` | fix auth and retry |
| `UNIVER_SHEET_NOT_FOUND` | sheet renamed or missing | `inspect workbook` | rebind target or create sheet |
| `UNIVER_RANGE_NOT_FOUND` | invalid or stale range | `inspect sheet` / `inspect range` | retry with corrected range |
| `UNIVER_TOOL_EXEC_ERROR` | runtime execution failure | `doctor --json` | retry with narrower scope |
| `ENGINE_RPC_ERROR` | daemon/session instability | `agent-sheet daemon stop && agent-sheet daemon start` | rerun the minimum failed step |
| `file push only supports local entries` | push attempted on remote entry | `file info --entry-id <id> --json` | use the remote entry directly |
| `local snapshot JSON exceeds 100MB` | local export size guard | `file push` or `file import --push` | export from remote entry |
| `missing exchange cli binary path` | local export runtime not ready | confirm runtime package can resolve installed `uexcli` | retry export only |
| `pushWorkbookToRemoteAsync` / `Local snapshot manager push API is not available` | stale runner/daemon stack | `agent-sheet doctor --json` then restart/upgrade runtime | retry push only |

## Context recovery probes

When the environment or session looks wrong:

```bash
agent-sheet file list --json
agent-sheet doctor --json
```

When the only input is a remote workbook id:

```bash
ATTACH_JSON=$(agent-sheet file attach <remote-unit-id> --json)
ENTRY_ID=$(printf '%s' "$ATTACH_JSON" | jq -r '.entryId')
```

## Recovery guardrails

- do not widen mutation scope during recovery
- do not rerun the whole workflow when one command failed
- do not jump to `script js` as the first recovery move for a canonical command
