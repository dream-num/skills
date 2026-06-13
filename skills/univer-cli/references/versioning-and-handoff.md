# Versioning And Handoff

Use versioning and handoff commands after the target-visible state that matters for the task has
been checked.

## Local State

```bash
UNIVERFILE=./orders.univer
UNIT=replace-with-localUnitId

univer status "$UNIVERFILE"
univer status "$UNIVERFILE" --local-unit-id "$UNIT"
univer commit "$UNIVERFILE" --local-unit-id "$UNIT" --message "Describe verified change"
univer restore "$UNIVERFILE" --local-unit-id "$UNIT"
univer reset "$UNIVERFILE" --local-unit-id "$UNIT" --soft HEAD~1
```

`status` is always scoped to the target `.univer` file. It does not inspect the current directory,
daemon/viewer state, git state, a remote unit by name, or a sheet by name. Omit
`--local-unit-id` to list all local units, or pass a known `localUnitId` when checking binding and
cleanliness before a write, pull, or sync.

Use `status` before SaC commands when target cleanliness matters. Use `commit` to record verified
local mutations for a selected unit. Use `restore` or `reset` only when discarding or reshaping local
unit work is intended.

## Remote-Bound Units

```bash
UNIVERFILE=./orders.univer
UNIT=replace-with-localUnitId

univer pull "$UNIVERFILE" --local-unit-id "$UNIT"
univer sync "$UNIVERFILE" --local-unit-id "$UNIT"
```

Use `pull` for remote-only changes on bound units. Use `sync` when local and remote versioning state
both need reconciliation.

## Preview And Comments

When an agent browser tool is available:

```bash
UNIVERFILE=./orders.univer

univer view "$UNIVERFILE" --no-open --json
```

Open the returned URL with the browser tool. When no agent browser tool is available and OS browser
opening is appropriate:

```bash
UNIVERFILE=./orders.univer

univer view "$UNIVERFILE" --open --json
```

Read local viewer review comments with:

```bash
UNIVERFILE=./orders.univer

univer view comments "$UNIVERFILE" --json
```

## Export Handoff

Use export when the user needs an Excel-compatible artifact:

```bash
UNIVERFILE=./orders.univer

univer export "$UNIVERFILE" ./handoff.xlsx
```

Verify the target-visible state that matters before export. If export compatibility is itself the
task, inspect or reopen the exported handoff through a supported read surface.
