# Univer Skills

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Skills](https://img.shields.io/badge/skills-10-0a7ea4.svg)
![Support](https://img.shields.io/badge/support-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-1f6feb.svg)
![OS](https://img.shields.io/badge/os-Linux%20%7C%20macOS-555.svg)

Languages: [English](./README.md) | [简体中文](./README.zh-CN.md)

Official Univer Skills for SDK integration, Pro products, plugin and theme development, backend
processing, and CLI operation.

## Skills

| Skill | Use it for |
| --- | --- |
| [`build-univer-app`](./skills/build-univer-app/SKILL.md) | Cross-SDK architecture, ownership, compatibility, and routing |
| [`univer-integrate`](./skills/univer-integrate/SKILL.md) | Embedding Univer Sheets, Docs, or Slides and using the current Facade API |
| [`univer-pro-integrate`](./skills/univer-pro-integrate/SKILL.md) | Integrating licensed Sheets, Docs, Slides, Bases, Boards, PDFs, collaboration, exchange, and Pro features |
| [`univer-node-backend`](./skills/univer-node-backend/SKILL.md) | Running headless Univer model and formula workflows in Node.js |
| [`univer-plugin-dev`](./skills/univer-plugin-dev/SKILL.md) | Building plugins, Commands, UI extensions, events, and Facade extensions |
| [`univer-customize-theme`](./skills/univer-customize-theme/SKILL.md) | Customizing palettes, dark mode, theme-aware UI, and Pro Chart themes |
| [`univer-cli-sdk-integration`](./skills/univer-cli-sdk-integration/SKILL.md) | Building applications with `@univer-cli/*` packages |
| [`univer-collaboration-integration`](./skills/univer-collaboration-integration/SKILL.md) | Building a self-hosted Collaboration SDK backend |
| [`univer-cli`](./skills/univer-cli/SKILL.md) | Operating local `.univer` files |
| [`univer-workspace-cli`](./skills/univer-workspace-cli/SKILL.md) | Operating remote Workspace files |

The SDK Skills track current Univer OSS and Pro source across Sheets, Docs, Slides, Bases, Boards,
and PDFs. Preserve an existing application's exact installed package versions and inspect its
exports and Facade declarations before using a source-new API.

`build-univer-app` introduces the complete application shape and routes implementation to the
owning SDK Skill. The CLI SDK and Collaboration SDK Skills are generated upstream and migrated here.

The two CLI Skills are independent discovery entries, not a core/variant pair: `univer-cli`
operates local `.univer` files, while `univer-workspace-cli` operates remote Workspace files.
They load version-matched operational Skills from the installed CLI:

```bash
univer skills get core
univer-workspace-cli skills get core
```

## Install

Install all Skills:

```bash
npx skills add dream-num/skills
```

Install one Skill:

```bash
npx skills add dream-num/skills --skill univer-integrate
```

Install the matching CLI only when the task operates that application:

```bash
npm install -g univer-cli@latest
univer doctor

npm install -g univer-workspace-cli@latest
univer-workspace-cli config set-origin https://workspace.example.com
univer-workspace-cli doctor
```

### Manual installation

```bash
git clone https://github.com/dream-num/skills.git
cd skills

# Claude Code
mkdir -p ~/.claude/skills
cp -R skills/* ~/.claude/skills/

# Codex
mkdir -p ~/.codex/skills
cp -R skills/* ~/.codex/skills/

# Cursor
mkdir -p ~/.cursor/skills
cp -R skills/* ~/.cursor/skills/
```

## Example Prompts

```text
Use univer-integrate to embed a themed spreadsheet editor in this React application.
```

```text
Use univer-pro-integrate to add collaboration and XLSX exchange to this Sheets application.
```

```text
Use univer-plugin-dev to scaffold a command-driven plugin with a Facade extension.
```

```text
Use univer-cli to update this local .univer file and verify the result.
```

```text
Use univer-workspace-cli to edit this Workspace file in a new Worktree and return a review URL.
```

## Requirements

- Node.js and npm for installation
- The matching `univer` or `univer-workspace-cli` command for CLI tasks
- The target application's installed Univer packages and release line for SDK tasks

## Contributing

- CLI discovery Skills live in `skills/univer-cli` and `skills/univer-workspace-cli`; their
  version-matched operational resources ship with the corresponding CLI.
- SDK Skills keep their supporting `agents/`, `references/`, `assets/`, and `scripts/`
  inside their owning skill directory.
- Run `npm run validate` before publishing Skill changes.
- Run `npm run validate:skill` when changing `build-univer-app`; it uses the standard Skill Creator
  validator from the local Codex installation.

## License

This repository is licensed under the [Apache-2.0 License](./LICENSE).
