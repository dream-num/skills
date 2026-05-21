# UNIVER CLI README Highlights And Chinese README Design

## Goal

Make the repository README sharper and bilingual:

- remove the current `## Why This Skill` section from the English README
- add a concise `## Highlights` section that makes `univer-cli` feel like an agent-native workbook substrate, not a thin spreadsheet file utility
- add a Chinese README with equivalent positioning, highlights, install steps, skill table, examples, requirements, contributing notes, and license
- add a visible language switch in the English README that links to the Chinese README

## Placement

In `README.md`:

- add a compact language switch near the top, after the badge block and before the intro paragraph
- remove `## Why This Skill`
- insert `## Highlights` after the intro and canonical skill bullet, before `## Quick Install`

Create `README.zh-CN.md` as the Chinese counterpart. Add a language switch near the top that links back to `README.md`.

## Tone

Use direct, geek-friendly language aimed at experienced developers. Keep the English copy short, memorable, and technically precise.

The Chinese README should be natural technical Chinese, not a literal translation. It should keep product nouns and commands in English where that is clearer: `univer-cli`, `univer`, `unv`, `.xlsx`, `.univer`, `pipe out`, `pipe in`, `inspect`, `search`, `run`, `sync`.

## Approved English Highlight Copy

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

## Chinese Highlight Copy

```md
## 亮点

- **住在终端里的电子表格引擎**  
  直接从 CLI 驱动真实 workbook 语义：公式、格式、条件格式、图表、形状、布局、导入/导出和实时预览。

- **面向 workbook state 的 commits**  
  Agent 负责高速修改，人类 review 渲染后的结果；只有验证过的变更才会成为明确、可同步的 changeset。

- **云端 workbook multiplayer**  
  基于 Univer 的 OT 协同层 clone、pull、sync 共享 workbook state，让跨机器、跨地域的 agents 可以协作处理同一份工作簿。

- **对 cells 做 pipeline，而不是拆文件**  
  通过 `pipe out` / `pipe in` 流式处理 sheet ranges，接入 shell 工具链，再把有边界的矩阵写回 workbook，不需要打开 workbook 包内部结构。

- **Excel 留在边界上**  
  用 `.xlsx` import/export 作为交付边界；agent 内部处理的是结构化 Univer workbook state。
```

## Scope

This change updates README positioning, feature copy, and Chinese documentation. It does not change `skills/univer-cli/SKILL.md`, command references, run-api descriptions, installation commands, or CLI behavior.

## Validation

Review both README files for concise wording, accurate capability claims, working language-switch links, and alignment with existing repository tone.
