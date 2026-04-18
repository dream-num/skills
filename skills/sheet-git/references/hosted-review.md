# Hosted Review

Use this file for the normal hosted review path in `sheet-git`.

## Happy path

1. Capture local work with `sheet-git stage`, `sheet-git commit`, and `sheet-git proposal create`.
2. Bind hosted scope with `sheet-git remote add review [<base-url>] --owner <owner-id> --repo <repo-id>`.
3. Publish with `sheet-git push review <proposal>`.
4. Read review state with `sheet-git proposal status <proposal>`.
5. Read machine-facing comments with `sheet-git proposal comments <proposal>`.
6. Revise locally and republish with the same proposal id.

## Approval and origin

- `sheet-git proposal approve <proposal> [--actor <name>]` is the CLI approval command.
- hosted approval and origin materialization are separate steps.
- after approval, origin work still goes through `sheet-git push origin <proposal>`.

## Existing hosted repo

- `sheet-git clone <owner>/<repo> --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo>`
- `sheet-git clone <review-url>`

Use this when the happy path starts from an existing hosted repo instead of a local workspace.

## Reminders

- treat `{owner}/{repo}` as the hosted scope
- keep using the same proposal id for follow-up revisions
- do not infer final state from web labels alone when CLI state is available
