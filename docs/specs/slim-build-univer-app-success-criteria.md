# Slim `build-univer-app`: success criteria

## User-visible outcomes

- [x] `build-univer-app` explains the application architecture and routes SDK-specific work to the
      owning Skill.
- [x] The repository exposes both SDK integration Skills alongside the existing application Skills.
- [x] Repeated Workspace and Agent/CLI implementation guides are removed.

## Preservation constraints

- [x] Cross-layer ownership, identity, persistence, compatibility, and source-authority rules remain.
- [x] `skills/build-univer-app/references/architecture.md` remains unchanged.
- [x] `docs/univer-office-suite/architecture.md` and its Chinese translation remain unchanged.
- [x] English and Chinese entry documentation stay aligned.
- [x] `skills/univer-cli-sdk-integration/` and `skills/univer-collaboration-integration/` remain
      unchanged generated artifacts.

## Deliverables

- [x] Slimmed `build-univer-app` Skill and references.
- [x] Updated repository documentation, contributor constraint, and validation coverage.

## Validation signals

- [x] Repository validation and the standard `build-univer-app` Skill validator pass.
- [x] No live link or instruction refers to `.sdk-integration-guide`.

## Non-goals

- [x] Do not change SDK integration Skill content or their upstream migration process.
- [x] Do not change the operational behavior of `univer-cli` or `univer-workspace-cli`.

## Ambiguities

- [x] None.
