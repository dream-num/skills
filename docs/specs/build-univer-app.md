# Build Univer App Skill

## Problem Statement

Developers and agents currently have strong but separate sources for Univer/Core/Pro, the self-hosted Collaboration SDK, the CLI SDK, and the canonical Workspace applications. None of those sources alone explains how the layers compose into one production-quality Office Suite application.

This fragmentation makes it difficult to choose the correct SDK, preserve ownership boundaries, keep version-coupled packages aligned, and validate both human and Agent editing workflows. Developers also need to understand the architecture themselves so that they can direct agents effectively and judge the resulting application.

## Solution

Add a public, rich skill named `build-univer-app` to the DreamNum skills repository. The skill supports ask, reference, design, build, and fix workflows across the full Univer application stack. It combines authoritative knowledge from Univer documentation and `univer-sdk-skills` with current contracts from the Collaboration SDK and CLI SDK, using `univer-workspace` and `univer-workspace-cli` as the canonical end-to-end reference applications.

The skill is accompanied by developer documentation in authoritative English and complete Chinese translations. Both audiences share the same architecture, terminology, source baseline, and validation expectations.

The first implementation remains on a local branch for internal use. It may be committed locally for review, but it must not be pushed or merged into the public default branch until the closed-source material it depends on is ready for public use.

## Success Criteria

- Developers can explain the responsibilities and ownership boundaries of Univer/Core/Pro, the Collaboration SDK, the CLI SDK, and the product application.
- Agents can answer architecture questions, design integrations, implement requested changes, and verify results without mixing SDK responsibilities.
- Human browser editing and Agent/CLI editing are presented as two clients of the same authoritative collaboration data.
- The supported Workspace and Worktree flows are grounded in the canonical reference applications.
- Every runnable recipe identifies an exact compatible SDK release cohort or is explicitly marked conceptual.
- The skill handles Sheet, Doc, Slide, Board, and Base without generalizing Unit-specific APIs.
- English and Chinese developer documentation cover the same architecture and workflows.
- The repository validator, standard skill validator, documentation checks, and clean-context behavioral evaluation all pass.
- Existing discovery skills and their validation behavior remain unchanged.

## User Stories

