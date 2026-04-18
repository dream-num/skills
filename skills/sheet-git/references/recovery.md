# Recovery

Use this file when a `sheet-git` happy path stops midway.

## Rule

Follow the refusal output literally. If `sheet-git` gives a next command, prefer that command.

## Happy path breaks and next steps

### Local capture already happened, but the proposal is not in hosted review

- next: `sheet-git push review <proposal>`

### Review is done, but origin is still pending

- next: `sheet-git push origin <proposal>`

### Remote changed before local sync finished

- check: `sheet-git fetch origin <entry-id>`
- then: `sheet-git pull origin <proposal-or-entry-id>` if that is the suggested path

### Origin replay was interrupted

- next: `sheet-git push origin --resume <replay-run>`

### Local workspace was not attached to the existing remote workbook

- next: `sheet-git origin bind-existing <remote-workbook-id>`

## Read in this order

1. `sheet-git status`
2. `sheet-git proposal status <proposal>` if a proposal is involved
3. `sheet-git proposal comments <proposal>` if review feedback is involved
4. `sheet-git fetch origin <entry-id>` if remote sync is involved

## Do not do

- do not invent recovery commands
- do not manually edit workflow state files
- do not open a new proposal when the intent is a follow-up revision
- do not invent `rebase origin`
