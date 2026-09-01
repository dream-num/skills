
- Never simplify the run-api reference descriptions of the UNIVER API. They are foundational context for LLMs to understand Univer API behavior and contracts.
- When introducing `univer-cli`, keep the wording concise, elegant, and aligned with the taste of experienced mainstream developers. Avoid verbose, repetitive, or over-explained descriptions.
- Unless a shell behavior is unique to `univer-cli`, avoid explaining obvious shell usage. Assume the LLM is already highly proficient with shell workflows.
- For complex project planning, define success criteria before the plan. The success criteria file is
  a short checklist of user-visible outcomes, preservation constraints, deliverables, validation
  signals, non-goals, and ambiguities left for the plan. It is not a plan and must not contain pack
  decomposition, assertion design, or execution strategy.
- `skills/univer-cli-sdk-integration/` and `skills/univer-collaboration-integration/` are generated
  artifacts migrated from their SDK repositories. Never edit files in these directories directly;
  update their upstream source and migration script, then replace the generated artifact.
