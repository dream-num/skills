# Recovery and Refusal Guide

Use this file when `sheet-git` refuses a command or collaboration state is unclear.

## Rule zero

Do not work around refusal text.

`sheet-git` already emits the next safe command in many blocked states. Quote that next command back to the user and follow it.

## Common blocked states

### Proposal exists locally but Bob cannot see it

Cause:

- Alice created a local proposal
- Alice did not publish it to hosted review

Next step:

- `sheet-git push review <proposal>`

### Hosted review is approved or merged, but origin is still pending

Symptoms:

- `proposal status` shows hosted overlay
- `pull origin <proposal>` refuses
- status mentions waiting or failed materialization

Next step:

- `sheet-git push origin <proposal>`

If hosted review already merged and a daemon/CLI claim is in play, let the claimant finish instead of racing it.

### `pull origin` refuses because collaboration moved ahead

Possible causes:

- hosted review advanced to a newer revision
- local proposal is still draft
- local materialization drift requires repair
- another collaborator pushed to origin first

Typical next steps:

- `sheet-git proposal status <proposal>`
- `sheet-git fetch origin <entry-id>`
- `sheet-git rebase origin <entry-id>`
- `sheet-git pull origin --force-to-latest <proposal-or-entry-id>`

Choose the command suggested by the refusal message first.

### First push to origin on an unattached workbook

Current expectation:

- `push origin` can bootstrap the remote workbook
- first successful push should bind a `remoteWorkbookId`

Do not require a pre-existing remote workbook id before trying the first safe `push origin`.

### Hosted review merged but inbox/detail still needs attention

Interpretation:

- review closure happened
- materialization is waiting, dispatching, or failed

This is not inconsistent. It means the review decision is closed but origin work is still outstanding.

## Practical debugging order

1. `sheet-git status`
2. `sheet-git proposal status <proposal>` if a proposal is involved
3. `sheet-git proposal comments <proposal>` if review feedback is involved
4. `sheet-git fetch origin <entry-id>` if remote collaboration may have moved
5. only then consider `pull origin`, `rebase origin`, or `push origin`

## What not to do

- do not manually edit local repo workflow state files
- do not assume hosted `Merge` means origin is already updated
- do not open a new proposal when the intent is a follow-up revision on the same proposal
- do not bypass refusal output with ad hoc file mutations
