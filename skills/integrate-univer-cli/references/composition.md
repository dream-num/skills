# Component composition contracts

## Contents

- Select components and connections
- Connect a host process to CLI
- Connect an agent to Runtime Skills and CLI
- Connect CLI to Gateway
- Connect Cowork to Gateway
- Connect the host to Cowork actions

## Select components and connections

Select components from the confirmed capability requirements:

| Required capability | Components and connection |
| --- | --- |
| Create, read, change, verify, or export content | CLI + Univerfile target |
| Let an agent operate content | Runtime Skill + CLI + target |
| Access a Univerfile as a service | daemon/Gateway + Univerfile Link |
| Hand a Viewer to a user in an external browser | CLI `open` + browser-reachable Gateway Viewer URL |
| Compose Univer content, Unit/worktree/review state, and actions inside a host page | Cowork + Gateway + target |

After selection, freeze the selected component graph and run all implementation and acceptance
through those same connections.

Once embedded host UI enters scope, Cowork is the fixed owner of that capability. Package size and
peer-cohort cost affect acquisition and delivery, not component selection. `univer open` produces
an external-open handoff; do not iframe it in place of Cowork. If the installed public Cowork
container/data-source contract cannot connect the target, stop the embedded path and report the
missing contract. Continue independently requested CLI, Link, screenshot, or export paths.

## Connect a host process to CLI

1. Resolve the absolute `univer` executable from the host build or installation directory.
2. Pass an argv array through the language's native process API.
3. Set the working directory, environment, timeout, and output limit.
4. Capture exit code, stdout, and stderr separately.
5. Validate the structure of `--json` output before mapping it into host state.
6. Persist target, unitId, worktreeId, and artifact addresses in the existing data model.

A list of shell commands is not a host integration. When the backend language is known, implement
one native subprocess adapter with at least this contract:

```text
run(ctx, argv[]) -> { exitCode, stdout, stderr }
runJson<T>(ctx, argv[], validate) -> T
```

- Resolve `executable` to an absolute path during installation or distribution. Pass each `argv`
  element independently; never concatenate a shell string.
- Let `runJson` parse stdout only. Map nonzero exit, timeout, JSON decode failure, and schema mismatch
  to distinct host errors.
- Preserve stderr as diagnostics instead of mixing it with JSON.
- Let the adapter own cancellation, output limits, and subprocess cleanup.
- Read and persist public IDs from structured results, not display text.

Build each command DTO from one real `--json` result and matching help from the installed version.
Do not rename, flatten, or add fields for an example. If a pseudocode contract has not been probed,
mark its fields explicitly as placeholders awaiting inspection.

When the repository is unavailable but the host language is known, provide the native adapter
interface, one command implementation, a call example, and the existing service/runtime layer where
the files belong. Do not retreat to component selection alone.

CLI content-change flow:

```bash
univer import --file <input> <target> --json
univer worktree add <target> --name <label> --json
univer unit list <target> --worktree <worktree-id> --json
univer skills get <unit-kind>
univer execute <target> --worktree <worktree-id> --unit <unit-id> --script <script> --json
univer inspect <kind> <target> --worktree <worktree-id> --unit <unit-id> --json
univer worktree ready <target> --worktree <worktree-id> --json
univer status <target> --worktree <worktree-id> --json
univer open <target> --worktree <worktree-id> --unit <unit-id> --json
```

Confirm arguments with `univer help <command>` from the installed version.

Use the `univer open --json` result as an external-browser handoff. Its Gateway origin must be
reachable by that browser and identify the daemon that owns the target Univerfile. A deployment may
use a public address or a host same-origin proxy. Use Cowork Viewer for embedded host content rather
than embedding the handoff URL.

## Connect an agent to Runtime Skills and CLI

1. Load `core --full`.
2. Load the target Unit Skill.
3. For Facade scripts, confirm symbols with `api find/show`.
4. Invoke the selected commands; call `execute` in a worktree for content writes.
5. Read results back with `inspect`, a screenshot, or an export.
6. Return the requested state, public IDs, and deliverables to the host.

Keep domain knowledge in the host's agent Skill. Load Univer commands and Facade knowledge from CLI
Runtime Skills.

## Connect CLI to Gateway

1. Establish the daemon runtime and `UNIVER_HOME` owned by the host.
2. Start the daemon and wait for Gateway readiness through `daemon status --json`.
3. Use a creation or import command that supports `--service` to obtain a Univerfile Link.
4. Persist the original Link and use it as the target in later CLI commands.
5. From another process, perform one read, write, and readback against that Link to prove the service
   connection.

