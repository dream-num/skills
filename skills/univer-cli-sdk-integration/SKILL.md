---
name: univer-cli-sdk-integration
description: Build a new Node.js CLI application or extend an existing application with the Univer CLI SDK. Use when an agent needs to select target-neutral capability and Commander preset packages, assemble headless Univer runtimes, execute or inspect Unit content, import or export Office files, render or screenshot Units, compile SVG or Typst content, add configuration or resource lookup, manage daemon or worker lifecycles, diagnose SDK integration failures, or verify the resulting application. Do not use for operating the finished univer CLI or modifying the Univer CLI SDK repository itself.
---

<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Univer CLI SDK Integration

## Workflow

1. Inspect the target project's Node version, package manager, Commander composition root, target
   adapter, runtime ownership, output conventions, and checks. Establish these choices first when
   starting from scratch.
2. Check that installed Univer CLI, Univer, Univer Pro, and Collaboration packages use an aligned
   release cohort. Report a mismatch before selecting APIs; do not guess compatibility.
3. Select the task below and read every linked reference in that row. Do not load all references.
4. Prefer a target-neutral capability package. Add its optional `-command` preset only when the
   application wants the default Commander interaction.
5. Verify public APIs against the installed package root exports before use.
6. Implement in the authorized host application. Keep target identity, storage, authentication,
   paths, and business workflow in its composition root or adapters.
7. Run the host project's typecheck, build, and relevant tests, then exercise the smallest real CLI
   smoke path.

## Reading routes

- **First CLI application:** [guide-overview](references/guide-overview.md), [package-api-reference](references/package-api-reference.md),
  [package-api-reference-command](references/package-api-reference-command.md).
- **Headless content execution:** [package-headless-univer](references/package-headless-univer.md),
  [package-content-execution](references/package-content-execution.md), and [package-api-reference](references/package-api-reference.md) when Facade discovery
  is needed.
- **Content inspection:** [package-content-inspection](references/package-content-inspection.md); add
  [package-content-inspection-command](references/package-content-inspection-command.md) for the default Commander command.
- **Collaboration runtime:** [package-univer-collaboration-runtime](references/package-univer-collaboration-runtime.md); add
  [package-univer-collaboration-runtime-pool](references/package-univer-collaboration-runtime-pool.md) for worker isolation and reuse, then consult
  the Univer Collaboration SDK for authoritative storage and Worktree contracts.
- **Office import/export:** [package-unit-exchange](references/package-unit-exchange.md).
- **Rendering, screenshots, and layout checks:** [package-univer-render-runtime](references/package-univer-render-runtime.md),
  [package-unit-screenshot](references/package-unit-screenshot.md), [package-unit-screenshot-command](references/package-unit-screenshot-command.md),
  [package-unit-layout-lint](references/package-unit-layout-lint.md), [package-unit-layout-lint-command](references/package-unit-layout-lint-command.md).
- **SVG or Typst compilation:** [package-svg-facade](references/package-svg-facade.md),
  [package-svg-facade-command](references/package-svg-facade-command.md), [package-doc-typst-facade](references/package-doc-typst-facade.md),
  [package-doc-typst-facade-command](references/package-doc-typst-facade-command.md).
- **Configuration or visual resources:** [package-config](references/package-config.md),
  [package-config-command](references/package-config-command.md), [package-resource-library](references/package-resource-library.md),
  [package-resource-library-command](references/package-resource-library-command.md).
- **Daemon and process lifecycle:** [package-daemon](references/package-daemon.md),
  [package-daemon-command](references/package-daemon-command.md), [package-generic-keyed-instance-pool](references/package-generic-keyed-instance-pool.md).
- **Diagnosis:** start with [guide-overview](references/guide-overview.md), then read the reference for the first failing
  capability or command package.

## Boundaries

- Keep capability packages independent of Commander and product targets.
- Keep `-command` packages thin; application code owns the root command and dependency assembly.
- Keep local files, Workspace resources, identity, ACL, remote APIs, and business workflows in the
  host application.
- Add only packages required by the requested path. Do not assemble every SDK capability by
  default.
- Prefer target-version package root exports, then source documents and generated references.
  Report drift instead of inventing an API.

## Verification

Run the host application's existing checks and one real command through its built entrypoint. Verify
structured output at the capability boundary and, when a Commander preset is used, argument parsing,
help, presentation, and failure exit behavior. For runtime work, verify acquire/use/release and
shutdown. State any unexecuted browser, worker, daemon, or external-service path explicitly.

## Package references

- [package-api-reference](references/package-api-reference.md)
- [package-api-reference-command](references/package-api-reference-command.md)
- [package-config](references/package-config.md)
- [package-config-command](references/package-config-command.md)
- [package-content-execution](references/package-content-execution.md)
- [package-content-inspection](references/package-content-inspection.md)
- [package-content-inspection-command](references/package-content-inspection-command.md)
- [package-daemon](references/package-daemon.md)
- [package-daemon-command](references/package-daemon-command.md)
- [package-doc-typst-facade](references/package-doc-typst-facade.md)
- [package-doc-typst-facade-command](references/package-doc-typst-facade-command.md)
- [package-generic-keyed-instance-pool](references/package-generic-keyed-instance-pool.md)
- [package-headless-univer](references/package-headless-univer.md)
- [package-resource-library](references/package-resource-library.md)
- [package-resource-library-command](references/package-resource-library-command.md)
- [package-svg-facade](references/package-svg-facade.md)
- [package-svg-facade-command](references/package-svg-facade-command.md)
- [package-svg-facade-examples](references/package-svg-facade-examples.md)
- [package-unit-exchange](references/package-unit-exchange.md)
- [package-unit-layout-lint](references/package-unit-layout-lint.md)
- [package-unit-layout-lint-command](references/package-unit-layout-lint-command.md)
- [package-unit-screenshot](references/package-unit-screenshot.md)
- [package-unit-screenshot-command](references/package-unit-screenshot-command.md)
- [package-univer-collaboration-runtime](references/package-univer-collaboration-runtime.md)
- [package-univer-collaboration-runtime-pool](references/package-univer-collaboration-runtime-pool.md)
- [package-univer-render-runtime](references/package-univer-render-runtime.md)
