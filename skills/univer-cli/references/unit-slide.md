# Slide Unit

Unit-specific reference for `slide` units (presentations). Open it when the target unit is a slide.
This unit type has one bundled managed inspect tool (`slide-overview`, inventory/text only — no
sheet-range-equivalent for geometry or style) and a smaller Facade surface than `sheet`; treat both
as first-class facts, not gaps to work around silently.

## Start With The Bundled `slide-overview` Tool

There is a bundled managed tool, `slide-overview` (`univer inspect tools resolve slide-overview` to
confirm its current params/output contract). Use it first, before writing anything custom — it needs
only `--params '{"unitId": "..."}'` (`maxSlides`/`maxShapes`/`maxTextSnippets`/`maxTextLength`
optional), does **not** require `sac materialize` first (managed tools read through the runtime path
directly), and returns page size, slide count, per-slide `shapeCount`/`shapeIds`/bounded
`textSnippets`, and truncation warnings:

```bash
UNIVERFILE=./deck.univer
printf '%s' '{"unitId":"replace-with-unitId","maxSlides":20,"maxShapes":30,"maxTextSnippets":20,"maxTextLength":200}' > ./slide-overview.params.json
univer inspect "$UNIVERFILE" --tool slide-overview --worktree "$WORKTREE_ID" --params ./slide-overview.params.json --out ./slide-overview.result.json
```

This is enough for slide/shape inventory and text-content questions (which slide has which title,
how many shapes, rough text content). It deliberately does **not** report shape geometry
(left/top/width/height), fill/stroke, or shape type — those aren't in its output contract. Do not
assume they are there; check the actual returned JSON keys, and only escalate to the custom probe
below when the task needs geometry, fill/stroke, shape type, or another field this tool omits.

### Escalate To A Sidecar-Local Probe For Geometry/Fill/Style

For evidence beyond `slide-overview`'s contract (position/size to disambiguate shapes by
description, fill/stroke color, shape type, `isCustomShape()`), write one readonly sidecar-local
probe under the target sidecar's `inspect-scripts/` and reuse it for the rest of the task instead of
re-deriving ad hoc reads per question. Materialize first to get `sidecarPath`, then:

```bash
UNIVERFILE=./deck.univer
SIDECAR=$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync("./materialize.json","utf8")); console.log(j.sidecarPath)')
cat > "$SIDECAR/inspect-scripts/slide-detail.js" <<'JS'
({ params, univerAPI }) => {
  const presentation = univerAPI.getPresentation(params.unitId);
  if (!presentation) {
    return { ok: false, error: "PRESENTATION_NOT_FOUND", diagnostics: [{ field: "unitId", value: params.unitId }] };
  }
  const maxSlides = Math.max(1, Math.min(Number(params.maxSlides ?? 20), 100));
  const maxTextLength = Math.max(1, Math.min(Number(params.maxTextLength ?? 200), 2000));
  const slides = presentation.getSlides().slice(0, maxSlides);
  return {
    ok: true,
    target: { unitId: params.unitId },
    pageSize: presentation.getPageSize(),
    slideCount: presentation.getSlides().length,
    slides: slides.map((slide) => ({
      slideId: slide.getId(),
      slideName: slide.getName(),
      pageSize: slide.getPageSize(),
      background: slide.getBackground() ?? null,
      elements: slide.getElements().map((el) => {
        const transform = el.getTransform();
        const isShape = typeof el.getShapeType === "function";
        const text = isShape && typeof el.getShapeData === "function"
          ? (el.getShapeData()?.shapeText?.text ?? null)
          : null;
        return {
          id: el.getId(),
          type: el.getType(),
          left: transform.left, top: transform.top, width: transform.width, height: transform.height,
          shapeType: isShape ? el.getShapeType() : undefined,
          text: text === null ? null : String(text).slice(0, maxTextLength)
        };
      })
    }))
  };
}
JS
printf '%s' '{"unitId":"replace-with-unitId","maxSlides":20,"maxTextLength":200}' > ./slide-detail.params.json
univer inspect "$UNIVERFILE" --script "$SIDECAR/inspect-scripts/slide-detail.js" --worktree "$WORKTREE_ID" --params ./slide-detail.params.json --out ./slide-detail.result.json
```

Keep the probe readonly. Reuse the same script/params for every subsequent read in the task instead
of writing a new inline probe per question; only add fields (e.g. `getCustomGeometry()`,
`isCustomShape()`, stroke/fill from `getShapeData()`) when a specific ambiguity needs them. When the
task needs to locate a shape by description rather than by id (size, position, relative location,
approximate color), use the `left/top/width/height` facts this probe returns instead of guessing
from prose — the viewer origin is the slide's top-left corner, `width`/`height` grow right/down, and
"bottom-right" means high `left+width` and high `top+height` relative to `pageSize`.

## SaC Common API Pocket Guide

- Get the presentation: `univerAPI.getPresentation(unitId)` (returns `null` if not found — do not
  assume `getActivePresentation()` resolves the right unit when a task names a specific `unitId`).
  Creating a new presentation from scratch uses `univerAPI.createPresentation(data?, options?)`.
