# Sources and Compatibility

This page is shared by the English and Chinese guides.

| Domain | Authority |
| --- | --- |
| Univer/Core/Pro APIs and concepts | `dream-num/documentation` |
| Univer integration workflows | `dream-num/univer-sdk-skills` |
| Self-hosted collaboration | [`univer-collaboration-integration`](../../skills/univer-collaboration-integration/SKILL.md) |
| Headless and Agent SDK packages | [`univer-cli-sdk-integration`](../../skills/univer-cli-sdk-integration/SKILL.md) |
| Cross-layer composition | `dream-num/univer-collaboration-examples` |

The SDK integration Skills are generated from their upstream SDK documentation and migrated here
as complete artifacts. Do not edit them in this repository.

The canonical `univer-workspace` and `univer-workspace-cli` applications reviewed here use the exact
`1.0.0-insiders.20260813-30ff2fe` cohort at revision
`730532656dff612058e86b4689382242527a62a0`. Use them to verify integrated dependency versions.

When refreshing the baseline, replace the generated Skills through their upstream migration scripts,
record the new canonical revision and cohort, run integrated application checks, and review the
English and Chinese pages together. Never adopt a newer baseline silently during Skill execution.
