# Command Surface

Use this file when exact `sit` command naming matters.

## Local repo workflow

1. `sit init`
2. `sit status`
3. `sit add <univer-path>` or `sit add --all`
4. `sit diff`
5. `sit commit --message "..."`
6. `sit review create`

Use this when workbook edits are already persisted and you want repo history plus a review unit.

## History and inspection

- `sit log [--limit <n>]`
- `sit show [<commit-or-checkpoint>]`
- `sit diff [<commit-or-checkpoint>|<base> <target>]`
- `sit blame <univer-path> --cell 'Sheet1!A1' [<commit-or-checkpoint>]`
- `sit checkpoint list`
- `sit checkpoint create <name> [<commit>]`

## Review

- `sit review create [<commit>]`
- `sit review list`
- `sit review show <session>`
- `sit review status <session>`
- `sit review comments <session>`
- `sit remote add review [<base-url>] --owner <owner-id> --repo <repo-id>`
- `sit push review <session>`

`<owner-id>` and `<repo-id>` define the hosted review scope for this scenario. If no scope exists yet, choose stable values and reuse them consistently.

## Origin

- `sit clone <owner>/<repo> [<path>] --base-url <base-url>`
- `sit clone <host>/<owner>/<repo> [<path>]`
- `sit clone <review-url> [<path>]`
- `sit fetch origin <univer-path>`
- `sit pull origin <session-or-univer-path>`
- `sit pull origin --force-to-latest <session-or-univer-path>`
- `sit push origin --dry-run <session>`
- `sit push origin --explain <session>`
- `sit push origin <session>`
- `sit push origin --skip-review-check <session>`
- `sit push origin --resume <replay-run>`
- `sit origin bind-existing <remote-workbook-id> <univer-path>`

Use `fetch` / `pull` when remote may have moved. Use `push origin` when origin materialization is the goal. Use `--dry-run` or `--explain` before risky materialization.

## Names to avoid

- use `log`, not `history`
- use `add`, not `stage`
- use `push review`, not invented publish aliases
- use `remote add review`, not ad-hoc remote naming
- do not use `rebase origin`
