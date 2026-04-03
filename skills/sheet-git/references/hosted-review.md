# Hosted Review Collaboration

Use this file when the task spans Alice CLI, Bob hosted web review, proposal revisions, or materialization handoff.

Current authority split:

- local CLI speaks in proposal ids
- hosted review truth is a review session
- origin execution truth is a replay run

## Collaboration model

- Alice edits locally with `agent-sheet`.
- Alice captures and versions changes with `sheet-git`.
- Bob reviews in hosted web.
- Hosted review is the review authority.
- Origin is the workbook materialization authority.

## Proposal lifecycle

### 1. Local proposal

Alice creates a local proposal first:

- `sheet-git stage ...`
- `sheet-git commit --message "..."`
- `sheet-git proposal create`

This does not put anything into Bob's inbox yet.

### 2. Publish handoff

Alice hands the proposal to Bob with:

- `sheet-git push review <proposal>`

That creates or updates the hosted review session under the same proposal-shaped local handle and keeps it in `needs-review`.

### 3. Follow-up revisions

If Alice revises after feedback:

- edit locally
- `sheet-git stage`
- `sheet-git commit`
- `sheet-git push review <same proposal>`

That should produce hosted `r2`, `r3`, and so on under the same review session.

## Comment loop

Bob comments in hosted web.

Alice pulls comments through:

- `sheet-git proposal comments <proposal>`

Important:

- this is the machine-readable surface
- comments may carry semantic locators
- comments may also carry `selectionAttachment` for exact ranges

## Approval and merge semantics

### CLI approval

`sheet-git proposal approve <proposal>` is a real hosted review action from CLI.

### Web merge

Hosted web `Merge` closes the review record.

Current model:

- merge creates a hosted materialization request
- review is merged
- origin may still be waiting

So after Bob merges, Alice may still need:

- `sheet-git push origin <proposal>`

or a daemon may claim the materialization request and run that command.

## Materialization handoff

When hosted review shows:

- `Waiting for origin materialization`

interpret it as:

- Bob's review decision is done
- origin has not necessarily been updated yet
- `push origin` is still the real materialization step

The handoff can be completed by:

- Alice running `sheet-git push origin <proposal>`
- or a daemon claiming the request and running the same command

## Best reading order during collaboration

When dropped into an existing collaborative situation:

1. `sheet-git proposal status <proposal>`
2. `sheet-git proposal comments <proposal>`
3. if origin is involved, `sheet-git fetch origin <entry-id>` or `sheet-git pull origin <proposal-or-entry-id>`

Do not infer the state from inbox labels alone when CLI is available.
