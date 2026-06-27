# Official Univer CLI Skill for Workbook Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer product skill for workbook automation across Claude Code, Codex, and Cursor.
Start from [univer.ai](https://univer.ai).

This repository exposes one canonical product skill:

- [`univer-cli`](./skills/univer-cli/SKILL.md): public `univer` CLI and SaC capability guidance
  for `.univer` targets, workbook evidence, managed inspect tools, migration packs, verification,
  preview, worktrees, import, export, and handoff.

## Highlights

- **A spreadsheet engine in your terminal**  
  Drive workbook semantics through the public `univer` CLI: formulas, formatting, conditional
  formatting, charts, shapes, layout, import/export, and preview.

- **Evidence-first workbook work**  
  Use managed inspect tools, readonly probes, view, verify, and export/readback to understand and
  prove workbook-visible state.

- **Source-backed durable changes**  
  Use SaC sidecars, Facade Migration Packs, templates, apply, rollback, and verify for repeatable
  workbook behavior.

- **Excel-compatible handoff**  
  Import and export `.xlsx` files while agents work against structured `.univer` workbook state.

## Why One Skill

`univer-cli` is a product skill, not an agent workflow package. It explains the Univer CLI and SaC
public surfaces, evidence boundaries, and best practices. Agents can use any planning method chosen
by their runtime or user.

The skill uses progressive disclosure:

- `skills/univer-cli/SKILL.md` is the only required entry point.
- `skills/univer-cli/references/` contains longer capability notes and checked recipes.
- `skills/univer-cli/inspect-tools/` contains managed readonly inspect tool resources used through
  `univer inspect --tool`.

## Quick Install

Install the workbook CLI:

```bash
npm install -g univer-cli@latest
```

Install this skill repository:

```bash
npx skills add dream-num/skills
```

Manual install:

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
```

## Available Skill

| Skill | Best for | Status |
| --- | --- | --- |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | workbook inspection, `.univer` targets, managed inspect tools, SaC authoring, apply/rollback/verify, preview, worktrees, import/export, and handoff | canonical |

## Example Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import --file ./input.xlsx into ./Budget.univer, inspect the target unit and relevant ranges, then create a durable SaC migration for the requested workbook change.
```

```text
Use univer-cli to create a migration from a suitable template if workbook-visible evidence matches one; otherwise create an ordinary migration pack, apply it, and verify the applied behavior.
```

## Requirements

- OS: Linux or macOS
- Univer CLI installed as `univer`
- common shell tools for command roundtrips: `awk`, `sed`, and Node.js

## Contributing

- keep the product skill source under `skills/univer-cli/`
- keep `SKILL.md` concise and move long capability notes into one-level `references/`
- keep managed inspect tools under `skills/univer-cli/inspect-tools/`
- run `npm run validate` before publishing skill package changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