- Slide CRUD lives on `FPresentation`, not `FSlide`: `getSlides()`, `getSlideById(id)`,
  `getSlideByIndex(index)`, `appendSlide(options?)`, `insertSlide(index, options?)`,
  `moveSlide(slide, toIndex)`, `deleteSlide(slide)`. There is **no public `duplicateSlide`** on the
  Facade (an internal model method exists but is not exposed) — to duplicate a slide, read the
  source slide's `getElements()`/`getData()`, `insertSlide()` a new one, and re-create each element
  on it (shapes via `toBuilder()` + `insertShape()`, images via `toBuilder()` + `insertImage()`).
  Verify this gap against `types/*.d.ts` before assuming a workaround is needed — Facade surface
  changes across SDK versions.
- Shape read/write: `fSlide.getShapes()`, `fSlide.getElementById(id)`. To create, use
  `fSlide.newShape().setShapeType(...).setAbsolutePosition(left, top).setSize(width, height)...build()`
  then `fSlide.insertShape(shapeInfo)`. To edit an existing shape, start from it, not from scratch:
  `shape.toBuilder().setShapeSolidFill('#ff0000')...build()` then `fSlide.updateShape(shapeInfo)`.
  The same insert/update-via-builder pattern applies to images (`newImage`/`insertImage`/`updateImage`)
  and text boxes (`fSlide.newTextBox()` is a shape builder preset for a borderless text shape).
- Runtime enum access does not always match the declared TS type name. Several slide enums are
  exposed under a `Slide`-prefixed runtime name that differs from their declared type: type
  `ShapeTypeEnum` is `univerAPI.Enum.SlideShapeTypeEnum` at runtime; type `PlaceholderTypeEnum` is
  `univerAPI.Enum.SlidePlaceholderTypeEnum`; type `PageElementTypeEnum` is
  `univerAPI.Enum.SlidePageElementTypeEnum`. Do not reconstruct the runtime accessor by guessing from
  the declared type name — copy it from a `types/*.d.ts` `@example` block or `univer lookup` result.
- Grouping: `fSlide.group(elements: FPageElement[])` returns an `FGroup`; `group.ungroup()` restores
  the individual elements. `group.setPosition(...)` updates the group container's own transform, but
  the grouped children's individual transforms in `slide.getElements()` were observed to stay at their
  pre-group values, and rendering follows the children's absolute coordinates — moving a group this
  way did not visibly move its contents in testing. Re-verify against current behavior before relying
  on group-level moves; if it still reproduces, move each child shape individually instead of trusting
  the group's `setPosition()`.
- Pure geometry changes (move/resize/rotate/rename/lock/visibility) do not need the shape/image
  builder round trip: every `FPageElement` (shape, image, or group) has direct
  `setPosition(left, top)`, `setSize(width, height)`, `setTransform(partial)`, `setName`, `setLocked`,
  `setVisible`, `setSelectable` mutators. Reach for `toBuilder()` only when the edit also touches
  fill/stroke/text/shape-type/image-source — properties that live on the shape/image subtype, not the
  base element.

## Coordinates And Sizes Are In Slide Pixels, Not EMU

`setAbsolutePosition(left, top)`, `setSize(width, height)`, and page-size fields are **slide pixels**
in the unit's own page coordinate space — not raw OOXML EMU (the `.pptx` XML unit, ~914400 EMU per
inch) and not a fixed physical DPI shared across all decks. A default 4:3 deck's page is
`{ width: 720, height: 540 }`; a 16:9 deck may be `{ width: 1280, height: 720 }` or another preset
size. Always read `presentation.getPageSize()` or `slide.getPageSize()` first and place/size new
elements as fractions of that page, rather than reusing a pixel constant seen in one deck for
another. `ISlidePageSize` accepts an optional `preset` (`SlidePageSizePresetEnum`, e.g.
`WideScreen16By9`) alongside explicit `width`/`height`.

## Flat Text Vs Rich Text: A Known Facade Gap

A shape's plain text is `shapeText.text` (read via `getShapeData().shapeText.text`, written via
`shape.toBuilder().setText(newText)`). `setText()` replaces the **entire** text with one uniform
style — `setTextStyle()` on the same builder applies one `{ color, fontFamily, fontSize, bold,
italic, underline }` to the whole shape, not per character/run. There is no Facade method to append
or restyle a sub-range of existing text while preserving other runs' formatting; the underlying rich
text model (`dataModel.doc`) is separate from the flat `shapeText.text` field the builder writes, and
the Univer viewer renders from the rich-text side. Concretely:

- A request to "append a sentence without changing the existing formatting" or "keep the bold part
  bold" cannot be satisfied by `setText(oldText + newSentence)` — that flattens the whole shape to
  one style and typically also does not reach the viewer's rich-text render path.
- If the task's success criterion depends on mixed run-level formatting surviving an edit, treat this
  as a capability boundary: check `types/*.d.ts` for a rich-text-capable API before starting (a newer
  SDK revision may have added one), and if none exists, report the limitation explicitly rather than
  silently approximating with a flattening `setText()` call.
