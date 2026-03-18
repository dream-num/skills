# Write Safe Playbook

## When to use

Use this for any workbook mutation: sparse cell patches, range writeback, review tables, fills, and sheet lifecycle changes.

## Required input

- resolved `entryId`
- explicit mutation target
- chosen primitive
- verification plan

## Defaults

- choose the smallest-impact command that expresses the intent
- inspect the target before broad or structural writes
- verify immediately after the mutation
- if the requested change is purely visual or presentation-oriented, do not force it through canonical write commands; switch to `script js` fallback

## Primitive selection

| Intent | Command |
|---|---|
| sparse patch set | `write cells` |
| anchored rectangular payload | `write range` |
| review sheet or table replacement | `write table --sheet <name>` |
| bounded propagation / autofill | `write fill` |
| sheet lifecycle | `sheet create|rename|copy|delete` |

If none of these can express the task without guesswork, switch to [40-script-fallback.md](40-script-fallback.md).
This especially includes styling, borders, alignment, freeze panes, and merge workflows whose observable result is not just cell data.

## Core sequence

1. Reconfirm the target surface

```bash
agent-sheet inspect sheet --entry-id <entry-id> --sheet "<sheet>"
```

2. Use the minimal primitive

```bash
printf '{"<sheet>!D7":2815}\n' | agent-sheet write cells --entry-id <entry-id> --json

agent-sheet write range --entry-id <entry-id> "<sheet>!A2:C100" ./rows.tsv --input-format tsv

agent-sheet write table --entry-id <entry-id> --sheet "Review" ./review.tsv --input-format tsv

agent-sheet write fill --entry-id <entry-id> --sheet "<sheet>" --source-range A2:A2 --target-range A2:A200
```

3. For fresh workbooks, prefer stabilizing the default sheet first

```bash
agent-sheet sheet rename --entry-id <entry-id> --sheet "Sheet1" --name "<domain-sheet>"
```

4. Verify readback for data-visible changes

```bash
agent-sheet read range --entry-id <entry-id> --range "<verify-range>"
```

5. Add structure checks after broad mutations

```bash
agent-sheet inspect workbook --entry-id <entry-id>
```

If the requested outcome is presentation-only and canonical CLI cannot inspect that visual state, do not fake a readback. Route to [40-script-fallback.md](40-script-fallback.md) and return an explicit execution summary instead.

## Mutation notes

- `write range` can normalize an oversized explicit target down to the payload shape; still keep the anchor honest
- `write fill` may expand sheet capacity up to `--target-range`; keep the target tightly bounded
- `write table` is high impact because it replaces a table-shaped region; verify both contents and surrounding structure
- `read range --to-stdout` already emits real workbook data shape; if you want to skip a real source header row or project columns, do it in the transform step
- when the writeback depends on exact typed values, add `--type rawValue` on the read side before the shell transform
- canonical `write.*` verification is for data and structure, not for visual formatting state

## Stop / escalate

Stop and escalate when:

- the write would touch a large unknown region
- the target changed between inspection and write
- verification fails or reveals an unexpected structural change

## Output contract

Report:

- command used
- affected sheet/range
- verification result
- residual risk

If the task had to leave canonical `write.*` because the desired result was presentation-only, say so explicitly instead of reporting a fake readback status.

## Minimal example

```bash
printf '{"Sheet1!A1":"done"}\n' | agent-sheet write cells --entry-id <entry-id> --json
agent-sheet read range --entry-id <entry-id> --range "Sheet1!A1:A1"
```
