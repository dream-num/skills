# Build with Univer

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

An agent skill for building applications with the [Univer Office SDK](https://docs.univer.ai).
[`build-with-univer`](./skills/build-with-univer/SKILL.md) tells your coding agent which Univer SDK
fits the job, where to start, and what to avoid, so it stops guessing from stale training data.

## What it covers

| You are building | SDK |
| --- | --- |
| An embedded spreadsheet, document, or slide editor | Web SDK |
| Real-time collaboration on your own auth and storage, Office import/export | Server SDK |
| A CLI or tool that lets agents read and edit Office content | AI SDK |
| A plain HTML page bound to live Sheet data | Binding SDK |

The skill resolves package versions at build time, never blocks a proof of concept on a missing
license, and lists the superseded servers, packages and API names that models still suggest.

## Install

```bash
npx skills add dream-num/skills --skill build-with-univer
```

Add `-g` for a user-level install, or `-a claude-code -a codex -a opencode` to pick agents.
Re-run the command to update.

### Manual installation

Copy `skills/build-with-univer` into your agent's skills directory:

```bash
git clone https://github.com/dream-num/skills.git && cd skills
mkdir -p ~/.claude/skills && cp -R skills/build-with-univer ~/.claude/skills/              # Claude Code
mkdir -p ~/.agents/skills && cp -R skills/build-with-univer ~/.agents/skills/              # Codex
mkdir -p ~/.config/opencode/skills && cp -R skills/build-with-univer ~/.config/opencode/skills/   # OpenCode
mkdir -p ~/.cursor/skills && cp -R skills/build-with-univer ~/.cursor/skills/              # Cursor
```

## Example prompts

```text
Embed a spreadsheet editor in this React app and read and write cells from code.
```

```text
Let several people edit one spreadsheet in real time, with our own login and database.
```

```text
Build a CLI my coding agent can use to inspect and edit spreadsheets and slides.
```

```text
Add xlsx import and export endpoints to this Node API. We have no license yet.
```

```text
Make a plain HTML dashboard that charts and edits cells in our team's spreadsheet.
```

You do not need to name Univer or the skill; the agent loads it when the task matches.

## Requirements

- Node.js and npm
- Network access to `docs.univer.ai` and the npm registry, which the skill uses for current docs and versions

## Contributing

- The skill lives in `skills/build-with-univer`: `SKILL.md` routes, `references/` holds one page
  per SDK plus versions and what to avoid.
- Keep `SKILL.md` under 500 lines, pin no versions in the text, and run `npm run validate` before
  publishing changes.

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
