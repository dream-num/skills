# CLI Discovery Reference

Use the real CLI help and runtime output as source of truth when memory and docs diverge.

## What to verify

- available command families
- supported positional shortcuts
- output mode controls
- removed legacy surfaces
- runtime health signals relevant to the current task

## First checks

If the binary is not packaged into `PATH` yet:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
export PATH="$REPO_ROOT/scripts:$PATH"
```

Then inspect the real surface:

```bash
agent-sheet --help
```

Important current surfaces:

- `init [<path>]`
- `doctor [--json]`
- `inspect workbook|sheet|range|formulas|lint`
- `read range`
- `read search`
- `sheet list|create|rename|copy|delete`
- `file list|info|open|create|import|push|attach|export`
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
- `--unit-id` outside `file attach`
- `--artifact-dir`
- `--daemon-run-dir`

## Useful runtime probes

```bash
agent-sheet init   # only when no workspace exists yet at the intended root
agent-sheet doctor --json
agent-sheet file list --json
agent-sheet inspect workbook --entry-id <entry-id> --json-summary
```

When remote access matters, inspect these doctor fields:

- `authConfigured`
- `credentialSource`
- `fileHttp.resolvedHost`
- `telemetry.enabled`
- `telemetry.distinctId`

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
