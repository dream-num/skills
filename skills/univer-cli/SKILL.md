---
name: univer-cli
description: "Use when solving spreadsheet workbook problems with the `univer` CLI as a terminal-native spreadsheet engine: Excel-compatible `.xlsx` handoff, `.univer` univerfiles, SaC sidecar authoring, sidecar inspect scripts, formulas, formatting, charts, shapes, floating images, live preview and viewer review comments, versioning, or export/import handoffs."
---

# univer-cli

`univer` is a spreadsheet engine in the terminal. Use it when an agent needs real workbook
semantics: sheets, ranges, formulas, formatting, layout, previews, imports, exports, or versioned
workbook state.

Install the CLI with `npm i -g univer-cli`. Update the CLI with `univer update`. The executable is
`univer`.

## Core Mental Model

Treat workbook-visible state as the source of truth. A successful command summary, local metadata,
or internal storage state does not prove that sheet names, cell values, formulas, formatting, or
exported handoff files are correct.

The workbook path is the local identity. Pick one explicit path such as `./budget.univer` and use
that path as the CLI target. Do not target workbooks by `sessionId`, internal storage ids, or
runtime ids. When a multi-unit command asks for a local unit scope, pass the explicit
`--local-unit-id` for that command without treating it as the file identity.

`.univer` files are CLI operation targets, not agent-editable data stores. Do not read or patch
univerfile internals. The current workbook authoring path is SaC source:
`univer sac materialize`, `univer sac migration create`, `univer sac apply`, and
`univer sac verify`.

`univer import` and `univer export` are entry and handoff commands around that SaC path. File
import appends generated SaC migration source and returns `sidecarPath`; use that field as the
agent's primary workspace instead of guessing a hidden path. For existing workbooks, materialize the
SaC sidecar and use the returned `sidecarPath`. The sidecar contains useful structure, docs,
generated source, inspect scratch space, and type information.

SaC commands require clean target state. Commit or restore uncommitted local mutations before
`univer sac materialize`, `univer sac apply`, `univer sac rollback`, or `univer sac verify`.
Materialize reads committed workbook state: init data plus synced changesets plus local changesets,
with uncommitted mutations excluded by the preflight.

`univer inspect <univerfile> --file <script.js>` is a read-only auxiliary probe. The script must be
a `.js` file under `<sidecarPath>/inspect-scripts/`. It is scratch space: create scripts as needed,
read the JSON-compatible stdout, and delete them when they no longer help. Durable workbook changes
belong in SaC migration packs, not inspect scripts.

Use `univer help` and `univer help <command...>` for exact syntax. Important current topics include
`univer help inspect`, `univer help sac`, `univer help sac workflow`, `univer help sac authoring`,
`univer help sac assertions`, `univer help view`, and `univer help status`.

## Use When

Use this skill when the task involves spreadsheet or workbook work, especially:

- creating, importing, exporting, or handing off `.xlsx`, `.csv`, or `.univer` files
- inspecting workbook shape, sheets, ranges, formulas, formatting, or visible cell state
- locating content-defined rows, columns, headers, or cells before editing
- making bounded edits to cells, formulas, formatting, charts, shapes, floating images, layout, or
  sheet structure
- writing generated matrix data back into a sheet-qualified range
- previewing workbook state locally with `univer view`
- reading submitted local viewer review comments with `univer view comments`
- creating, restoring, resetting, pulling, or syncing local workbook changesets
- proving that a workbook-visible mutation or export is correct enough to hand back

## Default Operating Loop

1. Pick one explicit workbook path, for example `./budget.univer`.
2. Create or import a workbook first if no `.univer` target exists.
3. Run `univer sac materialize "$WB" --json` when the workbook was not just created by a file
   import that already returned `sidecarPath`.
4. Inspect the sidecar first: README, generated migration source, generated types,
   plans, success criteria, applied-state docs, and existing assertions.
5. Use `inspect-scripts/*.js` only when the materialized sidecar does not already expose the
   workbook-visible fact you need.
6. Mutate durable workbook behavior through SaC migration packs, not ad hoc runtime scripts.
7. Verify with `univer sac verify "$WB" --json` and the returned assertion evidence. A
   zero-assertion or all-skipped verify run is not completion evidence for a changed pack.
8. Export only after verification when the user needs a handoff file.
9. After changes have been verified, if the user may need to inspect, audit, or review the final
   workbook, check the current agent tool surface first. If a browser tool is available, run
   `univer view "$WB" --no-open --json`, open the returned URL with that browser tool, and include
   the URL in your response. If no browser tool is available, run `univer view "$WB" --open --json`;
   `--open` uses the OS browser opener, and the CLI returns a prepared URL and diagnostic if the
   browser cannot be opened automatically.
