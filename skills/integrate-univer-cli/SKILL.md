---
name: integrate-univer-cli
description: "Use when a builder needs to understand or integrate Univer, Univerfile, Unit, Univer CLI, Runtime Skills, daemon/Gateway, Univerfile Links, or the Cowork SDK into an existing system, including component selection, acquisition and version pinning, backend or agent connections, embedded UI, customization, delivery, and end-to-end acceptance."
---

# Integrate Univer CLI Components

Use this Skill as the builder entry to the Univer CLI ecosystem. Select components from the user's
stated goal and existing system, then deliver their acquisition, code, configuration, lifecycle,
and acceptance. Explain the available components and their boundaries before implementing the
integration. Let the user and host system determine the application shape, domain workflow, and
product experience.

## Working principles

- Derive facts from the request, repository, runtime environment, and existing architecture.
- Select components by required capability: content operations, agent operations, service access,
  and embedded UI.
- Integrate Univer content, Unit/worktree/review state, and related actions inside a host page
  through Cowork. Keep the page shell, domain controls, and visual design in the host.
- Treat the Viewer URL returned by `univer open` as an external-open handoff. Use Cowork Viewer for
  embedded content instead of wrapping that URL in an iframe.
- When the installed Cowork public contract cannot connect the target container, report the
  embedded UI as incomplete and identify the missing adapter or type. Continue independently
  requested CLI, Link, screenshot, or export delivery.
- Treat reference applications as connection evidence, not as the user's product specification.
  Do not generate a catalog of assumed application types.
- Complete the integration through one public connection path after selecting the components.
- Treat the installed CLI help, Runtime Skills, package exports, and TypeScript declarations as the
  API authority.
- Implement domain workflows, pages, task state, and visual design in the user's host system.
- Run real inputs, real data, and real deliverables through the user's own primary flow.

When the user only says "build my own application with Univer" or asks what is possible, first
explain what Univer is, what CLI/Gateway/Cowork provide, what remains owned by the host, and where
to obtain each component. Then ask one direct question whose answer changes component selection.
Do not respond with only a clarification question.

For an existing repository, inspect its language, framework, dependencies, and deployment model
first. For an empty workspace, confirm the host stack and required connections before creating a
minimal host. Do not invent an application shape for the user.

If the user has specified the stack, connections, and delivery target but has not mounted the
repository, provide an implementation-ready specification rather than claiming a completed
integration or stopping at component selection. Include exact acquisition commands, the native
adapter shape for that stack, component lifecycles, public ID flow, and end-to-end acceptance.
Request only the repository or input still required to write the code.

Guide discovery around five minimum facts: content and operations, target boundary, whether an
agent initiates operations, whether UI is embedded, and the final deliverable and runtime. Ask for
one missing fact at a time when it changes component selection. Let explicit user goals trigger
security, compliance, and scale constraints.

## Integration workflow

### 1. Establish the shared concepts

Read [concepts.md](references/concepts.md). For a first-time Univer user, explain Univer,
Univerfile, Unit, target, and worktree before introducing the CLI, Gateway, or Cowork used here.

### 2. Identify the required capabilities

Determine from the user's goal:

- which Univer content must be created, imported, read, changed, verified, or exported;
- whether the data target is a local `.univer` path or a Univerfile Link provided by Gateway;
- whether an agent in the existing system initiates content operations;
- whether the existing system needs service access to Univerfiles through Gateway;
- whether the existing UI embeds Unit, worktree, or review content;
- the requested result and runtime environment.

Read [components.md](references/components.md) and
[capability-boundaries.md](references/capability-boundaries.md), explain each capability and owner,
then select the required components. Distinguish:

- capabilities supplied directly by the selected components;
- connections and product behavior owned by the user's host;
- capabilities absent from the installed public contract.