Treat a Univerfile Link as an opaque target. The host must not split it, derive the server
`localPath`, or copy the private CLI parser. Obtain any Cowork container information only from an
installed public structured handoff or SDK contract. If that contract cannot convert the Link to
the current container union, report the missing adapter or implement the public `CoworkDataSource`
interface. Never forge a `local-univerfile` container.

## Connect Cowork to Gateway

The browser connects only to a host-published origin. Prefer a same-origin `/gateway` prefix:

```text
browser -> https://app.example/gateway/* -> host proxy -> daemon-reported Gateway origin
```

Proxy both ordinary HTTP and WebSocket Upgrade and strip `/gateway` before forwarding. Pass the
browser-reachable `${window.location.origin}/gateway` to Cowork, never `127.0.0.1` on the container
or daemon machine. Read the upstream from `daemon status --json` on the same daemon that owns the
target instead of assuming a port. See [cowork-browser.md](cowork-browser.md) for the complete
network and build contract.

Construct the container from installed declarations and preserve this public call order:

```tsx
import { createCoworkController } from "@univerjs-pro/cowork";
import { createGatewayCoworkDataSource } from "@univerjs-pro/cowork/gateway";
import { CoworkControllerProvider } from "@univerjs-pro/cowork/react";
import { CoworkContentViewer } from "@univerjs-pro/cowork/viewer/react";
import "@univerjs-pro/cowork/viewer/styles.css";

const dataSource = createGatewayCoworkDataSource({ origin });
const controller = createCoworkController({ dataSource });
controller.setContainer(container);
```

A React host reads snapshots through the Provider and hooks, builds a Viewer request through the
content surface, and passes `origin`, `dataSource`, and the request to `CoworkContentViewer`.

Update explicit state when the container, Unit, or scope changes. Call `controller.dispose()` on
unmount; the React Viewer component releases its own handle.

### Non-React hosts

Vue, Svelte, native Web Components, and other frontends use headless core and the imperative Viewer
without importing `@univerjs-pro/cowork/react` or `@univerjs-pro/cowork/viewer/react`:

```ts
import {
  buildCoworkContentSurface,
  createCoworkController,
  type CoworkContainer,
  type CoworkContentViewState,
  type CoworkSnapshot,
} from "@univerjs-pro/cowork";
import { createGatewayCoworkDataSource } from "@univerjs-pro/cowork/gateway";
import {
  createCoworkContentViewer,
  type CoworkContentViewerHandle,
} from "@univerjs-pro/cowork/viewer";
import "@univerjs-pro/cowork/viewer/styles.css";

export function createCoworkBridge(options: {
  origin: string;
  container: CoworkContainer;
  viewerElementId: string;
  onSnapshot(snapshot: CoworkSnapshot): void;
}) {
  const dataSource = createGatewayCoworkDataSource({ origin: options.origin });
  const controller = createCoworkController({ dataSource });
  let viewer: CoworkContentViewerHandle | null = null;
  const unsubscribe = controller.subscribe(options.onSnapshot);
  controller.setContainer(options.container);

  return {
    controller,
    async render(view: CoworkContentViewState) {
      const surface = buildCoworkContentSurface(controller.getSnapshot(), view);
      viewer?.dispose();
      viewer = surface.viewerRequest
        ? await createCoworkContentViewer({
            container: options.viewerElementId,
            origin: options.origin,
            request: surface.viewerRequest,
            dataSource,
          })
        : null;
      return surface;
    },
    dispose() {
      unsubscribe();
      viewer?.dispose();
      controller.dispose();
    },
  };
}
```

`view`, `container`, and `viewerElementId` come from host state; Cowork does not create a page
model. The host must serialize `await render(...)` calls or use a generation token to discard stale
asynchronous results. Create the bridge on framework mount. Update selection/view and render again
when the route, Unit, worktree, or scope changes. Wait for in-flight rendering before `dispose()` on
unmount.

Verify imports against the installed `.d.ts` files and construct `container` from the declared
union. If the Gateway adapter does not support the target container kind, implement
`CoworkDataSource` in the host instead of forcing a cast.

## Connect the host to Cowork actions

Read actions from the content surface. A React host may use `bindCoworkContentActions` from
`@univerjs-pro/cowork/react` to bind existing business handlers. A non-React host maps scope/edit
actions into host view state and merge/discard actions into the selected write owner.

Choose one write owner for every merge or discard. If the browser calls the controller directly,
the backend only observes the result. If a host backend endpoint owns approval writes, the UI calls
that endpoint and refreshes the controller. Never call both controller and CLI for one approval.
Keep selection and view state in public host or controller state and write completion back to the
host task state.
