# Official Univer Skills for Spreadsheet Automation

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-4-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Official Univer skills for workbook automation and Git-shaped workbook collaboration across Claude Code, Codex, and Cursor.

This repository exposes two canonical skills:

- [`univer-cli`](./skills/univer-cli/SKILL.md): path-first workbook work through `univer` / `unv`
- [`sit`](./skills/sit/SKILL.md): `.sit` repo, review-session, hosted review, and origin sync workflows

Legacy aliases remain for compatibility with older prompts and installs:

- [`agent-sheet`](./skills/agent-sheet/SKILL.md)
- [`sheet-git`](./skills/sheet-git/SKILL.md)

## Why These Skills

The canonical split mirrors the product split:

- `univer-cli` is for workbook-visible work: `new`, `import`, `export`, `inspect`, `search`, `fill`, `run`, and `pipe`
- `sit` is for repo-visible work: `add`, `reset`, `status`, `commit`, `log`, `show`, `diff`, `blame`, `checkpoint`, `review`, `push`, `fetch`, and `pull`

Keep workbook authoring distinct from repo and collaboration workflow. For combined tasks, finish and verify workbook edits with `univer-cli`, then use `sit` for history, review, or origin sync.

## Quick Install

Install the workbook CLI:

```bash
npm install -g univer-cli@latest
```

Install this skill repository:

```bash
npx skills add dream-num/skills
```

For `sit`, make sure a `sit` binary is available on `PATH`. Its runtime distribution is environment-specific today, so the skill documents the command surface and assumes the binary already exists.

Manual install:

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/sit ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/sit ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/sit ~/.cursor/skills/
```

If you still need legacy aliases, copy `skills/agent-sheet/` and `skills/sheet-git/` as well.

## Available Skills

| Skill | What it does | Best for | Status |
|---|---|---|---|
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Path-first workbook automation with lifecycle commands, inspection, fill, run, and shell-native roundtrips | workbook inspection, formula review, bounded edits, verification-first authoring, handoff | canonical |
| [`sit`](./skills/sit/SKILL.md) | Git-shaped workbook repo workflow with `.sit`, review sessions, hosted review, and origin sync | local history, review handoff, origin recovery, blame, diff, pull/push | canonical |
| [`agent-sheet`](./skills/agent-sheet/SKILL.md) | Legacy workbook skill kept for compatibility | older prompt surfaces that still call the historical skill name | legacy |
| [`sheet-git`](./skills/sheet-git/SKILL.md) | Legacy repo skill kept for compatibility | older prompt surfaces that still call the historical skill name | legacy |

## Example Prompts

```text
Use univer-cli to inspect this workbook, list all sheets, and summarize the formulas on the pricing sheet before making any edits.
```

```text
Use univer-cli to import ./input.xlsx into ./Budget.univer, add a bounded review table, then verify the header row and anchor cells.
```

```text
Use sit to inspect the local repo state for this workbook, create a review session if needed, and tell me the next safe review or origin command.
```

## Requirements

- OS: Linux or macOS
- `univer-cli` skill: requires `univer`; `unv` is the short alias
- `sit` skill: requires `sit`; it usually travels with a compatible `univer` runtime in the same environment
- common companion tools for shell roundtrips: `awk`, `sed`, `python3` or `python`

## Validation

Canonical skills include prompt-level eval seeds:

- [`skills/univer-cli/evals/evals.json`](./skills/univer-cli/evals/evals.json)
- [`skills/sit/evals/evals.json`](./skills/sit/evals/evals.json)

These evals are intentionally small prompts that exercise command choice and verification behavior. Expand them when command surfaces or workflow semantics change.

## Contributing

- keep each skill self-contained under `skills/<skill-name>/`
- keep `SKILL.md` concise and move details into one-level `references/`
- add or update eval prompts for behavior changes
- avoid diverging canonical skills and legacy aliases by accident; update canonical skills first

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
