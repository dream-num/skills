# Command Surface

Use this file when you need exact command names, not just the workflow shape.

Mental model:

- `proposal` is the Git-shaped local read model
- hosted review truth is a review session
- origin execution truth is a replay run

## Core repo commands

- `sheet-git clone <owner>/<repo> [<path>] --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo> [<path>]`
- `sheet-git clone <review-url> [<path>]`
- `sheet-git init`
- `sheet-git remote add review <base-url> --owner <owner-id> --repo <repo-id>`
- `sheet-git stage --entry-id <id> [--entry-id <id>...]`
- `sheet-git stage --all`
- `sheet-git reset --entry-id <id> [--entry-id <id>...]`
- `sheet-git reset --all`
- `sheet-git status`
- `sheet-git diff`
- `sheet-git diff <commit>`
- `sheet-git diff <base> <target>`
- `sheet-git commit --message "..."`
- `sheet-git history [--limit <n>]`
- `sheet-git show [<commit>]`
- `sheet-git checkpoint list`
- `sheet-git checkpoint create <name> [<commit>]`
- `sheet-git blame --entry-id <id> --cell 'Sheet1!A1' [<commit>]`

## Proposal commands

- `sheet-git proposal list`
- `sheet-git proposal create [<commit>] [--remote <name>]`
- `sheet-git proposal show <proposal>`
- `sheet-git proposal approve <proposal> [--actor <name>]`
- `sheet-git proposal comments <proposal> [--revision-id <id>...] [--all]`
- `sheet-git proposal status <proposal>`

## Hosted review handoff

- `sheet-git remote add review <base-url> --owner <owner-id> --repo <repo-id>`
- `sheet-git clone <owner>/<repo> [<path>] --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo> [<path>]`
- `sheet-git clone <review-url> [<path>]`
- `sheet-git push review <proposal>`

Meaning:

- bind the current local repo to one hosted review scope with `remote add review`
- hydrate a fresh local workspace from an existing hosted review scope with `clone`
- publish the current local proposal revision into hosted review
- keep the same proposal id when publishing a follow-up revision
- do not implicitly approve

## Origin collaboration

- `sheet-git push origin --dry-run <proposal>`
- `sheet-git push origin --explain <proposal>`
- `sheet-git push origin <proposal>`
- `sheet-git push origin --resume <replay-run>`
- `sheet-git fetch origin <entry-id>`
- `sheet-git pull origin <proposal-or-entry-id>`
- `sheet-git pull origin --force-to-latest <proposal-or-entry-id>`

## Agent-facing review packet

`sheet-git proposal comments <proposal>` is the machine-facing review command.

Default behavior:

- outputs JSON
- defaults to the latest revision and unresolved comments
- can be widened with `--revision-id <id>` and `--all`

Typical fields worth reading:

- comment body
- semantic `locator`
- optional `selectionAttachment`
- current vs requested revision metadata

## Command naming warnings

- The command is `history`, not `log`.
- The hosted handoff command is `push review`, not `proposal publish`.
- The hosted scope command is `remote add review`, not ad-hoc env-only configuration.
- The repo entry command is `clone`; it restores the latest materialized entries from hosted/origin into a fresh local workspace.
- The origin step is still `push origin`, even when hosted review has already been merged.
- `fetch origin` is the remote-ahead probe; `pull origin` is the replay/materialization step.
- Do not ask for or invent `rebase origin`; it is not part of the current surface.
