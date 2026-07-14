# Official Univer CLI Discovery Skill

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-1-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer CLI discovery skill for Claude Code, Codex, and Cursor.
Start from [univer.ai](https://univer.ai).

This repository exposes one canonical product skill:

- [`univer-cli`](./skills/univer-cli/SKILL.md): install and diagnose the public `univer` CLI, then
  load version-matched core and Unit Skills from the installed package.

## Highlights

- **One CLI for every Unit type**
  Work with Sheet, Doc, Slide, Base, and Board Units in explicit `.univer` targets.

- **Version-matched operational guidance**
  Load core and Unit Skills from the installed CLI so commands and Facade APIs match that version.

- **Evidence-first authoring**
  Read back stored models and review rendered output before handoff.

- **Excel-compatible handoff**  
  Import and export `.xlsx` files while agents work against structured `.univer` workbook state.

## Why One Skill

`univer-cli` is a hidden discovery skill, not a second copy of the operational documentation. It
installs or diagnoses the CLI and directs agents to the core and Unit Skills bundled with that CLI.
Those runtime Skills are the authority for commands, Facade APIs, and verification behavior.

The skill uses progressive disclosure:

- `skills/univer-cli/SKILL.md` is the complete repository payload.
- `univer skills get core` loads the shared operational Skill.
- `univer skills get sheet|doc|slide|base|board` loads Unit-specific guidance.

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
| [`univer-cli`](./skills/univer-cli/SKILL.md) | CLI installation, diagnosis, and version-matched Skill discovery | canonical |

## Example Prompts

```text
Use univer-cli to inspect this .univer file and update its pricing sheet.
```

```text
Use univer-cli to create a Board, insert one shape, and open the viewer for review.
```

```text
Use univer-cli to create a Base, add a table and record, then verify the stored model.
```

## Requirements

- OS: Linux or macOS
- Univer CLI installed as `univer`
- Node.js and npm for installation

## Contributing

- keep the discovery skill source under `skills/univer-cli/SKILL.md`
- keep operational Skills and resources version-matched inside the Univer CLI package
- do not duplicate runtime command or Facade guidance in this repository
- run `npm run validate` before publishing skill package changes

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
