# Sources and compatibility baseline

Read this file when a task depends on current APIs, versions, canonical examples, or disputed
architecture. The pinned commits make this skill reviewable; they are not a promise that packages
from different cohorts are interchangeable.

## Baseline reviewed for this skill

| Domain | Authority | Reviewed revision |
| --- | --- | --- |
| Univer/Core/Pro concepts and public integration knowledge | `dream-num/documentation` and `dream-num/univer-sdk-skills` | `e158331a486d8d62122558faebfce6c04ae3e8b2` and `60e9cbbdbbde9594ad61bad58ad9fbb4d5e17112` |
| Self-hosted collaboration contract | [Collaboration SDK integration guide](https://github.com/dream-num/univer-collaboration-sdk/blob/main/.sdk-integration-guide/index.md) | `d29c45e467802a1d2bb79192503cac79f3031891` |
| Headless and Agent SDK contract | [CLI SDK integration guide](https://github.com/dream-num/univer-cli-sdk/blob/main/.sdk-integration-guide/index.md) | `c81e1548d8809db481ed72da41115837c8a8e23b` |
| Cross-layer composition | `dream-num/univer-collaboration-examples` | `730532656dff612058e86b4689382242527a62a0` |

The canonical `univer-workspace` and `univer-workspace-cli` applications at the reviewed example
revision use the exact `1.0.0-insiders.20260813-30ff2fe` cohort. The CLI SDK repository itself uses
an earlier development cohort at the reviewed revision. Use the canonical applications to verify
their integrated dependency set; use the CLI SDK guide to understand package contracts. Do not mix
their package versions.

`univer-sdk-skills` remains an authoritative knowledge source even when its currently published
examples lag the canonical cohort. Expect it to be updated. Until then, verify its API-shaped
guidance against the exact target cohort instead of silently translating old calls.

## Source routing

- Open the [Collaboration SDK integration guide](https://github.com/dream-num/univer-collaboration-sdk/blob/main/.sdk-integration-guide/index.md)
  directly, then follow its index to the relevant concept or package README. Do not clone the SDK
  repository merely to read its documentation.
- Open the [CLI SDK integration guide](https://github.com/dream-num/univer-cli-sdk/blob/main/.sdk-integration-guide/index.md)
  directly, then follow its index to the relevant concept or package README. Do not clone the SDK
  repository merely to read its documentation.
- Use Univer documentation for plugins, presets, Facade, commands, mutations, snapshots, rendering,
  and Unit-specific product features.
- Use `univer-sdk-skills` for established Univer/Core/Pro integration and extension workflows.
- Use the Collaboration SDK guide for Transport, Endpoint, Service, Database Adapter, middleware,
  snapshot, revision, History, Comment, and Worktree contracts.
- Use the CLI SDK guide for headless factory, manual collaboration runtime, execution, inspection,
  worker pool, daemon, Office exchange, rendering, screenshots, and layout lint.
- Use `univer-workspace` for browser, product API, identity, ACL, hierarchy, dual-store ownership,
  and collaboration gateway composition.
- Use `univer-workspace-cli` for target resolution, authenticated headless access, Worktree authoring,
  review handoff, and Agent command composition.

## Updating the baseline

Update deliberately:

1. Record the new revisions and exact package cohort.
2. Re-read changed source documents in their domain.
3. Run canonical application validation before calling a recipe verified.
4. Re-run clean-context skill evaluations.
5. Review English and Chinese developer documentation together.

Never fetch a newer baseline silently during skill execution.
