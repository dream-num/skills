# Capability and owner boundaries

Choose components from public inputs, outputs, and ownership boundaries, not from an assumed
application category.

## Contents

- Component boundaries
- What CLI provides
- What Runtime Skills provide
- What Gateway provides
- Browser UI ownership
- What Cowork provides
- Univerfile Link and Cowork
- Determine whether a capability exists

## Component boundaries

| Component | Provides directly | Owned elsewhere |
| --- | --- | --- |
| Univer SDK | Office content model, rendering, plugins, and Facade API | Application flow, domain model, agent dispatch, and deployment |
| Univer CLI | Univerfile/Unit/worktree commands; content import, read, change, verification, screenshot, export, and Viewer handoff | Long-running orchestration, product APIs, user interfaces, and domain rules |
| Runtime Skill | Agent operating knowledge matched to the installed CLI | Agent runtime, CLI executable, and user-domain knowledge |
| daemon/Gateway | CLI-owned HTTP content service, Univerfile/Unit/worktree data, lifecycle events, and Viewer assets | General business backend, host task state, external channels, and product pages |
| Cowork core/react | Headless container, Unit, worktree, review, selection, and action state, plus React bindings | Page layout, navigation, copy, visual components, and loading/error experiences |
| Cowork Viewer | Render a structured Viewer request as Univer content and manage the Viewer lifecycle | Host shell, business controls, agent, and daemon lifecycle |

## What CLI provides

CLI is the central execution surface for this Skill. Subject to the installed help and Runtime
Skills, it can:

- create or import a Univerfile and list or address its Units;
- run Facade content operations in a worktree and create commits;
- read structured content and state and generate screenshots or Viewer handoffs;
- export Office formats supported by the installed version;
- perform the same classes of supported operations against a local `.univer` target or a
  Univerfile Link declared by the command;
- start the daemon and expose the same data capabilities through Gateway.

CLI does not choose the user's task, page, channel, approval flow, schedule, or domain data model.
The host connects these concerns through CLI argv/JSON, public IDs, and artifacts.

## What Runtime Skills provide

Runtime Skills teach an agent how to operate the current CLI, select Unit Skills, find Facade APIs,
read results back, and perform acceptance. They do not execute commands or contain the user's
domain workflow. A builder's agent integration composes:

```text
user-domain Skill + CLI Runtime Skill + univer executable
```

## What Gateway provides

Gateway is the daemon's service surface. It lets another CLI process or browser access Univerfile,
Unit, worktree, review, and Viewer data. It is bundled with CLI and does not replace the user's
application backend.

For browser use across origins, verify that actual Gateway HTTP, preflight, and lifecycle channels
are reachable from the host page. The daemon-owned Gateway supports configurable CORS; the host
owns deployment configuration and the browser-reachable address. The browser Gateway origin must
reach the same daemon that owns the target Univerfile, either through a public address or a
same-origin host proxy. `127.0.0.1` inside a container addresses only that container and is not a
remote-browser address.

## Browser UI ownership

The host owns the application shell, domain controls, navigation, and visual design. Cowork owns
the Univer content Viewer inside the host page and the composition of Unit/worktree/review state
with related actions. Select Cowork whenever the goal includes presenting or operating those
capabilities inside a host page.

The Viewer URL returned by `univer open` is an external-open handoff. Putting that URL in an iframe
is not a Cowork integration and does not satisfy embedded UI acceptance. If the public Cowork
container/data-source contract cannot connect the target, report the embedded UI as incomplete and
name the missing contract. Deliver independently requested Links, screenshots, exports, or external
Viewer handoffs through their own contracts.

## What Cowork provides

Use the installed exports and declarations as the authority for Cowork's public UI surface. The
stable package provides:

- `CoworkControllerProvider` and snapshot/selector hooks;
- Unit, active/reviewable worktree, review summary, and selection state;
- content-surface badges, edit gate, actions, and Viewer request;
- merge/discard and other action bindings;
- framework-neutral Viewer and React `CoworkContentViewer`;
- Viewer style entrypoint.

Cowork is not a general-purpose component library. It does not supply a ready-made application
shell, file tree, chat, task list, router, navigation, or design system. Outside the Viewer, hosts
normally render Cowork's headless state and actions with their own components.

The currently public `CoworkUnitKind` is `sheet | doc | slide | base`. Do not assume that a Unit
kind absent from the installed union can be rendered by Cowork Viewer. Reinspect this union and the
Viewer error types after every upgrade.

## Univerfile Link and Cowork

CLI accepts Univerfile Links for commands whose help declares Link support. The Cowork Gateway
adapter accepts an `origin` and `CoworkContainer`; its name does not imply that it accepts a raw
Link string.

Use the installed `.d.ts` files to select the conversion. If the public container remains
`local-univerfile`, obtain the Gateway origin and service-side Univerfile locator from a structured
CLI service/open handoff, then construct the controller container. When a future version declares a
native Link container, migrate to that public type. A custom container requires a host-provided
`CoworkDataSource` implementation.

## Determine whether a capability exists

Gather evidence in this order:

1. Does `univer help <command>` declare the command and target?
2. Does `univer skills get <unit-kind>` describe the content workflow and constraints?
3. Does `univer api find/show` expose the required Facade API?
4. Do Cowork `package.json#exports` and `.d.ts` files expose the required entrypoint and type?
5. Does the real CLI, Gateway, or Viewer smoke pass?

If any layer lacks the public capability, report it as unavailable in the installed version or as
requiring a host implementation through a public extension point. Do not fill the gap with private
modules or inference. An iframe around a `univer open` handoff is not an embedded UI substitute.
