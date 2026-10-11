# AI SDK

Toolkit for building your own Office CLI that agents drive. Your app owns the root Commander
program, command names, targets, identity and authorization, output, and deployment. The SDK
supplies the capabilities behind the commands.

Docs: `https://docs.univer.ai/ai/llms.txt`. Examples: `dream-num/univer-cli-examples`.

## Package roles

| Role | Provides |
| --- | --- |
| Base package | Structured TypeScript APIs. No Commander; you decide command names, output and exit behavior |
| `*-command` preset | A ready Commander `Command` over a base package. Attach with `program.addCommand()` |

Not every base package has a preset. Start from the base package for the task, add its preset only
if the default arguments and help fit your product. Per-package APIs: the README on each npm page.

| Task | Base package | Preset |
| --- | --- | --- |
| Standard headless Univer | `@univer-cli/headless-univer` | none |
| Run one collaborative Unit | `@univer-cli/univer-collaboration-runtime` | none |
| Reuse runtimes in workers | `@univer-cli/univer-collaboration-runtime-pool` | none |
| Share one resident process across CLI calls | `@univer-cli/daemon` | `daemon-command` |
| Read Sheet, Doc, Slide content | `@univer-cli/content-inspection` | `content-inspection-command` |
| Bind and prepare Facade code | `@univer-cli/content-execution` | none |
| Offline Facade API search | `@univer-cli/api-reference` | `api-reference-command` |
| SVG to Slide Facade code | `@univer-cli/svg-facade` | `svg-facade-command` |
| Typst bundle to Doc Facade code | `@univer-cli/doc-typst-facade` | `doc-typst-facade-command` |
| Unit PNG | `@univer-cli/unit-screenshot` | `unit-screenshot-command` |
| Unit to PDF (browser Render Page) | `@univer-cli/unit-pdf-printer` | none |
| Slide layout lint | `@univer-cli/unit-layout-lint` | `unit-layout-lint-command` |
| Render Page host / builder | `@univer-cli/univer-render-runtime`, `univer-render-page` | none |
| App configuration | `@univer-cli/config` | `config-command` |
| Visual resource library | `@univer-cli/resource-library` | `resource-library-command` |

Also published: `@univer-cli/generic-keyed-instance-pool`.

## The agent loop

```text
inspect -> api find / api show -> execute --mode read -> execute --mode write (+ commit) -> review
```

| Agent goal | Use |
| --- | --- |
| Structure, Range, Paragraph, Slide content | `inspect` |
| Gaps inspect does not cover (conditional formats, charts) | `execute --mode read` |
| Unfamiliar Facade API | `api find` / `api show` |
| Change and commit | `execute --mode write` |
| Review | `inspect`, `execute --mode read`, screenshot |

`api`, read-mode and review are conditional. Load the Unit, `pull()`, operate, `commit()`, `close()`.

## Minimal runtime

From `examples/01-content-operations/src/cli/features/unit-content.ts`, trimmed:

```ts
import { prepareContentExecutionProgram } from "@univer-cli/content-execution";
import { createContentInspectionCommand } from "@univer-cli/content-inspection-command";
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createCollaborationServerAdapter,
  createUniverCollaborationRuntimeFactory,
} from "@univer-cli/univer-collaboration-runtime";

const factory = createUniverCollaborationRuntimeFactory({
  backend: createCollaborationServerAdapter(collaborationUrls(serverUrl)), // your URL mapping
  createUniver: createStandardHeadlessUniverFactory({
    license: process.env["UNIVER_LICENSE"] ?? "", // "" = unlicensed
  }),
});

const runtime = await factory.load(unitId, instanceType);
await runtime.pull();
try {
  const code = prepareContentExecutionProgram({ code: userCode, unitId, unitType: "sheet" });
  await runtime.execute({ code, mode: "write" });
  await runtime.commit();
} finally {
  await runtime.close();
}

program.addCommand(createContentInspectionCommand({ acquireRuntime })); // acquireRuntime: yours
```

`collaborationUrls`, `acquireRuntime` and the Unit-type mapping are app code. Copy them from the
example rather than rewriting.

## Worktree

A Worktree is a collaboration draft of a Unit, not a git worktree. The agent edits in isolation,
then the draft is handed to a human.

```text
create -> agent: load, pull, inspect, execute(write), commit -> checks -> Ready
       -> human reviews in the Web UI -> Merge | Reopen | Discard
```

- Merging is a human step in the Web UI, and still passes the trunk's authorization.
- The backend comes from the Server SDK Worktree packages (`@univerjs-pro/collaboration-worktree-*`:
  service, endpoint, client). See [server-sdk.md](server-sdk.md).
- Your app maps `worktreeID + unitID` to the Worktree protocol URLs and passes them to the runtime
  backend. `createWorktreeContentInspectionCommand()` forces `--trunk` or `--worktree <id>`.
- Trunk write policy belongs to your Server middleware and ACLs, not the CLI.

## Licensing

`license` on the headless factory is optional; an empty string means unlicensed. Reading and
non-Pro surfaces keep working. Pro-gated writes (for example chart insertion) are rejected before
any mutation is produced. Pass content, not a path, from an environment variable. See
[versions-and-license.md](versions-and-license.md).

## Examples

`github.com/dream-num/univer-cli-examples`, one self-contained project per directory.

| Example | Shows |
| --- | --- |
| `01-content-operations` | Recommended starter: create, inspect, execute, commit, open in Web. Sheet, Doc, Slide |
| `02-file-exchange` | Office import/export (adds `import`, `export`) |
| `03-visual-inspection` | Screenshot, Render Page, Layout Lint |
| `04-worktree` | Agent edits in a Worktree, human review: Ready, Merge, Reopen, Discard. Review UI components live in the example's `src/web`, not in a package |
| `slide-gen-cli` | Agent-authored Slides from SVG, resource library, review, PPTX export |
| `doc-gen` | Doc from a Typst bundle, compiled and visually verified (no Server needed) |

Read `01` to `04` in order; each adds one topic to the previous. Run inside an example directory:

```bash
pnpm install && pnpm build && pnpm link-cli && pnpm start-server   # then use univer-example-cli
pnpm skill:install                                                 # optional: agent skill
```

`doc-gen` skips `start-server`; follow its README. Each README has a "Use it with an Agent" section
with a ready prompt (the docs call it the Agent skill prompt) and a `skills/` folder to install.
They are teaching assemblies: replace the demo identity, authorization and storage before shipping.
Check each package's `engines` for Node requirements; screenshot, render and layout lint need
Chrome, Chromium or Edge.

## Not building a product?

If the task is only to read or edit existing files, do not assemble an SDK. `univer-cli` (local
`.univer` files) and `univer-workspace-cli` (remote Workspace files) are ready-made npm CLIs built
on this SDK; install the one that fits and use its `--help`.

## Gaps to plan for

- Examples are directories under `examples/` in `univer-cli-examples` (for example
  `examples/04-worktree`) and are often pinned to an older SDK version than the registry's latest.
  Take the structure from them and the versions from [versions-and-license.md](versions-and-license.md).
- The SDK does not separate agent identity from human identity. Give the agent its own identity in
  your authorization layer, limited to Worktree writes, and never rely on the CLI alone to keep it
  off trunk.
- The docs do not describe what happens when trunk changes after a Worktree is created. Test merge
  behavior with concurrent edits before promising reviewers anything.