- Read current text with `getShapeData().shapeText.text` for a shape, or via the sidecar-local
  overview probe above for a whole-deck sweep; do not assume that flat text alone exposes per-run
  rich-text formatting — check the actual shape of `shapeText`/`dataModel` returned by the installed
  SDK version before claiming mixed formatting is readable or writable.

## Facade Gaps Are Expected, Not Errors

The slide Facade covers deck/slide/shape/image/group CRUD, backgrounds, transitions, and
master/layout/placeholder read access, but it does not yet expose everything a full OOXML deck can
hold. Known gaps as of this reference (re-verify against `types/*.d.ts` before relying on either
side of this list, since the SDK evolves):

- No public slide duplication method (see above) — reconstruct manually.
- **Speaker notes** are set-able at creation time — pass `speakerNotes` in the `options` object to
  `presentation.appendSlide(options)` / `insertSlide(index, options)` and it persists correctly (confirmed
  by reading it back from `slide.getData().speakerNotes`). There is no dedicated getter/setter to change
  notes on an already-created slide after the fact; a lower-level `SlidePage.updatePageData({ speakerNotes
  })` call exists but was observed to report success while the value did not actually persist (read back as
  unchanged) — treat post-creation notes updates as unverified and re-check the result rather than trusting
  the apply outcome. Prefer setting notes at `appendSlide`/`insertSlide` time over updating them afterward.
- No Facade builder to create tables or charts on a slide (`ISlideTableElement`/`ISlideChartElement`
  exist as data shapes, e.g. from PPTX import, but there is no `newTable()`/`newChart()` insert path
  yet). Editing an already-imported table/chart element's data is likewise unconfirmed — verify
  against current `types/*.d.ts` rather than assuming either full support or full absence.
- Master/layout/placeholder inheritance (`getMasterPage`, `getLayoutPage`, `PlaceholderTypeEnum`) is
  modeled and readable, but creating a new slide that binds to a specific layout/placeholder set from
  scratch has a narrower, less-exercised path than plain shape/image authoring — prefer starting new
  from-scratch slides with `appendSlide()` + explicit shapes/text boxes unless the task specifically
  requires placeholder inheritance, and confirm placeholder-bound edits render correctly in the
  viewer rather than assuming success from command exit status alone.

When a diagnostic, typecheck failure, or `types/*.d.ts` search shows the method genuinely does not
exist, that is the answer — do not spend a large lookup/read budget re-confirming absence, and do not
route around it by mutating raw internal model objects (`getPresentation()`/`getSlide()` low-level
model, `.univer` file bytes, etc.). Report the boundary in the response instead.

## Slide Recipes

### Create A Deck From Scratch

```ts
const presentation = univerAPI.createPresentation({ name: "Kickoff" });
const cover = presentation.appendSlide({ name: "Cover" });
cover.insertShape(
  cover.newTextBox()
    .setAbsolutePosition(60, 200)
    .setSize(600, 100)
    .setText("Project Atlas Kickoff")
    .setTextStyle({ fontSize: 32, bold: true, color: "#111827" })
    .build(),
);
```

Read `presentation.getPageSize()` before choosing absolute positions/sizes so placement scales with
the deck's actual page, not a hardcoded 720x540 assumption.

### Edit An Existing Shape's Fill Or Position

```ts
const presentation = univerAPI.getPresentation(unitId);
const slide = presentation.getSlideById(slideId);
const shape = slide.getShapes().find((s) => s.getId() === shapeId);
const updated = shape.toBuilder().setShapeSolidFill("#ED7D31").build();
slide.updateShape(updated);
```

Start from `toBuilder()` on the existing shape, not a fresh `newShape()`, so unrelated properties
(size, position, stroke, existing text) are preserved by default; only call the setters for what the
task asked to change.

### Reorder Slides

```ts
const presentation = univerAPI.getPresentation(unitId);
const target = presentation.getSlides().find((s) => s.getName() === "Closing");
presentation.moveSlide(target, 0);
```

`moveSlide` takes the target zero-based index in the resulting order; re-read `getSlides()` after the
move if a later step depends on the new ordering.

### Manually Duplicate A Slide (No Facade `duplicateSlide`)

```ts
const presentation = univerAPI.getPresentation(unitId);
const source = presentation.getSlideById(sourceSlideId);
const sourceIndex = presentation.getSlides().findIndex((s) => s.getId() === sourceSlideId);
const copy = presentation.insertSlide(sourceIndex + 1, { name: source.getName() + " (Backup)" });
for (const el of source.getElements()) {
  if (typeof el.getShapeType === "function") {
    const info = el.toBuilder().build();
    copy.insertShape(info);
  } else if (typeof el.getSource === "function") {
    const info = el.toBuilder().build();
    copy.insertImage(info);
  }
}
```

Re-check `types/*.d.ts` for a native duplicate/copy method before writing this by hand — this recipe
is the fallback for when one is not exposed, not a preferred pattern to reach for first.
