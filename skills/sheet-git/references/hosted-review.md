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
- Hosted scope is `{owner}/{repo}`, and one hosted web may contain many repos.

## Entering a hosted repo

### Existing local workspace -> hosted review

If Alice already has a local workspace and wants review for it:

- `sheet-git remote add review <base-url> --owner <owner-id> --repo <repo-id>`
- `sheet-git push review <proposal>`

This is the first-path for a brand new hosted repo.

### Existing hosted repo -> fresh local workspace

If Alice or Charlie starts from a hosted repo that already exists:

- `sheet-git clone <owner>/<repo> --base-url <base-url>`
- or `sheet-git clone <host>/<owner>/<repo>`
- or `sheet-git clone <review-url>`

This creates a fresh local workspace and binds it to that hosted scope.

If the repo has already materialized an origin workbook, clone restores the latest materialized entries.

If the repo exists but has not materialized origin yet, clone still binds the hosted scope, but there may be no workbook content to restore yet.

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

## Multi-repo hosted UI

When hosted web serves many repos:

- `/review` is the repo index
- each repo inbox/detail page stays scoped to one `{owner}/{repo}`
- proposal ids are not globally unique enough by themselves; always carry the hosted scope with them when speaking about a review item

## Best reading order during collaboration

When dropped into an existing collaborative situation:

1. `sheet-git proposal status <proposal>`
2. `sheet-git proposal comments <proposal>`
3. if origin is involved, `sheet-git fetch origin <entry-id>` or `sheet-git pull origin <proposal-or-entry-id>`

Do not infer the state from inbox labels alone when CLI is available.
