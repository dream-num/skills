# Avoid

Outdated or superseded material that models and old blog posts still surface. If a request or an
existing codebase points at one of these, say so and use the replacement.

| Do not use | Why | Use instead |
| --- | --- | --- |
| Deploying a standalone "Univer Server" or `universer` with Docker, Kubernetes or Helm | Removed. Replaced by the self-hosted Server SDK that you assemble inside your own backend | Server SDK, starting from `univer-collaboration-examples` `quick-start` |
| OIDC login, `/unit/-/create`, upload or sign-url routes, formula-limit routes from the old server | Gone with the old server; the Server SDK Endpoint does not serve them | Your own auth in transport middleware and your own create API calling `createUnitFromData()` |
| `univer-mcp`, `univer-mcp-start-kit`, `@univerjs-pro/mcp` | Early-stage parallel path: a browser Univer instance with a bridge plugin and a console API key, on the pre-1.0 package line. The AI SDK gives headless runtimes, version-matched API search and Worktree review without a browser | AI SDK; for ready-made tools, the `univer-cli` / `univer-workspace-cli` npm CLIs |
| Uniscript | Removed | Facade API, or the AI SDK's `execute` |
| `@univerjs/facade` | Frozen package | `@univerjs/core/facade` plus each package's `/facade` import |
| `createUniverSheet`, `getActiveUniverSheet`, `getUniverSheet` | Legacy Facade names | `createWorkbook`, `getActiveWorkbook`, `getWorkbook` |
| `importXLSXToSnapshotAsync` | Legacy name | `importSheetToSnapshotAsync` from `@univerjs-pro/sheets-exchange-client/facade` |
| Legacy hook-style Facade event registration | Replaced | `addEvent()` |
| UMD builds of presets | Gone | ESM through a bundler or CDN module imports |
| Docs Quick Insert, Live Share | Removed | None |
| `dream-num/univer-presets`, `univer-doc-start-kit`, `univer-plugins`, `univer-examples`, `univer-sdk-skills` | Stale snapshots of older releases | `dream-num/univer-collaboration-examples` (Server SDK), `dream-num/univer-cli-examples` (AI SDK), and `dream-num/univer` `presets/` for preset source |
| Printing or export limits recalled from older docs | No longer documented | Build without a license and treat limits as unspecified |

## Names that still exist

These look like the old server but are current protocol or option names:

- `universerEndpoint` is a preset option for the collaboration server base URL.
- `/universer-api/...` is the default `protocolBasePath` of the Server SDK Endpoint.

They do not mean a `universer` service is required.

## When a source disagrees

Prefer, in order: the installed package's declarations, `docs.univer.ai` (current `llms.txt`),
the example repository on its `main` branch, then package READMEs. Anything older than the current
release line, including 0.x tutorials, is migration history, not guidance.
