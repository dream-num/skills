---
name: agent-sheet
description: Operate spreadsheet workbooks through `agent-sheet`. Use this skill whenever the task targets a local or remote Univer workbook, workbook file import/export, remote attach/push, sheet tabs, A1 ranges, formulas, workbook inspection/search, shell-native workbook read/write pipelines, review-table writeback, precise cell/range mutations, or workbook presentation changes such as formatting, borders, colors, alignment, freeze panes, merge/unmerge, and other bounded `script js` spreadsheet operations. Trigger even if the user does not name `agent-sheet` when they clearly want to inspect, edit, reconcile, or automate a workbook in shell. Do not use this skill for generic markdown table formatting, code formatting, or plain CSV/text munging that does not need an `agent-sheet`-managed workbook.
---

# agent-sheet

`agent-sheet` is the execution protocol for spreadsheet work in this repo.

Treat it as a command router, not a long handbook:

- establish workbook context first
- choose the smallest canonical command path
- keep outputs composable for agents
- verify every mutation before finishing

## What this skill optimizes for

- context-safe output: avoid dumping oversized workbook payloads inline when a path or bounded preview is enough
- shell-native execution: prefer streamable reads and direct stdin writeback for batch transforms
- stable workbook semantics: use explicit `entryId` workflows instead of guessing local/remote state
- low-surprise mutations: prefer canonical commands over ad-hoc JS

## Non-negotiable defaults

1. Workspace first
   - Run `agent-sheet init` once at the intended workspace root.
   - Do not assume business commands will lazily create `.agent-sheet/`.
2. Entry context is explicit
   - Prefer `--entry-id <id>`.
   - `--entry-id @current` is acceptable only after the workspace already has a resolved current entry.
   - Raw remote `unitId` only belongs on `file attach`.
3. Canonical command first
   - `inspect.*`, `read.*`, `write.*`, `sheet.*`, `file.*` are the main path.
   - `script js` is a bounded fallback for genuine command gaps, not the default editing surface.
4. Output mode matches the consumer
   - shell/dataflow: `--to-stdout`
   - human/model inspection: bounded inline output
   - large reusable extracts: `--to-file --output <path>`
   - machine parsing: `--json` or `--json-summary` only where it actually helps
5. Every write ends with verification
   - read back the changed range
   - add `inspect sheet` or `inspect workbook` after structural mutations
   - if the change is presentation-only and CLI has no inspect surface for that visual state, return an explicit execution summary and say that the visual state was applied but not independently inspectable via canonical CLI commands

## Repo-local guardrails

When the task also edits this repository, keep the repo contract aligned:

- minimal necessity only; no extra deps or prompt bloat
- communication in Chinese; code comments in English
- runtime behavior must stay correct for source and `dist`
- significant product behavior changes require doc sync in `architecture.md` / `docs/architecture/`

## Routing protocol

### Step 1: Resolve the workbook start state

Choose one path and stay explicit:

| Situation | First command |
|---|---|
| workspace not initialized | `agent-sheet init [<path>]` |
| need an existing entry | `agent-sheet file list --json` |
| start from a fresh workbook | `agent-sheet file create <name> --json` |
| start from local `xlsx`/`csv` | `agent-sheet file import <path> --json` |
| import locally, then immediately go remote | `agent-sheet file import <path> --push --json` |
| start from raw remote workbook id | `agent-sheet file attach <unit-id> --json` |
| promote an existing local entry to remote | `agent-sheet file push --entry-id <id> --json` |

`file import` is runtime-managed like local export. If the current build cannot resolve the installed converter package, fail fast and report the blocker instead of pretending the local workbook was imported.

For entry lifecycle details, read [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md).

### Step 2: Classify the task before acting

| Task shape | Primary lane | Read next |
|---|---|---|
| workbook/sheet/range discovery | inspect/read | [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) |
| file bootstrap / push / attach / export | file lifecycle | [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) |
| localized or bulk workbook mutation | write | [playbooks/20-write-safe.md](playbooks/20-write-safe.md) |
| shell-native transform pipeline | read stream + write | [references/shell-patterns.md](references/shell-patterns.md) |
| canonical surface cannot express the operation | bounded fallback | [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) |

Always start with [playbooks/00-preflight.md](playbooks/00-preflight.md) when context, auth, workspace, or runtime readiness is uncertain.

### Step 3: Pick the smallest command family

Use this selection bias:

- `inspect workbook` before guessing sheets
- `inspect sheet` / `inspect range` before risky writes
- `read range` for rectangular extraction
- `read search` for lookup/discovery across sheets
- `write cells` for sparse patches
- `write range` for anchored rectangular payloads
- `write table --sheet <name>` for review-table replacement/writeback
- `write fill` for bounded propagation
- `sheet create|rename|copy|delete` for structural sheet changes
- `script js` only after you can state why canonical commands are insufficient

For the full matrix, read [policies/command-selection-matrix.md](policies/command-selection-matrix.md).

### Step 4: Execute in a short, verifiable chain

Default execution rhythm:

1. preflight
2. inspect/read only what the task needs
3. mutate with the smallest viable primitive
4. verify the affected area
5. report the resulting `entryId`, files, and residual risk

Minimal shape:

```bash
agent-sheet init
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id>
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:D20"
# optional mutation
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:D20"
```

## Output contract

Keep final task reporting compact and agent-friendly:

- context: workspace root, `entryId`, local/remote mode when relevant
- action: commands run or the next exact command to run
- result: changed range/sheet, exported file path, or remote `unitId`
- verification: what was read back and whether it matched
- risk: only residual uncertainty, not a long narrative

If the result is large, prefer pointing at a file path or a bounded preview over pasting the whole payload.

## What not to do

- do not parse workbook state by hand when `inspect.*` or `read.*` already expresses it
- do not use `script js` just because it feels flexible
- do not mutate a workbook before resolving entry context
- do not finish after a write without readback
- do not emit oversized inline dumps when `--to-file` or `--to-stdout` is the better interface

## Deep-dive map

Read only the file needed for the current task:

| File | Use when |
|---|---|
| [playbooks/00-preflight.md](playbooks/00-preflight.md) | workspace, auth, daemon, or entry readiness is unclear |
| [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) | scoping workbook structure or extracting data |
| [playbooks/20-write-safe.md](playbooks/20-write-safe.md) | selecting and verifying a mutation path |
| [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) | creating, importing, pushing, attaching, opening, or exporting entries |
| [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) | canonical command gap requires bounded JS |
| [policies/command-selection-matrix.md](policies/command-selection-matrix.md) | task-to-command routing |
| [policies/error-recovery.md](policies/error-recovery.md) | recovery after structured failures |
| [policies/safety-guardrails.md](policies/safety-guardrails.md) | mutation risk tier and mandatory gates |
| [references/cli-discovery.md](references/cli-discovery.md) | verifying the real CLI surface from help/runtime |
| [references/js-api-minimal.md](references/js-api-minimal.md) | safe `script js` patterns and allowed API subset |
| [references/shell-patterns.md](references/shell-patterns.md) | reusable shell-native spreadsheet pipelines |

## Templates

Use these when a structured handoff helps:

- [templates/execution-note.md](templates/execution-note.md)
- [templates/mutation-report.md](templates/mutation-report.md)
- [templates/preflight-check.sh](templates/preflight-check.sh)
- [templates/read-analyze.sh](templates/read-analyze.sh)
- [templates/write-safe.sh](templates/write-safe.sh)
