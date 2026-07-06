# SaC Authoring

SaC is the source-backed authoring surface for durable target behavior. Use it when a task needs
repeatable target changes rather than one-off evidence reads. Examples use
`UNIVERFILE=./orders.univer` as a shell variable for the target path; set it in the same shell or
replace `$UNIVERFILE` with the literal `.univer` path.

## Materialize

For an existing target, run:

```bash
UNIVERFILE=./orders.univer
WORKTREE_ID=<id>

univer sac materialize "$UNIVERFILE" --worktree "$WORKTREE_ID" --json
```

Read `sidecarPath` from command JSON. Do not guess hidden sidecar paths. Materialize uses the
committed worktree scope; `--worktree <id>` is required.

Typical sidecar roles:

- `migrations/`: Facade Migration Pack source.
- `assertions/`: global target final-state assertion source.
- `archives/materialize/<archive-id>/migrations/`: previous active migration source archived by
  materialize for review only.
- `types/`: generated Facade/SaC reference material.
- `inspect-scripts/`: scratch readonly probes.
- `runs/`: verification reports and diagnostics.
- optional notes, plans, or success criteria if the agent or task uses them.

The sidecar is source and orientation evidence. Use materialized baseline source, migration pack
source, TSV/table previews, and sidecar docs to form a hypothesis about the imported workbook
shape: likely sheets, used regions, formulas, formats, preservation boundaries, and source/target
candidates. Then choose the smallest target-visible confirmation path that can prove or reject that
hypothesis. Canonical target data and applied SaC state belong to the target `.univer` container, so
baseline source and TSV/table previews do not replace managed inspect, assertions, verify reports,
or bounded export checks when current target-visible facts matter. Archived materialize migrations
are not active source and are not applied or verified by default.

## Migration Packs

Create durable source with:

```bash
UNIVERFILE=./orders.univer

univer sac migration create "describe-change" "$UNIVERFILE"
```

Migration packs are ordinary TypeScript source. Use generated local types in the sidecar. Keep
target path, `unitId`, sheet names, and ranges explicit when behavior is unit-specific.
Ordinary draft packs include a `migration.ts` entrypoint by default. Keep `pack.ts` as metadata and
execution order; author target mutations in listed entrypoint files such as `migration.ts` or
`*.unit.ts`.

`pack.files` lists migration implementation entrypoints only. Do not include assertion files,
README files, params, probes, or evidence files. Keep global assertions under
`assertions/**/*.assertions.ts`; `univer sac verify` discovers global assertion entrypoints separately
from migration apply source.

For ranges with intentional blanks, clear the target range first and skip per-cell writes for blank
cells, or write nonblank cells individually. Do not pass `null` inside `setValues()` matrices. When
writing totals or other formulas in amount columns, set the formula/value and expected number format
in the same migration. Prefer A1 range strings for simple table writes. Before broad type searches,
use short lookup queries such as `univer lookup "range address"` or exact-symbol queries such as
`univer lookup "FRange.offset"`, then follow the returned `sed -n` read hint.

If a pack has already been applied and behavior needs to change, prefer a follow-up migration pack
over editing already-applied source into hash or applied-state drift.

## Templates

Templates are source scaffolds, not a DSL. Discover them with:

```bash
univer sac migration templates --json
univer help sac migration create
```

Choose a template only when its `useWhen` metadata matches target-visible evidence. Generate the
source, inspect it, fill TODOs from evidence, then apply and verify:

```bash
UNIVERFILE=./orders.univer

univer sac migration create "update-prices" "$UNIVERFILE" --template sheet-keyed-write
```

If no template fits, create an ordinary migration pack and author the source directly.

Do not infer template availability by passing invalid ids, scanning sidecars, or scanning installed
skills. The CLI help and `templates --json` output are the supported discovery surfaces.

## Assertions

`assertions/**/*.assertions.ts` entrypoints are useful when correctness matters and target-visible
final state should be checked repeatably. Assertions are file-level: use `target` for container
inventory, explicit typed unit helpers for unit-local facts, and `facts` for shared business facts
that must agree across units.

```ts
import { defineAssertions } from "univer:sac/assertions";

export default defineAssertions(({ target, sheetUnit, baseUnit, slideUnit, docUnit, facts }) => {
  target(({ units }) => {
    units().contains([
      { unitId: "crm", unitType: "base", name: "CRM" },
      { unitId: "report", unitType: "sheet", name: "Pipeline Report" },
      { unitId: "brief", unitType: "doc", name: "Executive Brief" },
      { unitId: "deck", unitType: "slide", name: "QBR Deck" }
    ]);
  });

  sheetUnit("replace-with-sheet-unitId", ({ sheet, range }) => {
    sheet("Summary").exists();
    range("Summary!A1:C3").displayValues([
      ["Region", "Revenue", "Margin"],
      ["North", "$12,000", "18%"],
      ["South", "$9,500", "16%"]
    ]);
    range("Summary!B4").displayValue("$535K");
    range("Summary!B4").numberFormat("$#,##0");
  });

  baseUnit("replace-with-base-unitId", ({ table }) => {
    table("Accounts").exists();
    table("Accounts").fields([{ name: "Status", type: "text" }]);
    table("Accounts").records([{ Name: "Acme", Status: "Active" }]);
    table("Accounts").recordCount(3);
    table("Accounts").recordsContain([{ Name: "Acme" }]);
    table("Accounts").recordByKey("Name", "Acme").matches({ Status: "Active" });
    table("Accounts").view("Open Accounts").type("grid");
  });

  slideUnit("replace-with-slide-unitId", ({ presentation, slide }) => {
    presentation().pageSize({ width: 1280, height: 720 });
    slide("intro").exists();
    slide("intro").textContains("Q2 Revenue");
    slide("intro").shape("title").text("Q2 Revenue Review");
  });

  docUnit("replace-with-doc-unitId", ({ document }) => {
    document().heading("Executive Summary").exists();
    document().paragraphs(["Executive Summary", "Approved forecast"]);
    document().paragraphsContain(["Approved forecast"]);
    document().outline([{ text: "Executive Summary", level: 1 }]);
    document().textContains("Approved forecast");
  });

  facts(({ fact }) => {
    fact("pipeline-total", "$535K")
      .sheetDisplayValue("report", "Summary!B4")
      .docTextContains("brief")
      .slideTextContains("deck", "intro");
  });
});
```

