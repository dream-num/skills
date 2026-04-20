# Recovery

Use this file when a `sheet-git` happy path stops midway.

## Rule

Follow the refusal output literally. If `sheet-git` gives a next command, prefer that command.

## Happy path breaks and next steps

### Local capture already happened, but the review session is not in hosted review

- next: `sheet-git push review <session>`

### Review is done, but origin is still pending

- next: `sheet-git push origin <session>`

### Remote changed before local sync finished

- check: `sheet-git fetch origin <entry-id>`
- then: `sheet-git pull origin <session-or-entry-id>` if that is the suggested path

### Origin replay was interrupted

- next: `sheet-git push origin --resume <replay-run>`

### Local workspace was not attached to the existing remote workbook

- next: `sheet-git origin bind-existing <remote-workbook-id>`

## Read in this order

1. `sheet-git status`
2. `sheet-git review status <session>` if a review session is involved
3. `sheet-git review comments <session>` if review feedback is involved
4. `sheet-git fetch origin <entry-id>` if remote sync is involved

## Do not do

- do not invent recovery commands
- do not manually edit workflow state files
- do not treat follow-up revisions as the same local review session; create a new local review session and let `push review` reuse the hosted thread when appropriate
- do not invent `rebase origin`
