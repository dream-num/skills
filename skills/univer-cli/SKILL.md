---
name: univer-cli
description: "Use when installing or operating Univer CLI for .univer files, spreadsheets, documents, slides, Base databases, Board canvases, worktrees, Facade authoring, inspection, verification, import/export, screenshots, or viewer handoff."
hidden: true
---

# Univer CLI

Terminal-native authoring and inspection for multi-Unit `.univer` files. The CLI provides isolated
worktrees, version-matched Facade guidance, model readback, and browser review.

Install:

```bash
npm install -g univer-cli
univer doctor
```

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

## Task Routing

| Task | Load and use |
| --- | --- |
| Inspect or edit spreadsheet values, formulas, formatting, charts, or tables | core + `sheet` |
| Create or refine document paragraphs, rich text, tables, or page layout | core + `doc` |
| Build or review presentation pages, shapes, text, or images | core + `slide` |
| Create or edit structured Base tables, fields, records, or views | core + `base` |
| Create or edit a Board canvas and its elements | core + `board` |

## Standard Task Loop

1. Identify one explicit `.univer` target and inspect its Unit inventory.
2. Create or reuse the correct worktree; re-check its state before continuing a prior task.
3. Load core and the target Unit Skill before authoring.
4. Gather bounded target evidence, then author through the documented Facade path.
5. Read back the stored model and verify task-specific facts.
6. Render or open the viewer when visual fidelity matters.
7. Mark the worktree ready and hand off the review link; merge or discard follows review.

## Why Univer CLI

- One `.univer` target can contain Sheet, Doc, Slide, Base, and Board Units addressed by `unitId`.
- Worktrees isolate agent changes until review and merge.
- Offline `api show` / `api find` resolves exact Facade symbols for the installed SDK.
- Runtime readback and the viewer verify the stored model and rendered result.
- Import/export and screenshots use the product runtime rather than unrelated file writers.

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
