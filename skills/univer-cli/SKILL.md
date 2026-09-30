---
name: univer-cli
description: "Use when installing or operating Univer CLI for .univer files, spreadsheets, documents, slides, Base databases, Board canvases, cross-Unit embedding, worktrees, Facade authoring, inspection, verification, import/export, PDF printing, screenshots, or viewer handoff."
---

# Univer CLI

Terminal-native authoring and inspection for multi-Unit `.univer` files. The CLI provides isolated
worktrees, version-matched Facade guidance, model readback, and browser review.

Install:

```bash
npm install -g univer-cli
univer doctor
```

## Keep the CLI current

Before starting a new Univer task, apply any available CLI update:

```bash
univer update
univer doctor --json
univer skills get core
```

Continue only after `doctor` reports that the CLI is ready. Reload core and the target Unit Skill
after every update. Once task work begins, keep the CLI and loaded Skills unchanged until handoff;
apply later updates before the next new task.

## Start here

This file is the discovery entry, not the operational guide. Before using Univer commands for a
task, load the complete core Skill from the installed CLI:

```bash
univer skills get core          # shared model, workflow, evidence, and handoff
univer skills get core --full   # include direct references and templates
```

Runtime Skills ship with the CLI so their commands and Facade APIs match the installed version.

## Core Model

- A `.univer` path is the authoritative multi-Unit target. Always address the file explicitly.
- A Unit is a top-level Sheet, Doc, Slide, Base, or Board identified by `unitId`; sheet names, pages,
  tables, ranges, shapes, and records live inside that Unit.
- `trunk` is the reviewed main line. A worktree is an isolated scope for agent changes; there is no
  implicit current worktree.
- Command success is not correctness evidence. Read back the target model, verify task-specific
  assertions, and inspect rendered output when appearance matters.

Use public CLI and Facade surfaces. The worktree commit path is the durable write boundary, and
merge remains an explicit review decision.

## Unit Skills

After core, load the Skill matching the target top-level Unit before authoring:

```bash
univer skills get sheet
univer skills get doc
univer skills get slide
univer skills get base
univer skills get board
```

Use `univer skills list` to discover the installed set. Each Unit Skill owns its creation recipe,
Facade entrypoints, readback guidance, and visual verification requirements.

For cross-Unit composition, load the additional Topic Skill after the host and child Unit Skills:

```bash
univer skills get embed
```

For a cross-Unit formula in a Sheet cell or formula-driven Shape, load its Topic Skill after the
Host and Sheet or Base Source Unit Skills:

```bash
univer skills get cross-unit-formula
```

## Task Routing

| Task                                                                              | Load and use                                          |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Inspect or edit spreadsheet values, formulas, formatting, charts, or tables       | core + `sheet`                                        |
| Create or refine document paragraphs, rich text, tables, charts, or page layout   | core + `doc`                                          |
| Build or review presentation pages, shapes, text, or images                       | core + `slide`                                        |
| Create or edit structured Base tables, fields, records, or views                  | core + `base`                                         |
| Create or edit a Board canvas, charts, and other elements                         | core + `board`                                        |
| Embed one Unit inside another Unit                                                | core + host Unit + child Unit + `embed`               |
| Read a Sheet range or Base table column from a Sheet cell or formula-driven Shape | core + Host Unit + Source Unit + `cross-unit-formula` |

## Why Univer CLI

- One `.univer` target can contain Sheet, Doc, Slide, Base, and Board Units addressed by `unitId`.
- Worktrees isolate agent changes until review and merge.
- Offline `api find` searches the installed SDK index by keyword; `api show` resolves exact Facade symbols and details.
- Runtime readback and the viewer verify the stored model and rendered result.
- Import/export, PDF printing, and screenshots use the product runtime rather than unrelated file writers.

Do not edit `.univer` storage directly or substitute unrelated writers. Follow the loaded core and
Unit Skills for the supported path.

## Diagnose

```bash
univer --help
univer doctor
univer skills list
univer skills path
```

Use `univer help <command>` for exact syntax. If the CLI is unavailable or `doctor` reports a
blocking runtime failure, stop and report the diagnostic instead of switching tools.
