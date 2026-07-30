# Component contracts

## Contents

- Univer CLI
- Runtime Skills
- Univerfile target
- Daemon and Gateway
- Cowork SDK
- Builder host
- Compatible version set

## Univer CLI

**Capability**: Create, import, operate, inspect, screenshot, export, and open Univerfiles; manage
Units and worktrees; start the daemon.

**Installation and entrypoint**: Run `npm install -g univer-cli`, then invoke the `univer`
executable. Application code passes an argv array and uses `--json` for machine-consumed commands.

**Inputs**: target, unitId, worktreeId, command arguments, and Facade scripts.

**Outputs**: exit code, stdout, stderr, structured JSON, worktree state, external Viewer handoff
URLs, and exported artifacts.

**Discovery**:

```bash
univer --version
univer doctor --json
univer --help
univer help <command>
```

## Runtime Skills

**Capability**: Version-matched agent guidance for CLI concepts, commands, Facade APIs, model
readback, and visual acceptance.

**Entry points**:

```bash
univer skills get core --full
univer skills get <sheet|doc|slide|base|board|embed>
```

**Composition**: Load `core` first, then the target Unit Skill. For cross-Unit work, also load the
host Unit Skill, child Unit Skill, and `embed` Skill.

## Univerfile target

**Capability**: Provide a stable address for all content operations.

**Local form**: `.univer` filesystem path.

**Remote form**: Univerfile Link.

**Child addresses**: Address a Unit by `unitId` and an isolated change by `worktreeId`. Persist the
values actually returned by CLI.

## Daemon and Gateway

**Capability**: Give CLI processes, other processes, and browsers a shared service for accessing
Univerfiles.

**Entry points**:

```bash
univer daemon status --json
univer daemon start
univer daemon stop
```

**Runtime identity**: The CLI executable, `UNIVER_HOME`, listening configuration, and daemon owner
together identify one runtime. Run all daemon commands in that same runtime and read service state
from structured status output.

**Outputs**: Gateway endpoint, remote Univerfile Link, HTTP data, and lifecycle event streams.

## Cowork SDK

**Capability**: Connect Gateway containers, Units, worktrees, reviews, and content Viewer to a
browser host.

**Installation**: Install `@univerjs-pro/cowork` with the host package manager, then install the
exact Univer SDK peer cohort declared by that version.

**Public entry points**:

- `@univerjs-pro/cowork`: controller, snapshot, selection, content surface, and types;
- `@univerjs-pro/cowork/gateway`: Gateway data source;
- `@univerjs-pro/cowork/react`: Provider, hooks, selectors, and action binding;
- `@univerjs-pro/cowork/viewer`: Viewer runtime;
- `@univerjs-pro/cowork/viewer/react`: React Viewer;
- `@univerjs-pro/cowork/viewer/styles.css`: styles.

**Inputs**: Gateway origin, a container declared by the installed version, Unit/scope selection, and
Viewer request.

**Outputs**: snapshot, Unit/worktree lists, review summary, actions, content surface, and Viewer
state.

**Lifecycle**: Update the controller when the container changes. Dispose the controller, Viewer,
and subscriptions when the UI unmounts.

## Builder host

**Capability**: Connect the user's goal, domain task, and product experience to Univer components.

**Owns**: Existing routes, task state, agent dispatch, page structure, domain data, artifact
management, and user delivery.

**Connection points**: CLI argv/JSON, target, unitId, worktreeId, Gateway endpoint, Cowork
controller/actions, and Viewer requests.

## Compatible version set

Pin every selected component used in one delivery:

- Univer CLI executable;
- Runtime Skills bundled with that CLI;
- Gateway protocol;
- Cowork package;
- exact Univer SDK peer cohort declared by Cowork;
- target OS/architecture and runtime.

Record these values in the host lockfile, build configuration, and release manifest. Repeat the
end-to-end acceptance after any upgrade.
