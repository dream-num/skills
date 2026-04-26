---
name: univer-cli
description: "Use when the user needs shell-native spreadsheet workbook work with `univer` or `unv`: create/import/export `.univer` or `.unv` workbooks, inspect sheets/ranges/formulas, search cells, fill formulas, run bounded workbook logic, or do verified pipe roundtrips."
metadata:
  openclaw:
    os:
      - linux
      - macos
    requires:
      bins:
        - univer
      anyBins:
        - unv
        - awk
        - sed
        - python3
        - python
    install:
      - kind: node
        package: univer-cli@latest
        bins:
          - univer
          - unv
    links:
      repository: https://github.com/dream-num/skills
      documentation: https://github.com/dream-num/skills
---

# univer-cli

`univer-cli` is the shell-native workbook CLI for agent work. The package name is `univer-cli`; the executable is `univer`, with `unv` as the short alias.

Use it when the task needs real workbook structure, formulas, workbook-local logic, import/export handoff, or a safe stdin/stdout roundtrip instead of ad hoc CSV handling.

Treat the workbook package as the source of truth. Read from workbook-visible state, mutate through the public surface, and prove success from workbook-visible results.

## Start here

Use the smallest surface that cleanly matches the task:

- `new` / `import` / `export`: workbook lifecycle and handoff
- `inspect <subcommand>`: first read, reconnaissance, workbook-visible structure, formulas, ranges, lint signals
- `search`: first-class localization before edits
- `fill`: spreadsheet-native propagation when a correct seed already exists
- `run`: default programmable workbook surface for bounded workbook-local logic
- `pipe out` / `pipe in`: bulk rectangular data plane for shell roundtrips

Start small. If `inspect`, `search`, `fill`, or `pipe` cleanly expresses the job, use that surface directly. Use `run` when the work is programmable workbook logic rather than bulk data movement.


## Command choice

| Intent | Prefer |
|---|---|
| inspect workbook shape, formulas, or a target range before deciding | `inspect workbook|sheet|range|formulas` |
| locate rows or cells that match a condition before editing | `search` |
| extend an existing formula, series, or filled pattern | `fill` |
| move a bounded rectangle through shell tools and write it back | `pipe out` -> shell transform -> `pipe in` |
| start from a local workbook file | `import` |
| export a handoff workbook to disk | `export` |
| apply bounded workbook-native logic or formatting | `run` |
| none of the smaller surfaces fit cleanly | `run` |

## Public command surface

- lifecycle
  - `univer new <univer-path> [--name <name>] [--json]`
  - `univer import <input-path> <univer-path> [--name <name>] [--json]`
  - `univer export <univer-path> <output-path> [--json]`
- reconnaissance
  - `univer inspect workbook <univer-path> [--json-summary]`
  - `univer inspect sheet <univer-path> [--sheet <name>|<sheet-name>] [--json-summary]`
  - `univer inspect range <univer-path> --range <sheet!A1:B2> [--json-summary]`
  - `univer inspect formulas <univer-path> [--sheet <name>] [--range <sheet!A1:B2>] [--json-summary]`
  - `univer inspect lint <univer-path> [--json-summary]`
  - `univer search <univer-path> [--query <text>|<text>] [--format jsonl|ndjson|csv|tsv] [--to-stdout]`
- mutation
  - `univer fill <univer-path> --sheet <name> --source-range <A1> --target-range <A1> [--json]`
  - `univer fill <univer-path> --range <sheet!A1:B2> --value <value> [--json]`
  - `univer pipe out <univer-path> --range <sheet!A1:B2> [--type displayValue|rawValue|formula] [--format csv|tsv|json] [--to-stdout] [--output <path>]`
  - `univer pipe in <univer-path> --range <sheet!A1:B2> [--input-format json|csv|tsv] [--data-file <path>|--data-stdin|--data-json <json>] [--json]`
  - `univer run <univer-path> (--code <script>|--file <path>|<path>|-) [--json-summary] [--json]`

## Default operating model

- choose one explicit `<univer-path>` and keep using that workbook for the whole task
- use `new` or `import` first when the workbook package does not already exist
- start with `inspect` so worksheet names, headers, formulas, and write boundaries are real rather than guessed
- use `search` before mutation when the target is content-defined
- use `fill` for spreadsheet-native propagation from a known seed
- use `pipe out` / `pipe in` when the shell is the right place for a rectangular transform
- use `run` for bounded workbook-local logic, structural edits, formatting, or formula orchestration
- verify from workbook-visible reads after every mutation or handoff step

## Hard defaults

- prefer explicit `<univer-path>`; do not treat `unitId`, `sessionId`, or manifest ids as file identity
- start with `inspect <subcommand>`
- treat `run` as the default programmable workbook surface
- treat `pipe out` / `pipe in` as the bulk rectangular data plane
- verify from workbook-visible results, not metadata alone
- verify shell roundtrips with structure plus sample rows, not row count alone
- use workbook-visible inspection for handoff and completion checks
- quote full A1 ranges in the shell, especially for non-English worksheet names
- trust workbook-visible reads over file metadata when they disagree

## Highest-signal gotchas

- `manifest.json` is file-level metadata only; it does not prove worksheet count, worksheet names, formulas, or changed cells
- local file identity is the workbook path such as `./budget.univer`, not `unitId`, `sessionId`, or manifest ids
- command success is not enough for import, export, or mutation; inspect workbook-visible state before relying on it
- non-English worksheet names work, but quote the full A1 range string in the shell
- shell pipelines can preserve the expected row count while still shifting headers or keys; verify the first rows and key columns after writeback
- if workbook-visible verification disagrees with metadata, trust the workbook-visible surface first

## Verification defaults

- after `new` or `import`: `univer inspect workbook <univer-path>`
- after formula work: `univer inspect formulas <univer-path> --range <sheet!A1:B2>`
- after rectangular writeback: inspect the header row, first sample rows, and key columns
- before handoff: inspect the source workbook, export, check the output file exists, then re-import or inspect the handoff path when needed

## Read next

Read only what matches the task:

- [playbooks/01-getting-started.md](playbooks/01-getting-started.md): first contact, target resolution, basic flow
- [playbooks/02-common-workflows.md](playbooks/02-common-workflows.md): workflow recipes by task intent
- [playbooks/03-handoff-and-verification.md](playbooks/03-handoff-and-verification.md): handoff, completion checks, workbook-visible verification
- [references/run-api.md](references/run-api.md): `run` entry point and reference map for bounded programmable workbook logic
- [references/shell-patterns.md](references/shell-patterns.md): small shell-native patterns for `pipe` workflows
- [references/gotchas.md](references/gotchas.md): real-world failure modes and edge cases
- [examples/handoff-verify.md](examples/handoff-verify.md): export/import/handoff proof
- [examples/roundtrip-pipe-review-rectangle.md](examples/roundtrip-pipe-review-rectangle.md): staged shell roundtrip with explicit preview verification
