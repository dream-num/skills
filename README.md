# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer skills for workbook automation across Claude Code, Codex, and Cursor.

This repository exposes canonical Univer product skills:

- [`univer-cli`](./skills/univer-cli/SKILL.md): path-first workbook work through `univer` / `unv`
- [`univer-spreadsheet-tdd`](./skills/univer-spreadsheet-tdd/SKILL.md): SaC-based Spreadsheet TDD with `assertions.ts` and `univer sac verify`

## Highlights

- **🧮 A spreadsheet engine that lives in your terminal**  
  Drive real workbook semantics from the CLI: formulas, formatting, conditional formatting, charts, shapes, layout, import/export, and live preview.

- **✅ Commits for workbook state**  
  Agents mutate workbooks fast; humans review the rendered result; only verified changes become explicit, syncable changesets.

- **☁️ Cloud-backed workbook multiplayer**  
  Clone, pull, and sync shared workbook state through Univer’s OT-based collaboration layer, so agents can work across machines and regions.

- **🔁 Pipelines over cells, not files**  
  Stream sheet ranges through `pipe out` / `pipe in`, route them through shell tools, and write back bounded matrices without cracking open workbook packages.

- **📊 Excel-compatible handoff**  
  Import and export `.xlsx` files while agents work against structured Univer workbook state internally.

## Why These Skills

The skills cover complementary workbook workflows:

- `univer-cli` is for workbook-visible work: `new`, `import`, `export`, `inspect`, `search`, `fill`, `run`, and `pipe`
- `univer-spreadsheet-tdd` is for SaC / Facade Migration Pack authoring where assertions drive a feedback loop

Use `univer-cli` for workbook inspection, bounded edits, formula review, shell-native roundtrips, and handoff verification.
Use `univer-spreadsheet-tdd` when the workbook behavior should be built as SaC source and verified through `assertions.ts`.

## Quick Install

Install the workbook CLI:

```bash
npm install -g univer-cli@latest
```

Install this skill repository:

```bash
npx skills add dream-num/skills
```

Manual install one or both official skills:

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/univer-spreadsheet-tdd ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/univer-spreadsheet-tdd ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/univer-spreadsheet-tdd ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`univer-spreadsheet-tdd`](./skills/univer-spreadsheet-tdd/SKILL.md) | SaC-based Spreadsheet TDD with plan-first migration decomposition, `assertions.ts`, apply, verify, repair, and repeat | Facade Migration Pack authoring, assertion-backed migration feedback loops, multi-migration workbook source projects | canonical |

## Example Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use univer-spreadsheet-tdd to build this workbook behavior as SaC source, with focused migrations and assertions.ts verification gates.
```

## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`; `unv` is the short alias
- `univer-spreadsheet-tdd` skill: requires `univer` with experimental SaC enabled for `univer sac` workflows
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
