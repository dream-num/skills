# Cowork UI SDK

Cowork is the browser composition SDK for Univer CLI/Gateway. It is neither a replacement for
Univer CLI nor a complete application or general design system. Builders use it to read Unit,
worktree, and review state and place a Univer content Viewer inside their own pages.

## Contents

- UI integration owner
- Current public surface
- How it works
- Builder integration
- Container and Link boundary
- Capability boundary
- UI acceptance

## UI integration owner

Use Cowork when a host page presents or operates Univer content, Unit/worktree/review state, or
related actions. The host still owns the application shell, domain forms, navigation, routing, and
visual design. Cowork supplies the state, actions, and content Viewer consumed by those host UIs.

The Viewer URL returned by CLI `univer open` is an external-open handoff. Use Cowork Viewer for an
embedded content area instead of wrapping that URL in an iframe. If the installed public
container/data-source contract cannot connect the target, explicitly deliver the result
"embedded UI incomplete" and identify the missing adapter or type. Links, screenshots, exports,
and external Viewer handoffs remain independent deliverables.

## Current public surface

Treat the installed `package.json#exports` and `.d.ts` files as authoritative. The current stable
package exposes:

| Entry point | Provides |
| --- | --- |
| `@univerjs-pro/cowork` | controller, snapshot, selection, content surface, and public types |
| `@univerjs-pro/cowork/gateway` | Gateway data source |
| `@univerjs-pro/cowork/react` | Provider, hooks, selectors, and action binding |
| `@univerjs-pro/cowork/viewer` | framework-neutral imperative Viewer |
| `@univerjs-pro/cowork/viewer/react` | React `CoworkContentViewer` |
| `@univerjs-pro/cowork/viewer/styles.css` | Viewer and Univer plugin styles |

The Viewer is the primary directly visible component. Hosts render file navigation, worktree lists,
review counts, badges, buttons, and error or empty states from snapshots, content surfaces, and
actions using their own components.

## How it works

```text
Gateway data source
      |
      v
Cowork controller -> snapshot / selection / actions
      |
      +-> React hooks or host state adapter -> host UI
      |
      +-> content surface -> Viewer request -> Univer Viewer
```

The controller manages container, Unit, active/reviewable worktree, selection, review summary,
action state, and refresh subscriptions. The content surface combines a controller snapshot and a
host-selected scope into a title, badges, edit gate, actions, and Viewer request.

## Builder integration

First pin Cowork and the complete Univer SDK peer cohort through
[acquisition.md](acquisition.md#acquire-the-cowork-sdk), then establish the connection through
[composition.md](composition.md#connect-cowork-to-gateway). Follow
[cowork-browser.md](cowork-browser.md) for browser network, Viewer build, and runtime acceptance.

For React hosts:

1. Create one Gateway data source and controller at a stable page/container-session boundary.
2. Provide the controller through `CoworkControllerProvider`.
3. Project snapshots into host navigation and status UI through hooks/selectors.
4. Build Viewer requests and actions through the content surface.
5. Render `CoworkContentViewer` and load the Viewer styles.
6. Explicitly refresh and read back after known writes. Release subscriptions, controller, and
   Viewer when the container changes or the page unmounts.

For Vue, Svelte, Web Component, and other non-React hosts:

1. Call controller `getSnapshot`, `subscribe`, selection, and action methods directly.
2. Render lists, badges, and controls from host framework state.
3. Mount the imperative Viewer with `createCoworkContentViewer`.
4. Serialize Viewer replacement and call `dispose` on component unmount.

See the runnable framework-neutral bridge in
[composition.md](composition.md#non-react-hosts). Do not introduce React into a non-React
application solely to use Cowork.

## Container and Link boundary

CLI treats a Univerfile Link as an opaque target. The Cowork Gateway adapter accepts an `origin`
and a `CoworkContainer` declared by the installed version. Do not assume that it accepts a raw Link,
split the Link in host code, or derive the server `localPath`.

Read the local `.d.ts` files for the current container union and adapter support. If the public
contract cannot hand a Link to a container, report the missing public adapter or implement the
complete `CoworkDataSource` interface in the host. Do not force a type cast, copy the private
parser, or switch to an iframe handoff.

## Capability boundary

Cowork currently provides Unit/worktree/review state, content surfaces, semantic merge/discard
actions, and Viewer. It does not provide:

- application shell, routing, file upload, or a multi-container product model;
- agent/chat, task queue, or domain workflow;
- full navigation, tabular review lists, or a general UI component library;
- host persistence, release, or daemon lifecycle.

The currently public `CoworkUnitKind` is `sheet | doc | slide | base`. Never assume that content
types absent from the installed union can be rendered.

Assign merge/discard to exactly one write owner: either the browser controller writes Gateway, or a
host backend endpoint/CLI writes. Do not invoke both for one operation.

## UI acceptance

1. Host code imports the public Cowork packages and Viewer styles and creates a data source and
   controller.
2. The controller snapshot reads the target Unit and worktree.
3. When embedded content is required, the content surface generates the correct Viewer request for
   the selected trunk, worktree, or merge-preview scope.
4. When embedded content is required, Cowork Viewer renders real content, and CLI lifecycle changes
   refresh controller state.
5. Host state and Gateway content agree after an action.
6. Container/scope changes leave no stale Viewer, and subscriptions and controller are released on
   page unmount.

See [delivery.md](delivery.md#cowork-acceptance) for complete acceptance,
[cowork-browser.md](cowork-browser.md) for browser build and proxy contracts, and
[reference-implementations.md](reference-implementations.md#openwork-complete-host-integration) for a
public integration reference.
