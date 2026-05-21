# UNIVER CLI README Highlights Design

## Goal

Add a concise `## Highlights` section to the repository README that makes `univer-cli` feel like an agent-native workbook substrate, not a thin spreadsheet file utility.

## Placement

Insert `## Highlights` after `## Why This Skill` and before `## Quick Install`.

## Tone

Use direct, geek-friendly language aimed at experienced developers. Keep the copy short, memorable, and technically precise.

## Approved Copy

```md
## Highlights

- **A spreadsheet engine that lives in your terminal**  
  Drive real workbook semantics from the CLI: formulas, formatting, conditional formatting, charts, shapes, layout, import/export, and live preview.

- **Commits for workbook state**  
  Agents mutate workbooks fast; humans review the rendered result; only verified changes become explicit, syncable changesets.

- **Cloud-backed workbook multiplayer**  
  Clone, pull, and sync shared workbook state through Univer’s OT-based collaboration layer, so agents can work across machines and regions.

- **Pipelines over cells, not files**  
  Stream sheet ranges through `pipe out` / `pipe in`, route them through shell tools, and write back bounded matrices without cracking open workbook packages.

- **Excel at the edge**  
  Keep `.xlsx` import/export as the handoff boundary, while agents work against structured Univer workbook state internally.
```

## Scope

This change only updates README positioning and feature copy. It does not change `skills/univer-cli/SKILL.md`, command references, run-api descriptions, installation instructions, or examples.

## Validation

Review the rendered README section for concise wording, accurate capability claims, and alignment with existing repository tone.
