# Official Univer Skills for Workbook Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-5-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer skills for workbook automation across Claude Code, Codex, and Cursor.

This repository exposes canonical Univer product skills:

- [`using-univer-cli`](./skills/using-univer-cli/SKILL.md): required entry skill for workbook tasks
- [`univer-cli`](./skills/univer-cli/SKILL.md): path-first workbook work through `univer`
- [`writing-univer-plans`](./skills/writing-univer-plans/SKILL.md): SaC workbook behavior plans under `<package.univer>/project/plans/`
- [`executing-univer-plans`](./skills/executing-univer-plans/SKILL.md): plan review and pack-by-pack execution
- [`test-driven-univer-development`](./skills/test-driven-univer-development/SKILL.md): assertion-backed SaC TDD and verify repair loops

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

- `using-univer-cli` is the required entry skill for workbook tasks; it keeps agents on Univer CLI instead of ad hoc spreadsheet libraries, then routes ordinary work to `univer-cli` and complex SaC behavior to the plan, execution, and TDD skills
- `univer-cli` is for workbook-visible work: `new`, `import`, `export`, `inspect`, `search`, `fill`, `run`, and `pipe`
- `writing-univer-plans` is for complex SaC workbook behavior planning, range roles, Migration Pack boundaries, and assertion gates written under `<package.univer>/project/plans/`
- `executing-univer-plans` is for reviewing written plans and executing one Migration Pack at a time
- `test-driven-univer-development` is for assertion-backed SaC TDD, `univer sac verify <package.univer> --json`, and report-driven repair

Use `univer-cli` for workbook inspection, bounded edits, formula review, shell-native roundtrips, and handoff verification.
Use `using-univer-cli` first when the task could be either ordinary workbook automation or SaC source authoring.
Use `writing-univer-plans`, `executing-univer-plans`, and `test-driven-univer-development` when workbook behavior should be built as SaC source and verified through `assertions.ts`.
Benchmark solver tasks should receive task-local `AGENTS.md` constraints from the harness, then route through `using-univer-cli` and the SaC plan/execution/TDD skills.

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
cp -R skills/using-univer-cli ~/.claude/skills/
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/writing-univer-plans ~/.claude/skills/
cp -R skills/executing-univer-plans ~/.claude/skills/
cp -R skills/test-driven-univer-development ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/using-univer-cli ~/.codex/skills/
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/writing-univer-plans ~/.codex/skills/
cp -R skills/executing-univer-plans ~/.codex/skills/
cp -R skills/test-driven-univer-development ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/using-univer-cli ~/.cursor/skills/
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/writing-univer-plans ~/.cursor/skills/
cp -R skills/executing-univer-plans ~/.cursor/skills/
cp -R skills/test-driven-univer-development ~/.cursor/skills/
```

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`using-univer-cli`](./skills/using-univer-cli/SKILL.md) | Required entry skill for workbook tasks, with Univer CLI as the workbook engine and SaC TDD handoff when needed | choosing the right Univer path before acting | canonical |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, cell search, fill, run, and shell-native roundtrips | workbook inspection, content-driven cell lookup, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`writing-univer-plans`](./skills/writing-univer-plans/SKILL.md) | Package-local SaC plans with workbook intent, range roles, Migration Pack sequence, and assertion gates | complex workbook behavior decomposition before editing migration source | canonical |
| [`executing-univer-plans`](./skills/executing-univer-plans/SKILL.md) | Plan review and pack-by-pack execution for SaC workbook behavior | implementing written Univer plans without skipping assertion gates | canonical |
| [`test-driven-univer-development`](./skills/test-driven-univer-development/SKILL.md) | Package-local Univer project TDD with assertion coverage, apply/verify, `verify-report.json` repair, and handoff gates | implementing Facade Migration Packs with strong workbook-visible proof | canonical |

## Example Prompts

```text
Use using-univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use using-univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use using-univer-cli to build this complex workbook behavior as SaC source. Route through writing-univer-plans, executing-univer-plans, and test-driven-univer-development, write the plan under <package.univer>/project/plans/, add assertions.ts coverage, and complete only after univer sac verify <package.univer> --json passes.
```


## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`
- SaC workflow skills: require `univer` with experimental SaC enabled for `univer sac` workflows
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