1. As a developer, I want one entry point for the Univer application stack, so that I do not have to infer cross-SDK architecture from separate repositories.
2. As a developer, I want to understand the difference between the content engine, collaboration backend, Agent runtime, and product layer, so that I assign responsibilities correctly.
3. As a developer, I want an authoritative architecture narrative, so that I can guide an agent with informed constraints rather than accepting opaque generated code.
4. As a Chinese-speaking developer, I want complete Chinese documentation, so that I can understand the same architecture available in the authoritative English documentation.
5. As an English-speaking developer, I want concise canonical documentation, so that architectural facts have one primary wording.
6. As an agent, I want architecture questions to trigger the skill, so that I can answer them from current domain knowledge.
7. As an agent, I want reference questions to load only relevant material, so that unrelated SDK documentation does not consume context.
8. As an agent, I want design requests to begin with repository and application investigation, so that recommendations fit the existing composition root.
9. As an agent, I want build and fix requests to authorize scoped implementation and validation, so that I can complete the requested work instead of only describing it.
10. As an agent, I want read-only questions to remain read-only, so that asking for an explanation never changes a project.
11. As a Workspace developer, I want to understand how browser clients, product APIs, Collaboration Endpoint, Collaboration Service, and persistence compose, so that I can build a correct self-hosted application.
12. As a Workspace developer, I want product metadata and collaboration state to have explicit owners, so that I do not create accidental cross-database coupling.
13. As a security engineer, I want identity, authentication, ACL, Session, `userID`, `memberID`, and idempotency identities distinguished, so that untrusted client data never becomes authoritative identity.
14. As a backend developer, I want Unit, Resource, Node, and Worktree identifiers distinguished, so that routing and authorization use the correct domain identity.
15. As a backend developer, I want cross-store operations described as durable, recoverable workflows, so that I do not pretend product and collaboration stores share one transaction.
16. As a collaboration developer, I want the supported backend route stated unambiguously, so that new applications use the Collaboration SDK.
17. As a collaboration developer, I want the legacy Univer Server route identified as deprecated and unsupported, so that it is not selected for new applications.
18. As an Agent platform developer, I want to connect the CLI collaboration runtime to the same authoritative Unit used by browser clients, so that human and Agent changes converge correctly.
19. As an Agent platform developer, I want explicit pull, execute, commit, retry, and conflict semantics, so that automation does not compete with an automatic browser synchronization state machine.
20. As a reviewer, I want Agent changes isolated through Worktree where appropriate, so that changes can be inspected, rendered, approved, merged, or discarded safely.
21. As an Office automation developer, I want guidance for import, inspection, mutation, rendering, screenshot verification, and export, so that document transformations are validated end to end.
22. As a developer, I want exact release-cohort rules, so that version-coupled `@univerjs/*`, `@univerjs-pro/*`, Collaboration SDK, and CLI SDK packages are not mixed accidentally.
23. As a developer, I want each verified recipe tied to a source baseline, so that I can tell current evidence from conceptual guidance.
24. As a developer, I want Sheet, Doc, Slide, Board, and Base recognized as supported Unit types, so that the architecture does not imply a Sheet-only product.
25. As a developer, I want Unit-specific limitations called out, so that a recipe verified for one Unit type is not falsely generalized to the others.
26. As a maintainer, I want `univer-sdk-skills` retained as an authoritative Univer/Core/Pro knowledge source, so that the new skill composes rather than replaces it.
27. As a maintainer, I want source authority divided by domain, so that conflicts are resolved using the source responsible for that contract.
28. As a maintainer, I want source commits and release cohorts recorded explicitly, so that updates are deliberate and reviewable.
29. As a maintainer, I want uncertain or conflicting API guidance surfaced rather than guessed, so that the skill never fabricates compatibility.
30. As a maintainer, I want the canonical Workspace and Workspace CLI applications used as end-to-end evidence, so that cross-layer guidance reflects a real composition root.
31. As a maintainer, I want complete applications to remain in the examples repository, so that the skill does not create a second implementation that drifts.
32. As a maintainer, I want developer documentation and agent references to share facts without duplicating whole upstream manuals, so that updates remain manageable.
33. As a maintainer, I want public-release readiness reviewed separately, so that internal closed-source knowledge is not merged publicly by accident.
34. As a repository contributor, I want existing discovery skills preserved, so that adding the rich skill does not alter their installation or mirror contracts.
35. As a repository contributor, I want one repository validation command to cover the new skill's required structure and links, so that CI catches packaging drift.
36. As a product owner, I want quality checks selected in proportion to the requested task, so that small changes are not burdened with irrelevant platform work.
37. As a product owner, I want architecture, security, recovery, fidelity, and deployability considered when relevant, so that “working” means more than compiling.

## Implementation Decisions

- Name the skill `build-univer-app`. Its neutral usage covers ask, reference, design, build, and fix scenarios even though its name is action-oriented.
- Keep the skill focused on cross-SDK Office Suite application integration. Delegate isolated Univer plugin development and detailed single-SDK knowledge to the corresponding authoritative skills and documentation.
- Treat Univer documentation and `univer-sdk-skills` as authoritative sources for Univer/Core/Pro concepts and capabilities.
- Treat the generated Collaboration SDK integration guide as authoritative for self-hosted collaboration contracts, lifecycle, identity, transport, endpoint, service, runtime, and persistence behavior.
- Treat the generated CLI SDK integration guide as authoritative for headless Univer, manual collaboration runtime, execution, inspection, rendering, Office exchange, process isolation, and Agent-oriented tooling.
- Treat `univer-workspace` and `univer-workspace-cli` as the canonical cross-layer reference applications. They demonstrate the browser/product/backend path and the Agent/headless/Worktree path against the same collaboration authority.
- Do not consider the unmerged `integrate-univer-cli` work when designing or implementing this skill.
- Make the Collaboration SDK the only supported collaboration backend for new applications.
- State consistently that the legacy Univer Server integration route is deprecated, unsupported, and unavailable for selection in new applications. Do not teach its installation, API, deployment, or migration.
- Preserve the core ownership model: Univer/Core/Pro owns content models, Facade APIs, commands, mutations, plugins, and rendering; the Collaboration SDK owns authoritative snapshot, changeset, revision, OT, and collaboration lifecycle; the CLI SDK owns headless and Agent execution infrastructure; the product application owns users, authentication, ACL, tenancy, hierarchy, sharing, target resolution, and business workflows.
- Present browser collaboration and CLI collaboration as distinct client modes against the same authority. Do not install automatic collaboration-client synchronization in the same headless runtime as the CLI SDK's manual pull and commit state machine.
- Preserve identity boundaries among application user identity, online member identity, Unit identity, product Resource and Node identity, Worktree identity, and submission idempotency identity.
- Preserve the separation between product data and collaboration data. Cross-store workflows must use explicit idempotency, durable operation state, and recovery rather than an assumed shared transaction.
- Support Sheet, Doc, Slide, Board, and Base at the architecture level. Mark every Unit-specific recipe with its verified scope.
- Require one exact release cohort for version-coupled Univer and Univer Pro packages. Record the compatible Collaboration SDK, CLI SDK, documentation, knowledge-skill, and example baselines used for each verified integration.
- Mark combinations that have not been executed against a coherent baseline as conceptual. Never infer compatibility from similar APIs.
- Resolve source conflicts by domain authority and matching release cohort. If evidence remains ambiguous, stop the affected implementation, present the conflict, and request direction.
- Keep the main skill instructions concise and procedural. Use progressive references for architecture, SDK boundaries, Workspace construction, Agent/CLI integration, quality checks, and source baselines.
- Keep the skill self-contained enough to perform internal work while allowing authorized maintainers to inspect current private upstream sources for detailed contracts.
- Add developer documentation under a dedicated Univer Office Suite section. English is authoritative; complete Chinese pages correspond to the English pages and identify that relationship.
- Keep code examples minimal and verified. Link to canonical implementation locations instead of copying complete applications.
- Do not create a documentation site, template application, generated API mirror, new package, or dependency.
- Extend repository validation only as much as needed to recognize and verify a public rich skill while retaining the existing discovery-skill contracts.
- Update repository discovery documentation in English and Chinese so that developers can find, understand, and install the new skill.
- Keep this work on a local feature branch. A local implementation commit is allowed for review; do not push or merge it into the public default branch until the closed-source publication boundary has been reviewed after the relevant material becomes public.