For a unit-only assertion source, `defineAssertions(({ sheetUnit, baseUnit, slideUnit, docUnit })`
is enough; include `target` or `facts` only when that source checks container inventory or shared
business facts.

`defineAssertions` registration is synchronous deterministic code. Do not use async assertions or
runtime probes inside registration; use readonly inspect scripts for investigation and then encode
the durable result as assertions.

`unitId` is the only top-level assertion unit selector. Do not use remote unit ids, unit
names, sheet names, or implicit active workbook state to route assertions. Legacy top-level
`sheet()` and `range()` helpers are not current assertion APIs; spreadsheet assertions belong inside
`sheetUnit("<unitId>", ({ sheet, range }) => { ... })`.

Treat `assertions/**/*.assertions.ts` as the current acceptance contract for the target state.
Split entrypoints by unit or target concern, such as `sheet-values.assertions.ts`,
`base-records.assertions.ts`, `slide-copy.assertions.ts`, or `doc-content.assertions.ts`, not by
migration pack. Other `.ts` files under `assertions/` are helpers only when imported by an
entrypoint. When a migration changes the intended final target state, update the global assertions
to the new final state in the same work. Do not keep old intermediate expectations just because an
earlier migration made them true.

Good assertion targets include important labels, headers, totals, formulas, number formats, visible
values, sheet existence, used ranges, filters, spreadsheet tables, unit inventory, key resource
semantics, Base tables/fields/records/views, Base record counts and key lookups, slide/page/shape
text and geometry, doc text, outline, headings, paragraphs, representative rows, and cross-unit
business facts. For large tables, prefer stable summaries and representative rows over a full cell
snapshot. For Base, slide, and doc assertions, prefer stable Facade-visible semantics over raw
storage snapshots and generated ids.

A minimal entrypoint (`assertions/values.assertions.ts`) looks like this:

```ts
import { defineAssertions } from "univer:sac/assertions";

export default defineAssertions(({ sheetUnit }) => {
  sheetUnit("replace-with-sheet-unitId", ({ sheet, range }) => {
    sheet("Summary").exists();
    // values()/rawValues() compare TYPED cell values, not display text:
    range("Summary!A2:B2").values([["Widget", 1280]]); // a number stays a number
    range("Summary!C2").formula("=SUM(B2:B10)"); // formula text incl. leading "="
    range("Summary!D2:D3").displayValues([["", "12.5%"]]); // display readback is strings; blank = ""
  });
});
```

Inside `sheetUnit`, `range()` takes a sheet-qualified A1 such as `"Summary!A1:B2"`. Match the
assertion method to the value surface you are gating, or it will fail even when the workbook is
correct:

- `values` / `rawValues`: logical cell values with typed equality. Numbers stay numbers, booleans
  stay `true`/`false`, and **dates are serial numbers** (e.g. `45344`), not strings. Do not quote a
  date or number as a string in these matrices.
- `displayValues`: display cell values, formatted strings exactly as shown; assert blank cells as
  `""` because display readback returns strings.
- `cellData`: storage cell data. Use this only when the Facade cell model shape itself is the
  contract.
- `formula` (single A1) / `formulas` (matrix): formula text including the leading `=`.
- `numberFormats`, `styles`, `backgroundColors`, `conditionalFormats`: format/style/resource facts.

### Spreadsheet Value Surfaces

Sheet value-surface guidance (logical vs display vs storage, numeric display placeholders, verify value-semantics) moved to `unit-sheet.md`.


Do not use assertions for temporary intermediate migration states, raw `.univer` storage internals,
generated ids, broad inspect dumps, or runtime implementation details. Use readonly inspect probes
for investigation; use assertions for repeatable correctness gates.

After authoring or updating migration source, run `univer sac apply "$UNIVERFILE"` when source is
pending, then `univer sac verify "$UNIVERFILE" --json`. A failed assertion means either the target
final state is wrong or the assertion expectation is wrong; inspect the report before editing either
side.

Assertions are a product capability, not a required planning method. Use the agent or user-selected
planning approach, but keep global assertions grounded in final-state task evidence rather than
whatever a migration happened to write.
