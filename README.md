# Univer CLI Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-2-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

The official Univer CLI Skills for Claude Code, Codex, and Cursor. Use them to operate `.univer`
content or integrate Univer CLI, Gateway, and Cowork into your own system.

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
- **Exchange Excel files** — import and export `.xlsx` while keeping the working model in a
  structured `.univer` file.
- **Build Univer-powered applications** — connect CLI processes, agent guidance, daemon/Gateway,
  and Cowork UI to an existing host without prescribing the product shape.

## Choose a Skill

| Skill | Use it for |
| --- | --- |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Creating, inspecting, editing, verifying, importing, or exporting Univer content |
| [`integrate-univer-cli`](./skills/integrate-univer-cli/SKILL.md) | Selecting, acquiring, connecting, customizing, and delivering CLI/Gateway/Cowork components in a host system |

## Version-Matched Guidance

The `univer-cli` entry guides agents to load core guidance and the relevant Unit Skill from the
installed CLI, keeping commands and Facade APIs aligned with that version. The Builder integration
Skill uses the same installed CLI and package declarations as its operational authority.

The available Unit Skills cover Sheet, Doc, Slide, Base, and Board:

```bash
univer skills list
univer skills get core
univer skills get board
```

## Install

Install Univer CLI:

```bash
npm install -g univer-cli@latest
univer doctor
```

Install the Skill:

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
cp -R skills/integrate-univer-cli ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/univer-cli ~/.codex/skills/
cp -R skills/integrate-univer-cli ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/univer-cli ~/.cursor/skills/
cp -R skills/integrate-univer-cli ~/.cursor/skills/
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
Use integrate-univer-cli to add Univer content operations and an embedded Cowork Viewer to this application.
```

## Requirements

- Linux or macOS
- Node.js and npm
- Univer CLI available as `univer`

## Contributing

- Content-operation discovery lives at [`skills/univer-cli/SKILL.md`](./skills/univer-cli/SKILL.md).
- Builder integration lives at [`skills/integrate-univer-cli/SKILL.md`](./skills/integrate-univer-cli/SKILL.md).
- Version-matched operational Skills and resources ship with the Univer CLI package.
- Run `npm run validate` before publishing Skill changes.

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
