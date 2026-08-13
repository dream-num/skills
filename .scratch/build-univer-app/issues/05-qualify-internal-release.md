# 05 — Qualify the internal skill release candidate

**What to build:** Demonstrate that the complete internal `build-univer-app` skill is discoverable, structurally valid, bilingual, source-grounded, and effective in clean Agent contexts without changing existing discovery skills.

**Blocked by:** 01 — Deliver the architecture ask/reference experience; 02 — Guide and build a self-hosted Workspace; 03 — Add Agent/CLI editing through Worktree; 04 — Deliver the Office content verification pipeline.

**Status:** complete

- [x] Repository validation, standard skill validation, local-link checks, and English/Chinese document-pair checks pass.
- [x] All three agreed clean-context forward tests pass without expected-answer leakage.
- [x] Existing discovery skills and their mirror checks remain unchanged.
- [x] The result remains on the internal feature branch and is not pushed or merged into the public default branch.
