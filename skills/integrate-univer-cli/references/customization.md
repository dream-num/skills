# Host customization surfaces

Customize only at public component boundaries. Reuse the user's existing language, framework,
state management, and release model before implementing the selected surfaces below.

## Content operations

Write domain content rules as version-controlled Facade scripts and invoke them through
`univer execute --script`. Let the script accept host-prepared parameters and operate an explicitly
selected target Unit. Use the corresponding Unit Skill and `api find/show` to select APIs.

The host owns input data and domain rules. CLI owns Univerfile writes, commits, and readback.

## Agent behavior

Describe the user domain, task boundary, input sources, and delivery requirements in the host's
agent Skill. Have the agent load CLI Runtime Skills before performing Univer operations. Persist the
association between the host agent task and target, unitId, and worktreeId.

## CLI adapter

Implement one CLI adapter in the existing service layer with these fixed responsibilities:

- construct argv;
- pass the runtime environment;
- parse structured output;
- map errors and task state;
- return public IDs and artifacts.

Route domain use cases through this adapter and represent CLI arguments as argv elements.

## Gateway lifecycle

Record daemon runtime, owner, and readiness in the host's existing process or deployment manager.
Use the same executable and `UNIVER_HOME` for start, status, and stop. Let other components read the
Gateway endpoint from structured status.

## Cowork state and UI

Build the host experience from public Cowork data:

- drive navigation, counts, and status from snapshots and selectors;
- connect selection to host routes or current-content state;
- obtain badges, edit gate, actions, and Viewer requests from the content surface;
- connect action handlers to host tasks and confirmation flows;
- place Viewer in the host-selected content area;
- load Viewer styles from the frontend entrypoint.

Keep page layout, copy, domain components, task progress, and the visual system in existing host
code.

## Persistence

Map the applicable fields into existing user entities:

- Univerfile target;
- unitId;
- worktreeId;
- CLI state and commit sequence;
- host task, user input, and artifact references;
- external Viewer handoff URL, or Cowork view state for embedded host UI.

Use the host's established field vocabulary while preserving the raw identifiers returned by CLI
and SDK.

## Resource release

- Close streams and timeouts when a CLI subprocess exits.
- Stop an owned daemon with its owner lifecycle.
- Update subscriptions when the Cowork container changes.
- Dispose the controller, Viewer, and page subscriptions when the host UI unmounts.
