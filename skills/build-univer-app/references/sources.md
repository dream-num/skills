# Sources and compatibility

Use the source that owns the layer:

| Domain | Authority |
| --- | --- |
| Univer/Core/Pro APIs and concepts | `dream-num/documentation` |
| Univer integration workflows | `univer-integrate`, `univer-pro-integrate`, `univer-node-backend`, `univer-plugin-dev` |
| Self-hosted collaboration | `univer-collaboration-integration` |
| Headless and Agent SDK packages | `univer-cli-sdk-integration` |
| Cross-layer composition | `dream-num/univer-collaboration-examples` |

The two SDK integration Skills are generated upstream and migrated into this repository as complete
artifacts. Read their task route first, then only its linked references. Do not edit them here.

The canonical `univer-workspace` and `univer-workspace-cli` applications reviewed for this Skill use
the exact `1.0.0-insiders.20260813-30ff2fe` cohort at revision
`730532656dff612058e86b4689382242527a62a0`. Use them to verify an integrated dependency set; do not
mix package versions copied independently from SDK repositories.

When updating this baseline, replace migrated SDK Skills through their upstream scripts, record the
new canonical example revision and exact cohort, validate the integrated applications, and rerun
clean-context Skill evaluations. Never adopt a newer baseline silently during execution.
