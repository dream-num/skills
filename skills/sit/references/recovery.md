# Recovery

Use this file when a `sit` happy path stops midway.

Follow refusal output literally. If `sit` gives a next command, prefer that command.

## Common cases

### Local capture happened, but the review session is not hosted

- check: `sit review status <session>`
- next: `sit push review <session>`

### Hosted approval is required before origin materialization

- check: `sit review status <session>`
- next: `sit push origin <session>`
- bypass only when intentional: `sit push origin --skip-review-check <session>`

### Remote may be ahead

- check: `sit fetch origin <univer-path>`
- then: `sit pull origin <session-or-univer-path>` if suggested
- force only when the refusal says the forced path is appropriate: `sit pull origin --force-to-latest <session-or-univer-path>`

### Replay interrupted

- check: `sit status`
- next: `sit push origin --resume <replay-run>`

### Existing origin workbook needs to become local-first workflow state

- next: `sit origin bind-existing <remote-workbook-id> <univer-path>`

## Final state checks

1. `sit status`
2. `sit review status <session>` if a review session is involved
3. `sit review comments <session>` if review feedback is involved
4. `sit fetch origin <univer-path>` if remote sync is involved

## Avoid

- do not invent `approve`, `publish`, or `history`
- do not simulate `rebase origin`
- do not keep retrying the same refused command when `sit` already printed a safer next step
