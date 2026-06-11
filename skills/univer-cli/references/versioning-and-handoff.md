# Versioning And Handoff

Use versioning and handoff commands after the workbook-visible state that matters for the task has
been checked.

## Local State

```bash
univer status "$WB"
univer commit "$WB" --message "Describe verified workbook change"
univer restore "$WB"
univer reset "$WB" --soft HEAD~1
```

Use `status` before SaC commands when target cleanliness matters. Use `commit` to record verified
local mutations. Use `restore` or `reset` only when discarding or reshaping local workbook work is
intended.

## Remote-Bound Units

```bash
univer pull "$WB"
univer sync "$WB"
```

Use `pull` for remote-only changes on bound units. Use `sync` when local and remote versioning state
both need reconciliation.

## Preview And Comments

When an agent browser tool is available:

```bash
univer view "$WB" --no-open --json
```

Open the returned URL with the browser tool. When no agent browser tool is available and OS browser
opening is appropriate:

```bash
univer view "$WB" --open --json
```

Read local viewer review comments with:

```bash
univer view comments "$WB" --json
```

## Export Handoff

Use export when the user needs an Excel-compatible artifact:

```bash
univer export "$WB" --output ./handoff.xlsx
```

Verify the workbook-visible state that matters before export. If export compatibility is itself the
task, inspect or reopen the exported handoff through a supported read surface.
