---
name: build-with-univer
description: Build applications with Univer Office SDK, covering the Web SDK (browser Office editors, headless Sheets and Docs in Node), Server SDK (self-hosted OT collaboration, storage, auth, Office import/export), AI SDK (agent-operated Office CLIs, reviewable Worktrees), and Binding SDK (plain HTML pages bound to live Sheet data). Use when starting or designing any Univer-based app or choosing Univer packages, including when the user describes a spreadsheet, document, collaboration, or AI-office need without naming a Univer package.
---

# Build with Univer

Univer Office SDK is a family of npm packages, not a single library. Pick the SDK by what you are
building, then follow its example repository where one exists. Do not guess APIs from memory: Univer changes
quickly and older material is widely mis-remembered.

## Pick the SDK

| You are building | SDK | Packages | Start from |
| --- | --- | --- | --- |
| An embedded spreadsheet, document, or slide editor in a web app | Web SDK | `@univerjs/*`, `@univerjs-pro/*` | [references/web-sdk.md](references/web-sdk.md) |
| Generate or modify Sheet or Doc data, or calculate formulas in Node.js | Headless Web SDK | `@univerjs/*` without editor UI | [references/web-sdk.md](references/web-sdk.md#headless-in-node) |
| Real-time multi-user editing with your own auth and storage | Server SDK + Web SDK client | `@univerjs-pro/collaboration-*` | [references/server-sdk.md](references/server-sdk.md), `quick-start` example |
| Server-side Office import/export (xlsx, docx, pptx) | Server SDK | `@univerjs-pro/exchange-node` | [references/server-sdk.md](references/server-sdk.md), `exchange` example |
| Your own CLI or tool that lets agents read and edit Office content | AI SDK | `@univer-cli/*` | [references/ai-sdk.md](references/ai-sdk.md), `01-content-operations` example |
| A plain HTML/CSS/JS page showing or editing live Sheet cells | Binding SDK | `@univerjs-labs/*` | [references/binding-sdk.md](references/binding-sdk.md) (installed packages' docs) |

Real products often combine them. A collaborative editor is Web SDK in the browser plus Server SDK
behind it. An HTML dashboard over shared data is Binding SDK on top of a Server SDK backend.
Running in Node does not by itself select Server SDK or AI SDK: use Headless Web SDK for document
processing, Server SDK for collaboration/storage or Office import/export, and AI SDK for agent tools.

## The four SDKs

- **Web SDK** is the engine. It runs in the browser or headless in Node and covers six products:
  Sheets and Docs (open source), Slides, Boards, Bases and PDFs (Pro). Choose the runtime before
  assembling plugins: browser editors need UI; headless Node processes document data without an
  editor UI. Follow each product's runtime guide rather than assuming Node support. For new Web SDK
  integrations, default to plugin mode; preserve existing presets or an explicit request for them.
  All programmatic control goes through the Facade API.
- **Server SDK** is a set of Node.js packages you assemble inside your own backend: transport,
  endpoint, service and a database adapter, with an OT collaboration engine and history, comment and
  Worktree services. Your application owns users, permissions, storage and deployment.
- **AI SDK** builds Office CLIs for agents. Your app owns the Commander program and its commands;
  the SDK supplies headless runtimes, content inspection and execution, offline Facade API search,
  rendering and layout lint, and Worktree-based review.
- **Binding SDK** connects ordinary HTML pages to Sheet data with `data-univer-*` attributes. Pages
  render in a sandboxed iframe connected to a host, and need a Server SDK collaboration backend.

## Working principles

1. Read the target project first: framework, package manager, and the installed `@univerjs/*`,
   `@univerjs-pro/*` and `@univer-cli/*` versions. Preserve what is installed unless asked to upgrade.
2. For anything new, read in this order and then implement: the relevant docs page, the matching
   example repository in full (where the SDK has one), then the README of each package you import.
   Never invent APIs; if an export is not in the installed declarations or the docs, it does not
   exist. Clone example repositories into a git-ignored directory inside the project (for example
   `.ref/`) and remove it before you finish. If a repository is not reachable, the installed
   packages' `README.md` and `docs/` are the reference.
3. Pick versions at build time, not from memory: check the project's lockfile, then npm dist-tags.
   Keep every package in one release group on the same exact version. See
   [references/versions-and-license.md](references/versions-and-license.md), which also covers the
   `@univerjs-labs` registry and license wiring.
4. Copy an example's wiring rather than recombining packages from scratch. Then replace its demo
   shortcuts (fixed user, always-allow authorization, in-memory storage) with real ones.
5. Verify in proportion to the change: build, run, and for collaboration open two independent
   browser contexts. Run headless examples in plain Node. Before declaring a feature unsupported
   or adding a workaround, check the runtime's installed packages, plugin registrations and Facade
   imports, then verify the native API. A Facade method can exist without its feature plugin.
6. A missing license never blocks a proof of concept. Everything still runs; Pro surfaces show
   watermarks or restrict some operations. Build first, add the license when one is available.
7. Check [references/avoid.md](references/avoid.md) before recommending anything from older docs,
   blog posts or your own memory: superseded servers, packages and API names are listed there.

## Docs for agents

- `https://docs.univer.ai/llms.txt` is the index; `llms-full.txt` is the full bundle.
- Every docs page has a Markdown twin: append `.md` to the URL.
- Section indexes: `/guides/llms.txt` (Web SDK), `/server/llms.txt`, `/ai/llms.txt`, `/reference/llms.txt`.
- `https://docs.univer.ai/server/architecture.md` is the canonical page for choosing entry points.

## Topics beyond the first build

Look these up in the docs instead of guessing. Every URL has a Markdown twin (append `.md`).

| Topic | Where |
| --- | --- |
| Facade API for a product | `https://docs.univer.ai/guides/<product>/getting-started/facade` |
| Pro products, advanced formula engine, permissions | `/guides/sheets/features/advanced-formula`, `/guides/sheets/features/core/permission` |
| Custom UI components, plugins, commands | `/guides/sheets/ui/components` and the package reference at `/reference/llms.txt` |
| Themes and dark mode | `/guides/fundamentals/ui/themes` |
| Web Workers, i18n, headless Node | `/guides/sheets/getting-started/{worker,i18n,node}` |
| Server-side collaboration and Office import/export | `/server/llms.txt` |
| Agent-operated Office content | `/ai/llms.txt` |
