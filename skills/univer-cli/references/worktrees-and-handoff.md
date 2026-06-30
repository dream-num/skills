# Worktrees And Handoff

Use worktrees to isolate a change so it can be reviewed before it touches trunk, then hand off the
result for visual review or Excel export. Examples use `UNIVERFILE=./orders.univer`; set it in the
same shell or replace `$UNIVERFILE` with the literal `.univer` path.

## Worktree Lifecycle

```bash
UNIVERFILE=./orders.univer

univer worktree add "$UNIVERFILE" --name task-a    # prints the new worktree id
univer worktree list "$UNIVERFILE"                    # id, status, head commit, name
univer worktree ready "$UNIVERFILE" --worktree <id>   # mark ready, then hand off for review
univer open "$UNIVERFILE" --worktree <id> --json      # give the user a viewer link to review
univer worktree merge "$UNIVERFILE" --worktree <id>   # user merges into trunk (or from the viewer)
univer worktree discard "$UNIVERFILE" --worktree <id> # user discards instead (or from the viewer)
```

A worktree is an isolated copy of the whole univerfile. Reads and the SaC write path require its id
as `--worktree <id>`; pass it explicitly on every command so parallel agents never cross scopes.

After the task is done, mark the worktree ready and `open` it for the user (see Preview And
Comments); the user reviews and chooses to merge or discard — from that viewer page or via the
commands above. Merging is normally the user's decision, not an automatic agent step. `merge` is the
only path a change reaches trunk, and the only place OT runs; on conflict it exits non-zero, reports
the conflicting unit, and leaves trunk unchanged (resolve by re-authoring on the worktree, then
merging again). `discard` removes a worktree entirely and never affects trunk.

There is no local `commit`, `restore`, `reset`, `pull`, or `sync`. `sac apply` produces a worktree
commit, and `sac rollback` or `worktree discard` undo work; see `sac-execution.md`.

## Working Across Tasks

After a handoff the user reviews in the browser and may merge it, discard it, or just send a message
without acting. Before responding, re-check with `worktree list` — the reported `status` is the
source of truth — and read the message intent:

- `status` `merged` or `discarded` (terminal, not writable): start the next change on a fresh
  `worktree add` off the current trunk, which now includes that merge and any direct user edits.
- `status` still `draft`/`ready` and the message refines the same change: keep working on the same
  worktree. More SaC returns a `ready` worktree to the `draft` status; when done, mark it `ready` and
  hand off a fresh link with `univer open`.
- A distinct new task: use a separate `worktree add` so each task stays independently reviewable.

Never reuse a `merged`/`discarded` worktree, and never assume a worktree's `status` across a handoff.

## Scope Status

```bash
UNIVERFILE=./orders.univer
WORKTREE_ID=<id>

univer status "$UNIVERFILE" --worktree "$WORKTREE_ID"                       # lifecycle + commit count
univer status "$UNIVERFILE" --worktree "$WORKTREE_ID" --unit <unitId>  # restrict to one unit
```

`status` always requires the actual `.univer` path; it is not a current-directory, viewer, git, or
sheet-name command. It reports the worktree's unit list, lifecycle status, and commit count. Use it
before SaC commands when scope cleanliness matters.

## Preview And Comments

Prefer hosted viewer handoff when you have a browser-fetchable HTTP(S) `.univer` source URL:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --json
```

Open the returned `url` with agent-browser, Playwright, or another browser tool; the source URL must
be browser-fetchable with CORS enabled. Pass `--unit <unitId>` for an initial unit, or
`--viewer-url <url>` for a private or local viewer deployment.

A local `.univer` path resolves to its own trunk/worktree viewer room instead of a hosted source:

```bash
UNIVERFILE=./orders.univer
WORKTREE_ID=<id>
univer open "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
```

Use `--local` only when `file.univer.ai` is unreachable:

```bash
SOURCE_URL=https://cdn.example.com/orders.univer
univer open "$SOURCE_URL" --local --json
```

`--local` starts a foreground localhost server and returns a local viewer URL; keep that process
running while the browser uses the URL. It serves viewer assets only — it does not host, proxy,
upload, or cache the source workbook, so a hosted source URL still must be HTTP(S), browser-fetchable,
and CORS-enabled.

Do not run browser preview in headless, remote, CI, server, or user-requested no-browser
environments unless a browser-capable tool or explicit handoff is available.

Read review comments with:

```bash
UNIVERFILE=./orders.univer
univer view comments "$UNIVERFILE" --json
```

## Export Handoff

Use export when the user needs an Excel-compatible artifact:

```bash
UNIVERFILE=./orders.univer
WORKTREE_ID=<id>
univer export "$UNIVERFILE" ./handoff.xlsx --worktree "$WORKTREE_ID"
```

Verify the target-visible state that matters before export. If export compatibility is itself the
task, inspect or reopen the exported handoff through a supported read surface.
