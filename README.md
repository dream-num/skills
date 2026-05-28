# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-4-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer skills for workbook automation across Claude Code, Codex, and Cursor.

This repository exposes canonical Univer product skills:

- [`use-univer-cli`](./skills/use-univer-cli/SKILL.md): entry routing for workbook tasks
- [`univer-cli`](./skills/univer-cli/SKILL.md): path-first workbook work through `univer` / `unv`
- [`univer-plan`](./skills/univer-plan/SKILL.md): SaC workbook behavior plans under `plans/`
- [`univer-tdd`](./skills/univer-tdd/SKILL.md): assertion-backed SaC TDD and verify repair loops

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

- `use-univer-cli` is the recommended entry skill for workbook tasks; it routes ordinary work to `univer-cli` and complex SaC behavior to `univer-plan` plus `univer-tdd`
- `univer-cli` is for workbook-visible work: `new`, `import`, `export`, `inspect`, `search`, `fill`, `run`, and `pipe`
- `univer-plan` is for complex SaC workbook behavior planning, range roles, Migration Pack boundaries, and assertion gates written under `plans/`
- `univer-tdd` is for assertion-backed SaC TDD, `univer sac verify <workspace> --json`, and report-driven repair

Use `univer-cli` for workbook inspection, bounded edits, formula review, shell-native roundtrips, and handoff verification.
Use `use-univer-cli` first when the task could be either ordinary workbook automation or SaC source authoring.
Use `univer-plan` and `univer-tdd` when workbook behavior should be built as SaC source and verified through `assertions.ts`.

## Quick Install

Install the workbook CLI:

```bash
npm install -g univer-cli@latest
```

Install this skill repository:

```bash
npx skills add dream-num/skills
```

Manual install the official workflow skills:

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/use-univer-cli ~/.claude/skills/
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/univer-plan ~/.claude/skills/
cp -R skills/univer-tdd ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/use-univer-cli ~/.codex/skills/
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/univer-plan ~/.codex/skills/
cp -R skills/univer-tdd ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/use-univer-cli ~/.cursor/skills/
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/univer-plan ~/.cursor/skills/
cp -R skills/univer-tdd ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`use-univer-cli`](./skills/use-univer-cli/SKILL.md) | Entry routing for all workbook tasks, including ordinary CLI work and SaC TDD handoff | choosing the right Univer skill before acting | canonical |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`univer-plan`](./skills/univer-plan/SKILL.md) | Workspace-local SaC plans with workbook intent, range roles, Migration Pack sequence, and assertion gates | complex workbook behavior decomposition before editing migration source | canonical |
| [`univer-tdd`](./skills/univer-tdd/SKILL.md) | SaC adapted TDD with assertion coverage, apply/verify, `verify-report.json` repair, and handoff gates | implementing Facade Migration Packs with strong workbook-visible proof | canonical |

## Example Prompts

```text
Use use-univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use use-univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use use-univer-cli to build this complex workbook behavior as SaC source. Route through univer-plan and univer-tdd, write the plan under plans/, add assertions.ts coverage, and complete only after univer sac verify <workspace> --json passes.
```

## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`; `unv` is the short alias
- `univer-plan` and `univer-tdd` skills: require `univer` with experimental SaC enabled for `univer sac` workflows
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
