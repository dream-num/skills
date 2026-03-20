# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Official Univer skills for spreadsheet automation across Claude Code, Codex, and Cursor.

This repository currently centers on one primary skill, [`agent-sheet`](./skills/agent-sheet/SKILL.md): a workbook-native skill for agents that need real sheet structure, precise writes, import or export handoff, and verification-first spreadsheet workflows.

## Why `agent-sheet`

`agent-sheet` is built for local, shell-native spreadsheet work:

- Fully local for core workbook workflows. No network connection or account signup is required.
- Powered by [Univer](https://github.com/dream-num/univer), which has **12.6k GitHub stars as of March 20, 2026** and provides a modern spreadsheet engine without requiring Excel, LibreOffice, or a cloud spreadsheet account.
- Shell-native by design, so it works naturally with `awk`, `grep`, `sed`, `jq`, Python, and other native tooling.
- Better suited for large datasets and complex spreadsheet tasks where plain prompts or browser spreadsheets become brittle.
- Backed by the broader Univer spreadsheet engine ecosystem for rich workbook structure, formulas, sheets, ranges, and spreadsheet-native operations.

## Quick Install

Recommended path:

```bash
# Install the workbook CLI used by the skill
npm install -g agent-sheet@latest

# Install this skill repository with the skills CLI
npx skills add dream-num/skills
```

Manual install:

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/agent-sheet ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/agent-sheet ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/agent-sheet ~/.cursor/skills/
```

Project-scoped installs follow the same pattern with `.claude/skills/`, `.codex/skills/`, or `.cursor/skills/` in your repository root.

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`agent-sheet`](./skills/agent-sheet/SKILL.md) | Spreadsheet automation with workbook inspection, precise writes, import/export handoff, and verification-first workflows | sheet inspection, formula review, bounded edits, review-table generation, shell roundtrips | primary |

## `agent-sheet` at a Glance

Use `agent-sheet` when the task needs:

- fully local spreadsheet work without network access or signup
- spreadsheet automation without depending on Excel, LibreOffice, or Google Sheets
- workbook inspection with explicit `entryId` context
- sheet, range, formula, and search analysis
- sparse writes, range replacement, anchored tables, and formula fills
- import or export handoff for local workbooks
- shell roundtrips with `awk`, `grep`, `sed`, `jq`, or Python followed by workbook-safe writeback and verification

Do not default to it for:

- plain CSV cleanup that does not need workbook semantics
- ad-hoc local workbook library code for operations already covered by the CLI
- mutation flows that skip verification after writing

## Example Prompts

Use prompts like these after installing the skill:

```text
Use agent-sheet to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use agent-sheet to import the attached xlsx, add a review table to a bounded range on the QA sheet, then verify the anchor cells and header row.
```

```text
Use agent-sheet to export the orders sheet, transform it with shell tools, write the cleaned result back as a table, and verify the structure plus the first rows.
```

## Supported Clients and Requirements

Supported clients:

- Claude Code
- Codex
- Cursor

Runtime requirements from [`agent-sheet`](./skills/agent-sheet/SKILL.md):

- OS: Linux or macOS
- Required binary: `agent-sheet`
- Common companion tools: `awk`, `sed`, `python3` or `python`

Operational advantages:

- core workflows stay local
- no account registration required
- no Excel app, LibreOffice app, or cloud spreadsheet dependency
- native fit for shell pipelines and large data processing tasks

Install the CLI runtime with:

```bash
npm install -g agent-sheet@latest
```

## Why Trust This Repo

- It is positioned as the official Univer skill repository for spreadsheet automation.
- It is powered by [Univer](https://github.com/dream-num/univer), a widely used spreadsheet framework with **12.6k GitHub stars as of March 20, 2026**.
- The repository is narrowly scoped around workbook workflows rather than generic prompt bundles.
- The primary skill favors explicit targeting, bounded writes, and post-mutation verification.
- Supporting assets are organized as readable playbooks, references, examples, and helper scripts instead of opaque generated blobs.

## Safety Notes

- Review [`skills/agent-sheet/SKILL.md`](./skills/agent-sheet/SKILL.md) and any referenced scripts before installing in a trusted environment.
- Expect local command execution through the `agent-sheet` CLI and common shell tools.
- Treat write operations as incomplete until verification has been run on the relevant workbook surface.
- Prefer the smallest built-in write command that solves the task before falling back to custom scripting.

## Validation Approach

This repository does not currently ship a separate `evals/` directory. The current trust and validation signals come from the skill design itself:

- verification-first instructions in [`skills/agent-sheet/SKILL.md`](./skills/agent-sheet/SKILL.md)
- dedicated verification guidance in [`skills/agent-sheet/playbooks/15-verify.md`](./skills/agent-sheet/playbooks/15-verify.md)
- concrete mutation and handoff examples in [`skills/agent-sheet/examples/`](./skills/agent-sheet/examples/)
- helper scripts for spot-checking workbook outputs in [`skills/agent-sheet/scripts/`](./skills/agent-sheet/scripts/)

The roadmap for this repo includes stronger automated eval coverage.


## Contributing

Contributions should preserve the current repo style:

- keep each skill self-contained under `skills/<skill-name>/`
- prefer explicit instructions over vague prompt prose
- keep reference material out of the main `SKILL.md` when progressive disclosure is clearer
- add verification guidance for any mutation-oriented workflow

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
