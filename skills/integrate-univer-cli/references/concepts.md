# Core Univer concepts

## Contents

- Univer
- Univerfile
- Unit and unitId
- Facade API
- Target
- Trunk, worktree, and commit
- Runtime Skills
- Daemon and Gateway
- Univerfile Link
- Cowork SDK
- Link, Viewer URL, and export artifacts
- Builder host

## Univer

Univer is a full-stack isomorphic Office SDK for building spreadsheets, documents, and
presentations. It provides a plugin architecture, browser and Node.js runtimes, Canvas rendering, a
formula engine, and a unified Facade API so builders can embed Office capabilities in their own
products.

This Skill places Univer CLI at the center of integration. Univer SDK supplies the underlying
content engine and APIs, Univer CLI supplies file, Unit, worktree, and terminal workflows,
daemon/Gateway supplies service access, and the Cowork SDK supplies browser state and Viewer
composition.

```text
agent -- Runtime Skill --+
builder host ----------->+--> Univer CLI --> Univerfile target
                              |
                              +--> daemon/Gateway <-- Cowork <-- host UI

Univer SDK supplies the content engine and Facade API used by CLI content runtimes and Cowork Viewer.
```

## Univerfile

A `.univer` file is a multi-Unit container. One Univerfile can contain Sheet, Doc, Slide, Base, and
Board Units at the same time. Builders address the complete Univerfile as the content target;
workbooks, pages, and similar objects live inside their corresponding Units.

## Unit and unitId

A Unit is a top-level content object inside a Univerfile:

- `sheet`: spreadsheet workbook;
- `doc`: rich-text document;
- `slide`: presentation;
- `base`: structured database;
- `board`: canvas.

Each Unit is addressed by `unitId`. Sheet names, pages, paragraphs, records, and shapes are objects
inside a Unit.

## Facade API

Facade API is Univer's programmatic content-operation surface. `univer execute` runs Facade
JavaScript in a specified Unit and worktree. Use `univer api find`, `univer api show`, and the target
Unit Skill to discover the exact installed API.

## Target

A target identifies the Univerfile accessed by CLI or SDK:

- local target: a `.univer` filesystem path;
- remote target: a Univerfile Link issued by Gateway.

Use the same target throughout one task. Interpret `unitId` and `worktreeId` within that target.

## Trunk, worktree, and commit

- `trunk` is the primary content line.
- A worktree is an isolated change scope addressed by `worktreeId`.
- An `execute` call that changes content creates a worktree commit.
- `ready` marks the changes for review.
- `merge` writes the selected worktree result into trunk.
- `discard` closes a worktree whose result should not be kept.

The content write path is:

```text
trunk -> worktree -> execute/commit -> verify -> ready -> merge
```

## Runtime Skills

Runtime Skills ship with the CLI and match the installed command and Facade API versions. `core`
describes the shared model and workflow; `sheet`, `doc`, `slide`, `base`, `board`, and `embed`
describe their corresponding content capabilities.

## Daemon and Gateway

The daemon is the background process managed by CLI. Gateway is its service surface for accessing
Univerfile, Unit, worktree, and collaboration data over HTTP and lifecycle event streams.
`UNIVER_HOME` is the runtime root for daemon, Gateway, configuration, and persisted state.

## Univerfile Link

A Univerfile Link is a public target for a Univerfile served by Gateway. CLI can continue to perform
Unit, worktree, inspect, execute, and open operations against the Link. A Cowork data source whose
container contract supports the Link can access the same content.

## Cowork SDK

Cowork is a browser integration SDK composed of:

- controller and snapshot: container, Unit, worktree, selection, and action state;
- Gateway data source: Gateway reads and lifecycle subscriptions;
- React bindings: Provider, hooks, and selectors;
- content surface: badges, actions, and Viewer requests derived from state;
- Viewer: trunk, worktree, or merge-preview rendering;
- styles: Viewer and Univer plugin styles.

## Link, Viewer URL, and export artifacts

- Use a Univerfile Link to continue operating a remote Univerfile.
- Use a Viewer URL to hand a particular target, Unit, and scope to an external browser. It is not an
  embedded host-page API.
- Use a Cowork Viewer request to render content inside a host page.
- Use exported XLSX, CSV, DOCX, or PPTX files for Office-file delivery.

Persist the handle or file required by the user's next operation.

## Builder host

The builder host is the user's backend, desktop process, browser UI, agent runtime, or task system.
It owns the domain workflow and product experience, and composes Univer components through public
targets, IDs, JSON results, controller state, and Viewer requests.