## Testing Decisions

- Use one highest-level behavioral seam: install or load `build-univer-app` in a clean Agent context and invoke it as a real user would. Evaluate observable answers, decisions, edits, and validation guidance rather than internal reference layout or wording.
- Run three independent forward tests through that seam:
  1. Ask the Agent to explain the three-layer SDK architecture, ownership, and supported collaboration backend.
  2. Ask the Agent to design and implement a small integration change in an existing Workspace application.
  3. Ask the Agent to design an Agent/CLI editing workflow using collaboration runtime and Worktree, including conflict and verification behavior.
- Prevent evaluation leakage: each forward-test Agent receives the installed skill and task-local project context, not the intended conclusions, prior analysis, or expected answer.
- Prefer the existing repository validator as the mechanical packaging seam. Extend it to validate required rich-skill resources and documentation links without changing discovery-skill behavior.
- Run the standard skill validator to check metadata, naming, and basic skill structure.
- Check that referenced local documents and source entries exist and that English/Chinese developer pages remain paired.
- Run or compile any included code snippet at the highest available application seam. Do not add snippet-specific test harnesses when the canonical application already exercises the behavior.
- A good behavioral result must select correct SDK ownership, preserve exact release cohorts and identity boundaries, avoid the legacy backend, distinguish verified from conceptual behavior, and propose validation proportional to the task.

## Out of Scope

- Creating a new `sdk-integration-guide` repository.
- Creating or copying a complete reference application.
- Replacing or deprecating `univer-sdk-skills`.
- Implementing or documenting the legacy Univer Server integration route.
- Writing a migration guide from the legacy route.
- Changing Collaboration SDK, CLI SDK, Univer/Core/Pro, or canonical example behavior.
- Publishing packages, deploying services, creating releases, pushing, or merging the feature branch.
- Resolving the long-term public/private publication policy before the closed-source sources are made public.
- Guaranteeing a recipe for a Unit type that has not been verified by its authoritative source or canonical example.
- Building a documentation website, translation framework, source synchronization daemon, or automatic upstream fetch process.
- Treating developer documentation and Agent references as separate sources of truth.

## Further Notes

- The source baseline is intentionally explicit and manually reviewed. The skill must not silently fetch newer upstream content and alter its knowledge during execution.
- `univer-sdk-skills` currently appears older than the canonical 1.0 insiders cohort, but it remains authoritative and is expected to be updated. Until then, version conflicts must be surfaced rather than reconciled by assumption.
- The first branch is intended for internal developer use because key SDK and example sources are private while the skills repository is public.
- Public merge readiness requires a later review after the closed-source material becomes public. That review is separate from this specification and implementation.
