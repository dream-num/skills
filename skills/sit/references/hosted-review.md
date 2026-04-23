# Hosted Review

Use this file for the normal hosted review path in `sit`.

## Flow

1. Capture local work with `sit add`, `sit commit`, and `sit review create`.
2. Bind hosted scope with `sit remote add review [<base-url>] --owner <owner-id> --repo <repo-id>`.
3. Publish with `sit push review <session>`.
4. Read review state with `sit review status <session>`.
5. Read machine-facing comments with `sit review comments <session>`.
6. Revise locally, create a new local review session, and let `push review` decide whether to reuse the same hosted thread.

`<owner-id>` and `<repo-id>` define the hosted review scope for this scenario. They do not need to be pre-created.

## Important rules

- hosted thread reuse is decided by `push review`
- hosted approval and origin materialization are separate steps
- `sit push origin <session>` checks hosted approval by default
- `sit push origin --skip-review-check <session>` is the explicit bypass path
- after replay success, local review session state is local truth; hosted merged writeback is separate

## Existing hosted repo entry points

- `sit clone <owner>/<repo> --base-url <base-url>`
- `sit clone <host>/<owner>/<repo>`
- `sit clone <review-url>`

Use stable owner/repo values for scenario-specific hosted review scopes.
