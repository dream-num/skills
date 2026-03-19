---
name: agent-sheet
description: Use `agent-sheet` for local spreadsheet work in shell. Trigger whenever the task needs a workbook-aware interface for creating or importing local workbooks, inspecting sheets, ranges, and formulas, streaming spreadsheet data through shell pipelines, writing back precise edits, or using bounded workbook-local `script js` when canonical commands are insufficient. Do not use this skill for plain CSV/text munging that does not need a managed workbook.
metadata:
  openclaw:
    os:
      - linux
      - macos
    requires:
      bins:
        - agent-sheet
      anyBins:
        - awk
        - sed
        - python3
        - python
    install:
      - kind: node
        package: agent-sheet@0.0.2
        bins:
          - agent-sheet
    links:
      repository: https://github.com/dream-num/skills
      documentation: https://github.com/dream-num/skills
---

# agent-sheet

`agent-sheet` is a sqlite-like spreadsheet CLI: local-first, shell-native, and safe to compose in agent workflows.

Install it first when the CLI is not available yet:

```bash
npm install -g agent-sheet
```

Treat it as a command router:

- establish workbook context first
- choose the smallest canonical command path
- keep outputs composable for agents
- verify every mutation before finishing

## What this skill optimizes for

- spreadsheet-native semantics: workbook, sheet, range, and formula operations stay first-class
- shell-native execution: stream real workbook data through stdin/stdout when the next step is a transform
- agent-friendly output: prefer bounded previews, file paths, and structured extracts over huge inline dumps
- powerful but bounded edits: use canonical commands first, then a workbook-local `script js` fallback only for real gaps

## Optional companion tools

- `awk`, `sed`, `python3`, and `python` are optional helpers for shell transforms
- they are not required for every task
- canonical `inspect.*`, `read.*`, `write.*`, `sheet.*`, and `file.*` commands stay primary

## Non-negotiable defaults

1. Workspace first
   - Run `agent-sheet init` once at the intended workspace root.
   - Do not assume business commands will lazily create `.agent-sheet/`.
2. Entry context is explicit
   - Prefer `--entry-id <id>`.
   - `--entry-id @current` is acceptable only after the workspace already has a resolved current entry.
3. Canonical command first
   - `inspect.*`, `read.*`, `write.*`, `sheet.*`, `file.*` are the main path.
   - `script js` is a bounded workbook-local fallback for genuine command gaps, not the default editing surface.
4. Output mode matches the consumer
   - shell/dataflow: `--to-stdout`
   - precise machine extract: add `--type rawValue`, usually with `--to-stdout` or `--to-file`
   - human/model inspection: bounded inline output
   - large reusable extracts: `--to-file --output <path>`
   - machine parsing: `--json` or `--json-summary` only where it actually helps
   - `read` stream/file output already uses real workbook data shape; do not plan around synthetic index/header
5. Every write ends with verification
   - read back the changed range
   - add `inspect sheet` or `inspect workbook` after structural mutations
   - if the change is presentation-only and CLI has no inspect surface for that visual state, return an explicit execution summary and say that the visual state was applied but not independently inspectable via canonical CLI commands

## Routing protocol

### Step 1: Resolve the workbook start state

Choose one path and stay explicit:

| Situation | First command |
|---|---|
| workspace not initialized | `agent-sheet init [<path>]` |
| need an existing entry | `agent-sheet file list --json` |
| start from a fresh workbook | `agent-sheet file create <name> --json` |
| start from local `xlsx`/`csv` | `agent-sheet file import <path> --json` |

`file import` is runtime-managed like local export. If the current build cannot resolve the installed converter package, fail fast and report the blocker instead of pretending the local workbook was imported.

For entry lifecycle details, read [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md).

### Step 2: Classify the task before acting

| Task shape | Primary lane | Read next |
|---|---|---|
| workbook/sheet/range discovery | inspect/read | [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) |
| create / import / open / export local workbooks | file lifecycle | [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) |
| localized or bulk workbook mutation | write | [playbooks/20-write-safe.md](playbooks/20-write-safe.md) |
| shell-native transform pipeline | read stream + write | [references/shell-patterns.md](references/shell-patterns.md) |
| canonical surface cannot express the operation | bounded fallback | [playbooks/40-script-fallback.md](playbooks/40-script-fallback.md) |

Always start with [playbooks/00-preflight.md](playbooks/00-preflight.md) when workspace or entry readiness is uncertain.

### Step 3: Pick the smallest command family

Use this selection bias:

- `inspect workbook` before guessing sheets
- `inspect sheet` / `inspect range` before risky writes
- `read range` for rectangular extraction
- when display formatting could mislead dates, amounts, or other typed values, stay on canonical `read range` and upgrade to `--type rawValue`
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

- context: workspace root, `entryId`, workbook scope when relevant
- action: commands run or the next exact command to run
- result: changed range/sheet, exported file path, or generated artifact
- verification: what was read back and whether it matched
- risk: only residual uncertainty, not a long narrative

If the result is large, prefer pointing at a file path or a bounded preview over pasting the whole payload.

## What not to do

- do not parse workbook state by hand when `inspect.*` or `read.*` already expresses it
- do not use `script js` just because it feels flexible
- do not jump to `xlsx` parsing or `openpyxl` just because inline preview is formatted; try `read range|search --type rawValue` first
- do not mutate a workbook before resolving entry context
- do not finish after a write without readback
- do not emit oversized inline dumps when `--to-file` or `--to-stdout` is the better interface

## Deep-dive map

Read only the file needed for the current task:

| File | Use when |
|---|---|
| [playbooks/00-preflight.md](playbooks/00-preflight.md) | workspace or entry readiness is unclear |
| [playbooks/10-read-analyze.md](playbooks/10-read-analyze.md) | scoping workbook structure or extracting data |
| [playbooks/20-write-safe.md](playbooks/20-write-safe.md) | selecting and verifying a mutation path |
| [playbooks/30-file-lifecycle.md](playbooks/30-file-lifecycle.md) | creating, importing, opening, inspecting, or exporting local workbooks |
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