When the host page must present or operate Univer content or Unit/worktree/review state, select
Cowork and read [cowork-ui.md](references/cowork-ui.md) and
[cowork-browser.md](references/cowork-browser.md). Confirm its current visual components, headless
state, framework bindings, browser topology, and build contract. If the user only needs an external
Viewer handoff, use CLI `open`.

### 3. Acquire and pin the components

Read [acquisition.md](references/acquisition.md). Acquire only the selected components and pin
exact versions in the user's lockfile or compatibility manifest.

- `univer-cli` comes from npm; Gateway and Runtime Skills ship with it.
- `@univerjs-pro/cowork` comes from npm and requires the exact Univer SDK peer cohort it declares.
- Install the agent-facing discovery Skill from `dream-num/skills`; load command and Facade
  guidance from the installed CLI with `univer skills get`.
- A product distribution may install dependencies or preinstall the pinned CLI, Skill, and
  compatibility manifest in an application or image.

### 4. Inspect the installed contract

```bash
command -v univer
univer --version
univer doctor --json
univer skills get core --full
```

Load the target Unit Skill and read help for each command used here:

```bash
univer skills get <sheet|doc|slide|base|board>
univer help <command>
```

For Cowork, inspect the installed package's `package.json#exports`, `.d.ts` files, and peer
dependencies. Record the actual CLI, Runtime Skill, Cowork, and Univer SDK cohort versions.

### 5. Connect the components

Read [composition.md](references/composition.md) and establish only the selected connections:

```text
host process -> Univer CLI -> Univerfile target
agent -> Runtime Skill -> Univer CLI
Univer CLI -> Univerfile Link -> Gateway
host UI -> Cowork -> Gateway -> Univerfile target
user/external browser -> univer open handoff -> Gateway Viewer
```

Map the CLI-returned `target`, `unitId`, `worktreeId`, status, and deliverables into the existing
data model. Pass context between components through public identifiers.

When the host language or frontend framework is known, translate the generic connection contract
into native process, state, and component lifecycle code for that stack. For a non-React frontend,
use Cowork core, the Gateway adapter, and the imperative Viewer; do not introduce React solely for
Cowork.

### 6. Implement host customization

Read [customization.md](references/customization.md). Implement the applicable parts in the user's
repository:

- domain-oriented Facade scripts or agent Skills;
- CLI invocation and structured-result adapters;
- daemon/Gateway lifecycle ownership;
- Cowork controller, state selection, actions, Viewer, and host UI composition;
- the user's existing task, route, persistence, and delivery flows.

Read [reference-implementations.md](references/reference-implementations.md) when a concrete
integration shape is useful. Reuse only the structure relevant to the selected connection; do not
copy a reference application's domain design.

### 7. Deliver and accept

Read [delivery.md](references/delivery.md). Commit the code, dependencies, configuration, and
version locks required by the user's system, then run the real entry flow:

```text
user input -> host -> Univer components -> content result -> requested deliverable
```

Read the stored model to verify content correctness. For appearance-sensitive work, also verify the
real Viewer or a screenshot. Release process and UI component resources.

## Completion criteria

- The user's system contains real integration code and configuration for every selected component.
- Every component connection has a definite input, output, and owner.
- CLI and Cowork use commands, exports, and declarations from the installed versions.
- CLI, Runtime Skills, Cowork, and the Univer SDK peer cohort come from explicit sources and ship at
  exact versions.
- The target, unitId, worktreeId, and deliverables used here can be persisted and restored in the
  user's flow.
- Embedded Univer UI uses Cowork's public controller path for state and actions. Embedded content
  also uses the content surface and Cowork Viewer; an external Viewer handoff is not substituted.
- Cowork browser integration verifies Viewer assets, same-origin HTTP and WebSocket proxying, real
  content rendering, and resource release. Browser code never receives a daemon loopback address
  that only exists inside a container or remote machine.
- A real end-to-end task passes with the applicable data readback, UI evidence, or export artifact.
- The final report names the components used, the host behavior customized, and the reproduction
  steps.
