# Getting Started

## Mental model

- `agent-sheet` is workbook-first, not file-first.
- Resolve one workbook, keep its `--entry-id`, and stay on that workbook for the whole task.
- Read workbook-visible state before deciding how to mutate it.

## Why `inspect` comes first

Use `inspect` first because command success does not tell you worksheet names, layout, headers, or the real write boundary.

Start small:

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<worksheet>"
agent-sheet inspect range --entry-id <entry-id> --range "<worksheet>!A1:H40"
```

## Why keep `--entry-id`

- it pins every command to the same workbook
- it avoids drifting between imported, created, or reopened entries
- after `file import`, trust the returned `entryId` even if later metadata is sparse

## Choose the command

### `inspect`

Use when you need workbook structure, sheet shape, a bounded rectangle, or formulas before choosing a write path.

### `search`

Use when the target rows are not pinned down yet and you need to localize matches before editing.

### `fill`

Use for workbook-native propagation from a known seed range into a larger target range.

### `run`

Use for workbook-local logic or structural work that smaller primitives do not express cleanly. Keep the touched sheets and A1 ranges explicit.

### `pipe`

Use `pipe out` when the shell should inspect or transform rectangular data. Use `pipe in` when writing a known rectangle back into the workbook.

## Default first steps

```bash
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<worksheet>"
agent-sheet search --entry-id <entry-id> --query "<query>"
```
