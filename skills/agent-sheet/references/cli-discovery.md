# CLI Discovery Reference

Use the real CLI help and runtime output as source of truth when memory and docs diverge.

## What to verify

- available command families
- supported positional shortcuts
- output mode controls
- removed legacy surfaces

## First checks

If the binary is not packaged into `PATH` yet, install it first:

```bash
npm install -g agent-sheet
```

Then inspect the real surface:

```bash
agent-sheet --help
```

For the public local workflow, focus on these surfaces:

- `init [<path>]`
- `inspect workbook|sheet|range|formulas|lint`
- `read range`
- `read search`
- `sheet list|create|rename|copy|delete`
- `file list|info|open|create|import|export`
- `write table|range|cells|fill`
- `script js`

## Output-mode reality

Choose output mode based on the next consumer:

- inline preview for human/model inspection
- `--to-stdout` for shell pipelines
- `--to-file --output <path>` for reusable artifacts
- `--type rawValue` when the task needs exact machine values rather than formatted display values
- `--json` or `--json-summary` for machine parsing

For `read range`, stream/file output now uses real workbook data shape directly. Do not expect synthetic row indexes or synthetic column-letter headers.

## Workspace discovery reality

- `init` is for creating a workspace root, not for confirming one already exists
- if the current tree already belongs to an existing workspace, reuse it
- `--entry-id @current` is an explicit shortcut, not an implicit targeting model

## Removed / constrained legacy surfaces

Do not rely on:

- `meta*` commands
- `--profile*`
- legacy `-u`
- `--artifact-dir`

## Useful local probes

```bash
agent-sheet init   # only when no workspace exists yet at the intended root
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id> --json-summary
```

## Current inspectability limits

The current canonical CLI surfaces can inspect:

- workbook / sheet / range structure
- values
- formulas
- lint-visible issues

They do not independently inspect presentation-only state such as:

- borders
- fonts
- colors
- alignment
- freeze panes

If a task depends on those states, use `script js` carefully and report the visual result honestly instead of claiming canonical CLI verification.

## Notes

- prefer targeted verification over exploratory mutation
- treat CLI help and structured runtime errors as authoritative
