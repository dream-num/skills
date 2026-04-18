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

- hosted approval and origin materialization are separate steps, but `sheet-git push origin <proposal>` checks hosted approval by default before replaying.
- `sheet-git push origin --skip-review-check <proposal>` is the explicit bypass path.
- after replay success, `sheet-git` writes back hosted merged state and closes out the local merged/proposal state in the same flow.

## Existing hosted repo

- `sheet-git clone <owner>/<repo> --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo>`
- `sheet-git clone <review-url>`

Use this when the happy path starts from an existing hosted repo instead of a local workspace.

## Reminders

- treat `{owner}/{repo}` as the hosted scope
- keep using the same proposal id for follow-up revisions
- do not infer final state from web labels alone when CLI state is available
