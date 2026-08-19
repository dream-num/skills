<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-layout-lint-command

English | 简体中文

Provide a native Commander `lint` preset for `@univer-cli/unit-layout-lint`. The command currently accepts Slide only.

## Installation

```bash
pnpm add commander @univer-cli/unit-layout-lint @univer-cli/unit-layout-lint-command
```

## Add to application

```ts
import { createUnitLayoutLint } from "@univer-cli/unit-layout-lint";
import { createUnitLayoutLintCommand } from "@univer-cli/unit-layout-lint-command";

program.addCommand(
  createUnitLayoutLintCommand({
    lint: createUnitLayoutLint({ runtime: slideLayoutRuntime }),
    loadUnit: async ({ unitId }) => await loadSlideUnitData(unitId),
  }),
);
```

The command parses a Unit ID, page selectors, rule filters, and `--json`. Default text lists findings; JSON output contains the complete report. No findings is a successful result. Commander exits non-zero when input, loading, rendering, or linting fails.

The application owns target resolution and UnitData loading. The package does not access Workspace, files, or servers. The factory returns a native `Command`.
