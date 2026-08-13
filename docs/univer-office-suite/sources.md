# Sources and Reviewed Baseline

This page is shared by the English and Chinese developer guides. It records evidence, not a global
claim that every listed repository revision can be installed as one package cohort.

## Domain authorities

| Domain | Authoritative source | Reviewed revision |
| --- | --- | --- |
| Univer/Core/Pro concepts, plugins, Facade, commands, Unit features | [`dream-num/documentation`](https://github.com/dream-num/documentation/tree/e158331a486d8d62122558faebfce6c04ae3e8b2/content/guides) | `e158331a486d8d62122558faebfce6c04ae3e8b2` |
| Univer/Core/Pro integration knowledge for Agents | [`dream-num/univer-sdk-skills`](https://github.com/dream-num/univer-sdk-skills/tree/60e9cbbdbbde9594ad61bad58ad9fbb4d5e17112) | `60e9cbbdbbde9594ad61bad58ad9fbb4d5e17112` |
| Self-hosted collaboration contract | `dream-num/univer-collaboration-sdk/.sdk-integration-guide` | `d29c45e467802a1d2bb79192503cac79f3031891` |
| Headless and Agent SDK contract | `dream-num/univer-cli-sdk/.sdk-integration-guide` | `c81e1548d8809db481ed72da41115837c8a8e23b` |
| Browser/product/backend composition | `dream-num/univer-collaboration-examples/univer-workspace` | `730532656dff612058e86b4689382242527a62a0` |
| Agent/headless/Worktree composition | `dream-num/univer-collaboration-examples/univer-workspace-cli` | `730532656dff612058e86b4689382242527a62a0` |

The Collaboration SDK, CLI SDK, and examples are private at this baseline. This branch is intended
for internal developers and must not be merged publicly until publication boundaries are reviewed
after those materials become public.

## Verified integrated cohort

The two canonical example applications use the exact
`1.0.0-insiders.20260813-30ff2fe` cohort for their version-coupled `@univerjs/*`,
`@univerjs-pro/*`, and `@univer-cli/*` dependencies.

The reviewed CLI SDK repository uses an earlier development cohort. That does not make its package
README contracts invalid, but it means developers must not copy dependency versions independently
from that repository into the canonical example. Select one coherent application cohort.

`univer-sdk-skills` remains an authoritative knowledge source and is expected to receive a current
update. Until it does, verify API-shaped examples against the target declarations and canonical
cohort. Do not discard its architectural guidance, and do not silently translate an older call.

## Reading order

1. For a cross-layer task, read this guide's architecture and SDK boundaries first.
2. Open the generated integration guide index for the SDK that owns the detail.
3. Load only the relevant user-guide concept or package README.
4. Compare the canonical Workspace composition when multiple SDKs meet.
5. Verify exact package declarations before implementing an API call.

## Refresh procedure

When any authority changes:

1. Record the new revision and exact application release cohort.
2. Review changed documents in their owning domain.
3. Run the canonical application checks for every recipe that remains labelled verified.
4. Re-run the three clean-context `build-univer-app` evaluations.
5. Review English and Chinese developer pages together.

The skill must not fetch and adopt a new baseline silently during normal use.
