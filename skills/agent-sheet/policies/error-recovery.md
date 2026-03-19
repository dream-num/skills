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
| `UNIVER_SHEET_NOT_FOUND` | sheet renamed or missing | `inspect workbook` | rebind target or create sheet |
| `UNIVER_RANGE_NOT_FOUND` | invalid or stale range | `inspect sheet` / `inspect range` | retry with corrected range |
| `UNIVER_TOOL_EXEC_ERROR` | runtime execution failure | narrow the operation scope and inspect the workbook state again | retry with corrected scope |
| `ENGINE_RPC_ERROR` | local runtime instability | rerun the minimum failed step only after local runtime is healthy again | stop and report the blocker if instability persists |
| `local snapshot JSON exceeds 100MB` | local export size guard | stop and report the size blocker clearly | do not fabricate an export |
| `missing exchange cli binary path` | local import/export runtime not ready | confirm runtime package can resolve installed `uexcli` | retry only the blocked import/export step |

## Context recovery probes

When the local workbook context looks wrong:

```bash
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id>
```

## Recovery guardrails

- do not widen mutation scope during recovery
- do not rerun the whole workflow when one command failed
- do not jump to `script js` as the first recovery move for a canonical command
