<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/resource-library

English | 简体中文

Provides a searchable catalog of visual assets for CLI, Agents, and content generation tools, and unified handling of SVG reading, download caching, and batch export.

Each resource has a stable `<registryId>/<resourceId>` handle. Callers depend only on the handle and structured metadata, without needing to understand the internal manifest, search index, or cache formats.

## Installation

```bash
pnpm add @univer-cli/resource-library
```

Requires Node.js 22.12 or higher.

## Quick Start

```ts
import {
  createResourceLibrary,
  type ResourceCache,
  type ResourceDownloader,
  type ResourceOutput,
} from "@univer-cli/resource-library";

const library = createResourceLibrary({ manifest, cache, downloader, output });
const found = library.find({
  queries: ["rocket", "startup"],
  registries: ["icons"],
  limit: 20,
});

const first = found.resources.at(0);
if (first !== undefined) {
  const resource = await library.read({ handle: first.handle });
  console.log(resource.svg);
}
```

## Core operations

- `listRegistries()`: Lists available registries.
- `find()`: Searches by keyword and registry and returns stable handles and summaries.
- `read()`: Read a resource; remote content is downloaded and cached according to the adapter policy.
- `export()`: Writes resources to the caller-provided output and returns a structured list.

The manifest is validated when the library is constructed. Duplicate handles, invalid IDs, unsupported media types, and unsafe paths fail before any download or export.

## Node.js adapter

The package provides a filesystem cache, HTTPS downloader, filesystem output, and manifest loader. Applications can also implement `ResourceCache`, `ResourceDownloader`, and `ResourceOutput` to connect object storage, databases, or in-memory test adapters.

## Security and boundaries

Registry IDs, resource IDs, cache roots, and output paths are all validated for safety. The downloader reads only content declared in the manifest; the application determines authentication headers, network access policies, and the list of trusted registries.

Here, a resource means a visual asset—not a Workspace Resource product object or a plugin resource stored in a Unit snapshot.

For the preset command, see
[`@univer-cli/resource-library-command`](./package-resource-library-command.md).
