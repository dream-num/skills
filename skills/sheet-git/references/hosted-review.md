# Hosted Review

Use this file for the normal hosted review path in `sheet-git`.

## Happy path

1. Capture local work with `sheet-git stage`, `sheet-git commit`, and `sheet-git review create`.
2. Bind hosted scope with `sheet-git remote add review [<base-url>] --owner <owner-id> --repo <repo-id>`.
3. Publish with `sheet-git push review <session>`.
4. Read review state with `sheet-git review status <session>`.
5. Read machine-facing comments with `sheet-git review comments <session>`.
6. Revise locally, create a new local review session, and let `push review` decide whether to reuse the same hosted thread.

`<owner-id>` and `<repo-id>` define the hosted review scope for this scenario. They do not need to be pre-created. If the scenario has no existing scope yet, choose stable values and reuse them consistently.

## Approval and origin

- hosted approval and origin materialization are separate steps, but `sheet-git push origin <session>` checks hosted approval by default before replaying.
- `sheet-git push origin --skip-review-check <session>` is the explicit bypass path.
- after replay success, the local review session closes immediately; hosted merged writeback is best-effort and does not change local truth.

## Existing hosted repo

- `sheet-git clone <owner>/<repo> --base-url <base-url>`
- `sheet-git clone <host>/<owner>/<repo>`
- `sheet-git clone <review-url>`

Use this when the happy path starts from an existing hosted repo instead of a local workspace.

## Reminders

- treat `{owner}/{repo}` as the hosted scope
- if the target scenario has no existing hosted scope yet, choose a stable `{owner}/{repo}` and keep reusing it
- follow-up revisions create a new local review session; hosted thread reuse is decided by `push review`
- do not infer final state from web labels alone when CLI state is available