10. Commit or sync only after verified changes when versioning is part of the workflow.

## Hard Rules

- Do not read `.univer` internals to infer workbook contents.
- Do not write, patch, rewrite, rename, or manipulate internal univerfile storage contents.
- Do not inspect internal metadata, snapshots, mutation logs, or storage fragments as a substitute
  for workbook-visible reads.
- Do not guess sheet names, row numbers, formulas, ranges, or changed cells from memory or file
  metadata.
- Do not treat stdout summaries as proof of workbook state. Verify with workbook-visible evidence.
- Do not put durable workbook changes in `inspect-scripts/`.
- Do not invent commands or runtime APIs. Check `univer help` and the materialized sidecar docs.

Direct storage access can corrupt workbooks or teach the agent false state. If the CLI cannot read
what you need, diagnose the CLI/runtime path instead of bypassing it.

## Command Selection

| Need | Prefer |
| --- | --- |
| Discover exact command syntax | `univer help`, `univer help <command...>` |
| Start a local univerfile from a blank file or spreadsheet source | `univer new` or `univer import --file <input.xlsx|csv|url> <file.univer>` |
| Hand back Excel-compatible output | `univer export` |
| Begin workbook work after new/import | Use returned `sidecarPath` from import, or run `univer sac materialize <univerfile> --json` and read `sidecarPath` |
| Understand workbook shape before editing | Materialized sidecar README/source/types first; sidecar `univer inspect` script only as auxiliary readback |
| Locate content-defined cells | Sidecar inspect script scanning bounded sheets/ranges after materialize |
| Read rectangular data | Sidecar inspect script returning `getValues()`, `getDisplayValues()`, or `getFormulas()` |
| Write a known rectangular matrix back | SaC migration pack with explicit sheet and A1 range boundaries, then `sac apply` and `sac verify` |
| Apply bounded workbook-local logic | SaC migration pack |
| Create or maintain workbook charts | SaC migration pack using chart Facade APIs, plus `univer view` for visual review |
| Create or maintain workbook shapes and connectors | SaC migration pack using shape Facade APIs, plus `univer view` for visual review |
| Create or maintain workbook floating images | SaC migration pack using drawing/image Facade APIs, plus `univer view` for visual review |
| Preview readonly workbook state | If an agent browser tool is available, run `univer view "$WB" --no-open --json` and open the returned URL with the tool; otherwise run `univer view "$WB" --open --json`. Use `--no-open --json` for known headless, remote, CI, server, or no-browser environments |
| Read local viewer review feedback | `univer view comments "$WB" --json` |
| Check local versioning state | `univer status` |
| Create a local changeset from local mutations | `univer commit --message <message>` |
| Discard uncommitted local mutations | `univer restore` |
| Reset local unsynced commits | `univer reset --soft HEAD~N` or `univer reset --hard HEAD~N` |
| Append an existing remote unit to a local `.univer` file | `univer import --remote-unit-id <unitId> <file.univer>` |
| Initialize an empty local file from an existing remote unit | `univer clone <file.univer> --unit-id <unitID>` |
| Pull remote-only changes for a bound local unit | `univer pull` |
| Sync local and remote versioning state | `univer sync` |
| Create a SaC migration pack | `univer sac migration create <description> <univerfile>` |
| Apply, roll back, or verify SaC source | Clean target first, then `univer sac apply <univerfile>`, `univer sac rollback <univerfile>`, `univer sac verify <univerfile> --json` |
| Diagnose runtime problems | `univer doctor`, `univer daemon status` |
| Prepare a bug report or Univer team support artifact after user authorization | `univer doctor collect` |

Use canonical command help such as `univer help inspect`, `univer help sac workflow`,
`univer help view`, and `univer help status`. Top-level help group headings are visual sections
only; do not run group-prefixed topics.

## Execution Results

Treat non-zero exit as failure even when stdout is partially present. Read stderr before changing
approach; it usually contains the stable diagnostic code, usage, and retry examples.

Keep command stdout machine-readable when a script consumes it. If diagnostics are needed, capture
stderr separately so downstream tools receive only the intended JSON or file path.

