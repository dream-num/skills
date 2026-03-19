# Skills

Small repo for reusable agent skills.

## Structure

```text
.
├── README.md
└── skills/
    └── agent-sheet/
        ├── SKILL.md
        ├── evals/
        ├── playbooks/
        ├── references/
```

## Current Skill

[`skills/agent-sheet/SKILL.md`](./skills/agent-sheet/SKILL.md)

`agent-sheet` is a workbook-oriented skill for spreadsheet tasks through the `agent-sheet` command surface. It focuses on:

- workbook create, import, attach, push, and export flows
- sheet and range inspection with explicit `entryId` context
- canonical read and write commands before `script js`
- shell-native workbook pipelines with verification after mutation

## Evaluation

[`skills/agent-sheet/evals/evals.json`](./skills/agent-sheet/evals/evals.json) stores eval scenarios for improving and regression-testing the skill.

## Notes

- Keep each skill self-contained under `skills/<skill-name>/`.
- Keep runtime or benchmark artifacts outside the skill directory.
- Review skill contents before running them in a trusted environment.
