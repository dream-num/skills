# Univer CLI Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

The official Univer CLI Skills for Claude Code, Codex, and Cursor. Give your agent a local
`.univer` file or a remote Workspace task and describe the result you want; the matching Skill
guides it through authoring, verification, and visual review.

These are two independent applications, not a core/variant pair: `univer-cli` operates local
`.univer` files, while `univer-workspace-cli` operates remote Workspace files.

Learn more about Univer at [univer.ai](https://univer.ai).

## What You Can Do

- **Build spreadsheets** — edit values and formulas, apply formatting, and work with tables,
  charts, and shapes.
- **Create documents and slides** — author rich content, arrange layouts, and review rendered
  output.
- **Manage structured data** — create Base tables, fields, records, and views.
- **Use an open canvas** — create Board canvases and add visual elements.
- **Work safely with agents** — isolate changes in worktrees, read back stored models, and hand off
  a browser review link.
- **Automate remote Workspace files** — discover files in Personal or Team Spaces, stage them in
  task Worktrees, and deliver review URLs without merging automatically.
- **Exchange Excel files** — import and export `.xlsx` while keeping the working model in a
  structured `.univer` file.

## Version-Matched Guidance

This repository installs two entry Skills:

- [`univer-cli`](./skills/univer-cli/SKILL.md) for local `.univer` files.
- [`univer-workspace-cli`](./skills/univer-workspace-cli/SKILL.md) for remote Workspace files.

Each entry guides agents to load core guidance and the relevant Unit Skill from the installed CLI,
keeping commands and Facade APIs aligned with that version. Univer CLI covers Sheet, Doc, Slide,
Base, and Board; Workspace CLI currently covers Sheet, Doc, and Slide.

```bash
univer skills list
univer skills get core
univer-workspace-cli skills list
univer-workspace-cli skills get core
```

## Install

Install the CLI matching the task:

```bash
npm install -g univer-cli@latest
univer doctor

npm install -g univer-workspace-cli@latest
univer-workspace-cli config set-origin https://workspace.example.com
univer-workspace-cli doctor
```

Install the Skills:

```bash
npx skills add dream-num/skills
```

### Manual installation

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/univer-cli ~/.claude/skills/
cp -R skills/univer-workspace-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/univer-workspace-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/univer-workspace-cli ~/.cursor/skills/
```

## Example Prompts

```text
Use univer-cli to inspect this .univer file and update the formulas and formatting on its pricing sheet.
```

```text
Use univer-cli to create a Board, insert a shape, and open the viewer for review.
```

```text
Use univer-cli to create a Base with a contacts table, add a record, and verify the stored model.
```

```text
Use univer-workspace-cli to find the quarterly report in my Team Space, update it in a new Worktree, verify the result, and give me the review URL without merging.
```

## Requirements

- Linux or macOS
- Node.js and npm
- the matching CLI available as `univer` or `univer-workspace-cli`

## Contributing

- Entry Skills live under `skills/<cli-name>/SKILL.md`.
- Version-matched operational Skills and resources ship with their CLI packages.
- Run `npm run validate` before publishing Skill changes.

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