```bash
univer sac materialize "$WB" --json > ./materialize.json
SIDECAR=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('./materialize.json','utf8')).sidecarPath)")
mkdir -p "$SIDECAR/inspect-scripts"
cat > "$SIDECAR/inspect-scripts/read-range.js" <<'JS'
() => {
  const workbook = univerAPI.getActiveWorkbook();
  const sheet = workbook.getSheetByName("Sheet1");
  if (!sheet) return { success: false, error: "Sheet1 not found" };
  return {
    success: true,
    displayValues: sheet.getRange("A1:D20").getDisplayValues()
  };
}
JS
univer inspect "$WB" --file "$SIDECAR/inspect-scripts/read-range.js" > ./range.json 2> ./range.err
status=$?
if [ "$status" -ne 0 ]; then
  sed -n '1,80p' ./range.err
  exit "$status"
fi
sed -n '1,40p' ./range.json
rm -f "$SIDECAR/inspect-scripts/read-range.js"
```

## Workflow References

`SKILL.md` keeps the rules needed for normal operation. Open
`references/workflow-recipes.md` only when you need a copyable workflow shape or a domain-specific
recipe. The reference covers:

- create/import then materialize and read `sidecarPath`
- locate/read workbook-visible data with sidecar inspect scripts
- write generated table data through SaC migration packs
- maintain charts, shapes, and floating images
- preview locally and read viewer review comments
- version verified changes, clone/pull/sync, SaC sidecar baseline, and export handoff

Do not treat references as new authority for mandatory safety rules. If a recipe seems stale, check
`univer help` and verify it against workbook-visible state before using it.

## Script And Handoff Rules

Use small sidecar inspect scripts or exported handoff files to reduce large ranges before bringing
data back to the agent. Diagnostics and help belong outside the data stream a script consumes.

- Keep ranges explicit and sheet-qualified.
- Quote the full A1 range string, especially for non-English or shell-sensitive sheet names.
- Stage intermediate files when you need a stable preview or assertion.
- Keep inspect scripts under `<sidecarPath>/inspect-scripts/` and delete scratch probes when done.
- Put durable workbook edits in migration packs, not inspect scripts.
- Verify with `univer sac verify`, sidecar inspect readback, `view`, or export/import roundtrip
  after every writeback.

Avoid `pnpm dev -- ...` in clean machine-readable examples. The pnpm/tsx wrapper can print logs to
stdout and corrupt streamed data. Use the installed `univer` executable or another entrypoint you
have proven emits clean stdout.

## Gotchas

- Internal metadata does not prove sheet names, formulas, changed cells, or handoff correctness.
- Univerfile storage contents are not a meaningful way to infer spreadsheet data. Use public CLI
  reads instead.
- Local file identity is the workbook path, such as `./budget.univer`, not `unitId`, `sessionId`, or
  internal ids.
- Command success is not enough after import, mutation, export, or handoff. Verify
  workbook-visible state.
- A non-zero exit means the operation failed. Read stderr for the diagnostic, usage, and retry
  guidance.
- Quote the full range: `Sheet1!A1:J20`, not just the sheet name fragment.
- Shell row counts can pass while headers, columns, or keys shift. Check headers, samples, and key
  columns together.
- `inspect` is read-only auxiliary probing. It is not a mutation surface and is not SaC completion
  evidence.
- `view` is readonly preview. Do not treat it as mutation verification unless the task is visual
  review.
- Charts are maintained through SaC migration packs and the Pro Charts facade. Do not edit chart
  resource internals or expect CLI probes to export chart images.
- Shapes are maintained through SaC migration packs and the Pro Shapes facade. Do not inspect
  private drawing resource storage or expect CLI probes to export shape images.
- Floating images are maintained through SaC migration packs and the Sheets Drawing facade. Do not
  invent a top-level image command or inspect private drawing resource storage.
- `commit` is local only; use `sync` to push local changesets.
- `restore` discards only uncommitted local mutations; it does not remove local commits.
- `reset` is local-only and limited to `HEAD~N` over unsynced local commits. Do not use it as a
  remote revert or force-push workflow.
- `sync` does not push uncommitted local mutations. Commit verified workbook changes first.
- If `sync` reports an invalid remote binding, stop and diagnose the local unit or remote setup.
- `pull` requires a local unit already bound to a remote unit. Use `sync` for first remote creation,
  `import --remote-unit-id` to append an existing remote unit to a `.univer` file, or
  `clone --unit-id` to initialize an empty local file from an existing remote unit.
- `clone` replaced older remote binding wording. Do not use or invent a `bind` command.
- If runtime-backed commands fail to start, inspect `univer daemon status` before retrying blindly.
- If workbook-visible reads disagree with internal metadata, trust workbook-visible reads first.

## Support

Only enter support flow when the user asks to report a suspected CLI bug. Public issues: https://github.com/dream-num/skills/issues. Community support and builder discussions: https://discord.gg/nThHPupraR. Private artifacts: email developer@univer.ai; get authorization before guiding `univer doctor collect`.

Skill document revision: 2026-06-06.
