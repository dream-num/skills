# Command Surface

Use this file when you need the `sheet-git` happy path in command form.

## Happy path 1: capture local work

1. `sheet-git init`
2. `sheet-git status`
3. `sheet-git stage --entry-id <id>` or `sheet-git stage --all`
4. `sheet-git diff`
5. `sheet-git commit --message "..."`
6. `sheet-git proposal create`

Use these when the workbook is already persisted and you want repo history plus a review unit.

## Happy path 2: inspect local history

- `sheet-git history [--limit <n>]`
- `sheet-git show [<commit-or-checkpoint>]`
- `sheet-git checkpoint list`
- `sheet-git checkpoint create <name> [<commit>]`
- `sheet-git blame --entry-id <id> --cell 'Sheet1!A1' [<commit-or-checkpoint>]`

Use these after capture, not before workbook editing.

## Happy path 3: send work to review

- `sheet-git remote add review [<base-url>] --owner <owner-id> --repo <repo-id>`
- `sheet-git push review <proposal>`
- `sheet-git proposal status <proposal>`
- `sheet-git proposal comments <proposal>`

## Happy path 4: sync with origin

- `sheet-git push origin <proposal>`
- `sheet-git push origin --skip-review-check <proposal>`
- `sheet-git fetch origin <entry-id>`
- `sheet-git pull origin <proposal-or-entry-id>`
- `sheet-git push origin --resume <replay-run>`

Use `fetch` / `pull` when remote may have moved. Use `push origin` when origin materialization is the goal; it checks hosted approval by default before replaying. Use `--skip-review-check` only for the explicit bypass path.

## Happy path 5: join an existing remote workbook

- `sheet-git origin bind-existing <remote-workbook-id>`

## Additional commands

- `sheet-git clone <owner>/<repo> [<path>] --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo> [<path>]`
- `sheet-git clone <review-url> [<path>]`
- `sheet-git reset --entry-id <id> [--entry-id <id>...]`
- `sheet-git reset --all`
- `sheet-git proposal list`
- `sheet-git proposal show <proposal>`
- `sheet-git proposal status <proposal>`
- `sheet-git proposal comments <proposal>`
- `sheet-git pull origin --force-to-latest <proposal-or-entry-id>`
- `sheet-git push origin --dry-run <proposal>`
- `sheet-git push origin --explain <proposal>`
- `sheet-git push origin --skip-review-check <proposal>`

Use these only when the happy path needs inspection, preview, reset, or destructive repair.

## Naming reminders

- use `history`, not `log`
- use `push review`, not invented publish aliases
- use `remote add review`, not ad-hoc remote naming
- do not invent `rebase origin`
