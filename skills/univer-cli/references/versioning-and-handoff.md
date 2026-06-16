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

When an agent browser tool is available and you have a browser-fetchable HTTP(S) `.univer` source
URL:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --json
```

Open the returned `url` with agent-browser, Playwright, or another available browser tool. The
source URL must be fetchable by that browser with CORS enabled. You can pass `--unit <localUnitId>`
to request an initial unit, or `--viewer-url <url>` for staging, local dev, or a private static
viewer deployment.

Use `--local` only when `file.univer.ai` is not reachable from the current environment:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --local --json
```

`--local` starts a foreground localhost server and returns a local viewer URL. Keep that command
process running while the browser uses the URL; stopping the process stops the local viewer URL. The
local server serves viewer assets only. It does not host, proxy, download, upload, sign, or cache
the source workbook, so the source URL still must be HTTP(S), browser-fetchable, and CORS-enabled.

Hosted `univer open` does not host local files. If you only have a local `.univer` path, ask for or
create an HTTP(S) source URL before using this handoff. The viewer's local file picker is a manual
fallback for a human browser session; do not present it as automatic agent handoff.

Do not run browser preview in known headless, remote, CI, server, or user-requested no-browser
environments unless a browser-capable tool or explicit user handoff is available.

Example with a private or local viewer deployment:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --viewer-url http://127.0.0.1:5173/ --json
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
