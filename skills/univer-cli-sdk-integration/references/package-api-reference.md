<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/api-reference

English | 简体中文

Search and consult the Univer Facade API locally without launching Univer or accessing online documentation.

When you know only what you want to accomplish, search by keyword. When you know the exact symbol, inspect structured details for classes, members, types, and enums. Query results are ordinary TypeScript data that a CLI, Agent, editor tool, or custom interface can process further.

## Installation

```bash
pnpm add @univer-cli/api-reference
```

Requires Node.js 22.12 or higher.

## Quick Start

The package includes a reference generated from the current Univer SDK declarations:

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";

const reference = createStandardApiReference();

const matches = reference.find({
  terms: ["setValues", "conditional formatting"],
  unit: "sheet",
  limit: 20,
});

const details = reference.show(["FRange", "FRange.setValues", "ICellData.v"]);
```

`find()` returns matches for each keyword and is useful for discovering APIs. `show()` returns precise details for each symbol and is useful for generating instructions or validating input.

## Query rules

- Search is case-insensitive and supports substrings, camelCase word splitting, and fuzzy matching.
- `unit` can restrict results to `sheet`, `slide`, or `doc`; shared APIs are always included.
- `limit` works on each search term, not the sum of all results.
- Details include inheritance, composition, overloads, related types, and spelling suggestions.
- Common class names can use aliases, for example, `range` will be resolved to `FRange`.
- When the symbol does not exist, `status: "not-found"` is returned and no exception is thrown.

## Load your own reference

If your application needs to pin a different API dataset, load a prebuilt artifact:

```ts
import { loadApiReference } from "@univer-cli/api-reference";

const reference = loadApiReference(artifact);
```

Artifact is a versioned opaque value. The package verifies the format when loading; callers should not rely on its internal index structure.

For the preset command, see
[`@univer-cli/api-reference-command`](./package-api-reference-command.md).

## API entry

- `createStandardApiReference()`: Create reference using built-in Univer declarations.
- `loadApiReference(artifact)`: Verify and load pre-generated artifacts.
- `ApiReference.find()`: Discover APIs by keyword.
- `ApiReference.show()`: Inspect details by symbol.
