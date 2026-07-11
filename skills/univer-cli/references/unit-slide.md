# Slide Unit

Unit-specific reference for `slide` units. Open it when the target unit is a `slide` presentation,
before authoring shape/text migrations or slide assertions.

Look up exact API signatures and enum members with `univer api show <symbol>` / `univer api find
<keyword>` (use declared names such as `ShapeTypeEnum`; runtime aliases like `SlideShapeTypeEnum`
also resolve). This file covers timing, selection, and gotchas — not full signatures.

## Per-page loop — do not batch pages

Finish one page → screenshot → fix it properly → then start the next page. "Generate everything
first, review at the end" lets the same mistake (overlap, overflow, wrong font sizing) repeat on
every page before it is caught.

## Generate through the SVG path

**Creating a page or adding elements to a page must go through SVG: draw the target SVG first (your
strongest visual authoring language), then emit a ready-made migration module with
`univer compile-svg page.svg --page <n> --unit <unitId> --out <sidecar>/migrations/<pack>/page-<n>.ts`
and register it in the pack — do not hand-write shape/text calls one by one, and do not paste
compiled output into a hand-written wrapper.** In SVG you lay out the whole composition (positions,
sizes, colors, layering) in a single pass; the compiler bakes in the geometry conversion, the facade
gotcha avoidance documented in this file, and the whole page-binding boilerplate
(`getPresentation(unitId)`, `setPageSize` matched to the viewBox, page targeting/clearing — see the
"SVG → facade" section). New page → full-page SVG; adding elements to an existing page → an SVG
with the full-page viewBox containing only the new elements, emitted with `--add`.

Hand-written facade calls are reserved for **non-generation** work: editing/deleting existing
elements, the delete step of single-block rework (see "Block-wise assembly"), and post-`build()`
injection on compiled output (alignment / corner radius / shadow).

Multi-page deck generation discipline (violating it is the #1 cause of "whole deck looks templated"
plus batch rework):

- **Write each page's SVG by hand against that page's actual content; never script/template-generate
  the whole deck's SVGs in one pass** (even if "the pages look similar" or "time is short"). A
  template script moves attention from each page's real layout onto the function abstraction: the
  output is same-looking pages, a single layout bug is copied across the whole deck, and fixing one
  spot means re-running everything.

## Managed slide inspect tools

| Tool | Use when |
| --- | --- |
| `units` | You need target unit inventory, `unitId`, type, name, or capabilities. |
| `slide-overview` | You have a Slide `unitId` and need presentation page size, slide count, per-slide shape count/ids, or bounded text snippets. |

`slide-overview` evidence is bounded to structure and text: page size, slide count, shape count,
shape ids, and text snippets. It does not return fill, stroke, opacity, or any rendered/visual
evidence, and it is not a full raw Slide model dump. Use returned slide ids and shape ids to target
`sac migration`/assertion work or a `screenshot` self-check; it cannot answer whether a shape is
visible against its background.

```bash
UNIVERFILE=./deck.univer

printf '%s' '{}' > ./units.params.json
univer inspect "$UNIVERFILE" --tool units --worktree "$WORKTREE_ID" --params ./units.params.json --out ./units.result.json
printf '%s' '{"unitId":"replace-with-slide-unitId","maxSlides":20,"maxShapes":50,"maxTextSnippets":20,"maxTextLength":200}' \
  > ./slide-overview.params.json
univer inspect "$UNIVERFILE" --tool slide-overview --worktree "$WORKTREE_ID" --params ./slide-overview.params.json --out ./slide-overview.result.json
```

## Create A Fresh Slide Unit

When the target unit does not exist yet (no baseline import, an empty univerfile), create it inside
migration source with `univerAPI.createPresentation(data)` — there is no CLI unit-add command; unit
creation is a migration action like any other durable change. Guard it so re-applying the pack stays
safe:

```ts
const presentation = univerAPI.getPresentation("replace-with-unitId") ?? univerAPI.createPresentation({
  id: "replace-with-unitId",
  name: "replace-with-display-name",
  defaultPageSize: { width: 1280, height: 720, preset: univerAPI.Enum.SlidePageSizePresetEnum.WideScreen16By9 }
});
const slide = presentation.getSlides()[0] ?? presentation.appendSlide();
```

`createPresentation` takes `Partial<ISlideData>` — minimal `{ id, name, defaultPageSize }` is enough
(`slideOrder`/`slides` are not required); the result is a valid deck that already
contains one empty default slide, not a broken/partial object. Pin the unit's id by passing it as `data.id`, not as a
separate option — `ICreateUnitOptions` (the second argument) has no id field. `getPresentation(id)`
on a missing id returns a falsy value (not a throw), so the `??` guard above is safe on first apply
and a no-op on re-apply. A fresh deck starts with one empty default slide, so
`getSlides()[0]` is the first page — do not `appendSlide()` unconditionally or you get a stray
blank page.

## Deck & pages

- Page size defaults to 16:9; coordinates and sizes share the same unit with a top-left origin;
  `getPageSize()` / `setPageSize({...})`. Keep the SVG `viewBox` equal to the page size.
- Page background supports solid / image / gradient / pattern (`slide.setBackground`, signature via
  `univer api show FSlide.setBackground`); slide transitions have presets (`univer api find
  transition`).
- Page operations `deleteSlide(slide)` / `insertSlide(index)` / `moveSlide(...)` **return a boolean
  and do not throw on failure** — check the return value when the operation must have happened.
- Slides have no formulas and no recalculation.

## Text

- `fontSize` is interpreted as **points, not pixels**: the renderer draws it as `Npt`
  (`Npt = N × 96/72 px`), so a value passed as if it were px renders **1.333× too large** and CJK
  text overflows its box most easily. Convert `fontSize = designPx × 0.75` (e.g. visual 24px → pass
  `18`). Keep positions/box widths/line heights in px; convert only at the `setTextStyle` step.
- A text box **wraps to its box width by default**, and any "estimate glyph width × char count" box
  sizing is always too narrow (CJK full-width glyphs, 4px inner padding, real font metrics), so it
  wraps. Do not size by estimate — after `build()`, inject `shapeText.textWrap = "none"` (no
  auto-wrap; explicit `\n` still breaks lines) and `autoFit = true` (real-font-metric measurement
  auto-sizes the box to the text's true width; center/right alignment shifts the box to keep its
  anchor). These fields are runtime-honored but missing from the SDK types (a known SDK typing
  gap), and `sac apply` typechecks migration source — typed property assignment fails with
  TS2339/TS18048, so go through a local `as any` alias until the SDK types are fixed:

```ts
const info = slide
  .newShape()
  .setText(text)
  .setTextStyle({ color: "#111827", fontSize: 24 * 0.75 }) // px → pt
  .setNoneFill()
  .setStrokeLineType(univerAPI.Enum.SlideShapeLineTypeEnum.NoLine)
  .setSize(10, lineCount * 24 * 1.4) // width is overwritten by autoFit; give height per line count
  .setAbsolutePosition(x, y)
  .build();
const infoData = info.element.shapeData as any; // SDK types miss these runtime fields
infoData.shapeText.textWrap = "none";
infoData.shapeText.autoFit = true;
slide.insertShape(info);
```

- `autoFit` sizes **width only**, never height — give multi-line boxes enough height yourself or the
  text is clipped vertically. Heuristic: `height = lineCount × fontSizePx × 1.4` (1.4–1.5 line
  height). Text overflowing its declared height is **silent** (no diagnostic, no assertion failure)
  — layout correctness is judged by rendering.
- A text box is **`newShape().setText(...)`** (there is no separate text-box builder): `setText`
  marks the element `isTextBox` and applies the text-box default style (white fill + `#bcbcbc`
  stroke, see "Fill and stroke"); `setText`/`setSize` order is arbitrary.
- `setTextStyle` has no alignment field (only `color`/`fontFamily`/`fontSize`/`bold`/`italic`/
  `underline`). Horizontal/vertical alignment exists at the data layer and renders when injected
  into the built element before inserting (same `as any` alias — also missing from SDK types):

```ts
const info = slide
  .newShape()
  .setShapeType(univerAPI.Enum.SlideShapeTypeEnum.Ellipse)
  .setText("9")
  .setSize(56, 56)
  .setAbsolutePosition(x, y)
  .setShapeSolidFill("#4472c4")
  .setTextStyle({ color: "#ffffff", fontSize: 20 })
  .build();
const infoData = info.element.shapeData as any;
infoData.shapeText.horizontalAlign = "center"; // "left" | "center" | "right", default "left"
infoData.shapeText.verticalAlign = "middle"; // "top" | "middle" | "bottom", default "top"
slide.insertShape(info);
```

- When copying coordinates from a design/SVG source by hand: SVG text `y` is the **baseline**, the
  facade position is the **box top** — `top ≈ baselineY − 0.8 × fontSizePx` (compile-svg bakes this
  in; only hand-written code needs it).
- Letter-spacing is stored but **not rendered** — no workaround; line height / inner padding have no
  API.

## Shapes

- Shape types are string enums; `univer api show ShapeTypeEnum` lists the full set (~200 presets).
  Common: `rect` / `roundRect` / `ellipse` / `diamond` / `triangle` / `hexagon` / `star5` / `arc` /
  `frame` …
- **The arrow family is built-in**: `rightArrow` / `leftArrow` / `upArrow` / `downArrow` /
  `leftRightArrow` / `quadArrow` / `bentArrow` / `curvedRightArrow` / `swooshArrow` … (do not
  kit-bash rect + triangle).
- **No connector / arrow-endpoint facade** (the data layer has it; the facade has no
  `newConnector`): draw connection arrows with preset arrow shapes, or line + triangle.
- A `roundRect` corner radius has no builder setter — inject after `build()`:
  `info.element.shapeData.adjustValues = { adj }` where `adj ∈ [0, 50000]` and
  `cornerRadius ≈ (adj / 100000) × min(width, height)`; `50000` gives a full pill, default ≈16667.
- Custom geometry (arbitrary paths) works, but **`IShapePath.data`'s SVG-string channel is a type
  declaration only — the renderer does not consume it; you must provide `dataArray`** (M/L/C/Q/A/z
  command array). For complex shapes prefer compile-svg (it generates `dataArray` for you).
- Outer shadow renders but has **no builder setter**: inject after `build()` into
  `info.element.shapeData.outerShadow = { … }` (fields and the 20 presets via `univer api find
  shadow`); judge the effect by screenshot.
- Grouping: `slide.group([elements])` / `ungroup(group)` (`univer api find group`).
- A single-segment stroked arc (the SVG dasharray progress-ring technique) has no counterpart —
  convert to a filled ring sector (compile-svg does this conversion).

## Fill & stroke (set the triple explicitly on every element you author)

**Set fill, stroke, and text color explicitly on every element you author — never rely on renderer
defaults.** Explicit values make storage equal rendering, so `style()` assertions and diffs read the
true value; defaults never error, they just render wrong (solid white/blue blocks on a dark page,
near-black text "invisible" on a dark background). The SVG compiler already emits all three
explicitly; hand-written facade code needs this rule.

**Fill — pick one of four** (all on the builder chain):

- Solid `setShapeSolidFill(color[, opacity])` — pass opacity (0–1) directly for translucent blocks;
  do not simulate with stacked layers.
- Gradient `setShapeGradientFill(type, colorStops, angle)` — linear/radial etc., enum via
  `univer api show ShapeGradientTypeEnum`.
- Image fill `setImageFill(source, sourceType, options)` — photos on cards use
  `imageFillMode: Stretch`; decorative textures use `Tile` (see "Bitmap images");
  `options.srcRect` crops the source first (**percent** 0–100 cut from each edge).
- None `setNoneFill()` — outlines, transparent containers.

**Stroke — either specify it fully or turn it off explicitly**:

- Want one: `setStrokeColor(…)` + `setStrokeWidth(n)`; opacity `setStrokeOpacity(0–1)`; dashes
  `setStrokeLineDashType`, caps `setStrokeLineCapType`, joins `setStrokeLineJoinType` (enums in the
  `univer api find` index).
- Remove it: **`setStrokeLineType(univerAPI.Enum.SlideShapeLineTypeEnum.NoLine)`** (the
  DrawingML-semantic "no line"). ⚠️ `setStrokeWidth(0)` does **not** suppress the rendered stroke — do not use it
  to hide a border. ⚠️ `setStrokeWidth` turns a NoLine stroke into a solid line, so put
  `setStrokeLineType(NoLine)` at the end of the chain.
- Colors accept `#RRGGBB` and `rgba(r, g, b, a)` (alpha renders; semi-transparent text is done by
  baking alpha into the text color). Avoid `hsl()` and color names.

**Default semantics when reading existing elements** (other authors, legacy files): a new text box
stores SDK defaults (white solid fill, 1px `#bcbcbc` stroke, text 16px `#111827` near-black,
left/top alignment; 260×88 when `setSize` is omitted), but a bare `newShape()` stores
**fill/stroke = null** and the renderer substitutes the theme default — an opaque blue `#4472C4`
fill plus a thin border — so a storage-level assertion or inspect reads null, not a color:
"renders blue" ≠ "stores blue".

## Bitmap images (photos / logos / QR codes / textured icons)

For content that basic shapes plus text cannot restore convincingly (photos, logos, QR codes,
3D-textured icons, illustrations), **insert a bitmap — do not fake icons with unicode glyphs or
shape kit-bashing**:

- SVG route: `<image x=".." y=".." width=".." height=".." href="data:image/png;base64,…"/>` —
  `univer compile-svg` compiles it into `insertImage`.
- Facade route:
  `slide.insertImage(slide.newImage().setSource(dataUri, univerAPI.Enum.SlideShapeImageSourceTypeEnum.BASE64).setAbsolutePosition(x, y).setSize(w, h).build())`
  (use `.URL` for URL sources).
- **Cropping a region out of a larger image** (e.g. one icon / QR code inside a full-page reference
  screenshot): add `.setCrop({ left, top, right, bottom })` to the builder chain — it means **how
  much to cut from each edge**, and the unit is **element display px** (not source-image pixels,
  not percent). Least error-prone flow: first `setSize(regionWidth, regionHeight)` (1:1 — crop
  values then equal source pixels: region x0..x1 → `left: x0, right: sourceWidth - x1`, same for
  y); to display scaled, multiply setSize **and every crop value** by the same scale factor (e.g.
  2× display → crop ×2) — raw source-pixel values on a scaled frame crop the wrong region. No
  external image tooling is needed.
- An image can also be clipped to a preset shape: `setClipShape(shapeType[, adjustValues])` (round
  avatars, rounded card images).

**Boundary: bitmaps are for local assets only. Never underlay a full-page reference image (or any
full-page bitmap) and stack elements on top** — the layout skeleton and text must be real editable
elements; a full-page underlay bleeds through even under a masking overlay and reduces editability
to zero.

**Decorative texture backgrounds (dot grids / meshes / noise) use image tile fill, not swarms of
tiny shapes** (hundreds of elements stall rendering and screenshots time out): one rect +
`.setImageFill(source, univerAPI.Enum.SlideShapeImageSourceTypeEnum.BASE64, { imageFillMode: univerAPI.Enum.SlideShapeImageFillModeEnum.Tile, srcRect: { left, top, right, bottom } })`
— `srcRect` is the **percentage** (0–100) cut from each edge, so a small clean-texture patch can be
cropped straight out of the full reference image as the tile source. Without a usable texture
source, approximate with a solid/gradient fill or simply omit it (decoration, not information).

## Editing & block-wise assembly (dense pages)

- Edit / delete: `getElements()` / `getElementById(id)` → `updateShape(builderInfo)` /
  `deleteElement(el)` — **`deleteElement` takes the element object** (from `getElementById(id)`),
  not the id string; passing the id throws an obfuscated SDK internal error (`_0x… is not a
  function`). Delete/move methods **return a boolean and do not throw on failure**.
- `build()` has preconditions: a shape must have a shapeType (`setText` falls back to Rect); an
  image must have a source.

On information-dense pages (card grids / swimlanes / timelines / hub-and-spoke diagrams), do not
chase a perfect whole page in one shot: place the skeleton first (background, title, bottom
banner), then generate block by block (one card group / one swimlane / one diagram region), all
blocks sharing the page coordinate system.

- **Record ids on insert**: the return value of `slide.insertShape(info)` / `insertImage(info)`
  exposes `.getId()` (equal to `info.element.id`) — record each block's element ids.
- **Single-block rework**: `slide.deleteElement(slide.getElementById(id))` for all of the block's
  old elements, then re-insert the whole block — delete-without-reinsert leaves a hole,
  reinsert-without-delete stacks ghosts. Block generation and re-insertion also go through the SVG
  path (full-page viewBox, only that block's elements, emitted with
  `compile-svg block.svg --page <n> --add --unit <unitId> --out …`).
- Screenshot checks stay per page and count against that page's rework budget.

## Slide value & assertion surfaces

Map the assertion method to what it actually reads — they are not interchangeable:

- `slide(id).exists()` / `slide(id).pageSize(expected)` / `presentation().pageSize(expected)`:
  structural facts.
- `slide(id).shape(id).exists()`: structural.
- `slide(id).shape(id).geometry(expected)`: the shape's transform (position/size/rotation).
- `slide(id).shape(id).style(expected)`: the shape's raw style config (`getShapeData()` minus
  `shapeText`) — this **does** cover fill/stroke storage fields such as fill type/color/opacity and
  stroke color/width/opacity.
- `slide(id).shape(id).text(expected)`: only the `shapeText.text` string. It does not cover text
  color, font, size, or alignment.
- `slide(id).textContains(expected)` / `facts(...).slideTextContains(...)`: text presence across the
  slide's shapes.

Two coverage gaps to plan around:

- A `style()` expectation compares **stored** config, not rendered pixels. A `style()` assertion that
  expects `stroke.width: 0` will pass even though the stroke still renders (see "Fill & stroke") —
  a passing `style()` assertion is not proof that the element looks right. Prefer
  `setStrokeLineType(NoLine)` in the migration itself, and confirm the actual render with
  `screenshot`.
- Text color, font, and alignment have **no** assertion coverage at all (`style()` excludes
  `shapeText`; `text()` checks only the string). For any task where those must be correct, `sac
  verify` passing is not sufficient evidence — render and inspect the page.

## SVG → facade (`univer compile-svg`, the generation path — see top)

`univer compile-svg page.svg --page <n> --unit <unitId> --out <path>.ts` deterministically compiles
one SVG (inline styles) into a **self-contained migration module** (`defineUnitMigration` with the
whole page binding generated: `getPresentation(unitId)`, `setPageSize` matched to the SVG viewBox,
declarative page targeting, clearing): rect / circle / ellipse / path / line / polygon / text
(including per-`tspan` colored runs) / linear gradients / transforms map to `newShape` /
`newImage` / custom geometry calls, with the gotchas above baked in (px→pt, baseline→box-top,
textWrap/autoFit, NoLine stroke removal, roundRect adj, per-run coloring, marker arrowheads, dashes,
arc→ring-sector).

- **`--page <n>` is the declarative target page (1-based)**: an existing page is cleared and
  refilled; n = page-count+1 appends a new page; larger values throw when the migration runs. A
  fresh deck's built-in blank first page is `--page 1`. Before the pack is applied you can re-emit
  into the same file freely; **after `sac apply`, applied packs are immutable
  (`SAC_APPLIED_PACK_HASH_MISMATCH`) — emit the fixed page into a new follow-up pack instead**; the
  refill semantics make that follow-up self-contained (no manual deletion of old elements).
- **Overlay onto an existing page with `--add`** (no clearing): draw the same-viewBox SVG containing
  only the new elements.
- The module exports `svgPage<n>Migration`; write it into the pack's directory with `--out`, import
  it from the pack entry, add it to `unitMigrations`, then `sac apply`. It binds the unit with
  `getPresentation(unitId)` and throws if the unit does not exist — for a brand-new deck, keep the
  create-fresh guard (see "Create A Fresh Slide Unit") in a migration that runs before it.
- Without `--page`, prints the bare facade snippet (binds `slide` + `univerAPI` from surrounding
  scope) to stdout — legacy paste mode; prefer the module emit. `--json` emits a structured envelope
  (with `warnings` — read them first: filter (shadow/blur) and clip-path on non-image elements
  degrade to a warning and the effect is dropped).
- **Embedded `<image href="data:…;base64,…">` bitmaps (or URL sources) are supported** and compile
  straight to `slide.insertImage` (zero warnings). What actually fails the compile is mask / use /
  symbol / foreignObject / textPath and similar — redraw those elements as instructed by the error.
- Compilation is deterministic, but whether your SVG looks like the target is still judged by
  `screenshot` output, not by the compile succeeding.

## Visual verification

`univer screenshot` renders the unit's real viewer output to PNG — one file per page for a slide
unit. It is a scope command: pass `--worktree "$WORKTREE_ID"` to render the worktree under review, or
it silently renders trunk (the pre-change state) instead.

```bash
UNIVERFILE=./deck.univer

univer screenshot setup --json # once, if no cached browser yet
univer screenshot "$UNIVERFILE" --worktree "$WORKTREE_ID" --unit "replace-with-slide-unitId" --out ./slide-review --json
```

`setup` only reports a browser after a real headless launch succeeds — a binary that exists but
cannot start is an error, not a "usable browser". If the pinned-Chromium download fails, partial
archives are cleaned up automatically; retry, set `UNIVER_SCREENSHOT_DOWNLOAD_BASE_URL` behind a
proxy/mirror, or point `UNIVER_SCREENSHOT_BROWSER` at an existing Chrome/Chromium executable.

For any task where fill, stroke, text color, or layout/overflow correctness matters, render and look
at the PNGs before `sac verify`/`worktree merge`. Treat a passing `sac verify` and a rendered
screenshot as both required, not either/or: `sac verify` is the repeatable structural/style-storage
gate, `screenshot` is the only surface that catches what it cannot — default styles left uncovered,
`setStrokeWidth(0)` not suppressing a stroke, and text overflowing its declared box.

- **Per-page rework budget: at most one "screenshot → fix → recheck" round per page** (i.e. at most
  two screenshots per page). Minor flaws that do not fit in the budget travel with you — do not keep
  re-screenshotting one page to fine-tune it.
- Elements positioned outside the page are not clipped — they render on the gray off-page backdrop,
  instantly visible in a screenshot.

## Reviewer subagent (the author does not accept their own work)

Per-page screenshots during generation are a coarse filter — while authoring, your attention is on
drawing and systematically misses text overlaps and occlusions. **After the whole deck is drawn and
before `worktree merge`, run one independent review pass: the reviewer is a freshly spawned
subagent, not you.**

Review rules (the subagent scans each page in this order; put them in the subagent instructions):

1. **Out of bounds**: elements beyond the page (content on the gray off-page backdrop, clipped at
   edges).
2. **Text overflowing its container** (card / color block).
3. **Text-on-text overlap**: two text bboxes intersect — almost never legitimate, every hit must be
   fixed.
4. **Occlusion**: a shape covering what it should not (a section header buried under a card, an icon
   on top of a label) — text on its own backing block is normal; covered information is the defect.
5. **Readability**: insufficient contrast; text directly on a busy pattern without a backing block.
6. **Missing key elements**: restore tasks compare against the reference image; authored tasks
   compare against the task requirements.

Review flow:

1. **Prepare**: screenshot every page into `review/`; keep every page's SVG source file on disk
   (do not delete them during generation).
2. **Dispatch in batches** of ≤5 pages, one reviewer subagent per batch (use your host's subagent
   capability; batches may run in parallel), input = the batch's `(page-NN.svg, page-NN.png)` path
   pairs (for restore tasks also pass the reference image paths). If your host has no subagent
   capability, do the same independent review pass yourself after all generation is finished —
   never interleaved with it.
3. **Self-contained subagent instructions**: you are a slide visual reviewer, find defects only, no
   beautification; scan each page by the 6 rules above in order (PNG for effect, SVG for
   coordinates); **fix hits by editing that page's SVG file directly** (back the original up
   first); mark what you cannot fix or what needs a redesign as `needs_human`; output findings JSON
   `[{page, rule, where, detail, status: fixed|needs_human}]`; do **not** touch other pages' SVGs,
   reference images, or any other file.
4. **Land the results** (main agent): for every page the reviewer changed → create a follow-up pack
   (`sac migration create page-<n>-fix …`, applied packs are immutable) and emit the fixed page
   into it (`univer compile-svg fixed.svg --page <n> --unit <unitId> --out <pack-dir>/page-<n>.ts`;
   the declarative refill needs no manual element deletion), register it, `sac apply`,
   re-screenshot to confirm; report `needs_human` items to the user honestly — do not silently drop
   them. If the re-check reveals a new hit, restore the page's backup SVG and emit that instead —
   do not fix your way downhill.

Time pressure does not cancel the review: if the budget is tight, shrink the batch to the dense
pages only — skipping the pass entirely is not an option; it is a precondition for
`worktree merge`.

## Capability boundary (do not go looking for these)

- **Charts / tables: the current runtime does not register the corresponding plugins, so these APIs
  do not exist in migrations** (FSlide has no chart/table methods) — do not call them from docs or
  intuition.
- In-page element animations, speaker notes, master/layout page editing: data layer only, no facade.
- Non-image elements have no arbitrary clipping; no mask, no blur/glow filters (outer shadow presets
  only).
- Letter-spacing is not rendered; line height / inner padding have no API (see "Text").
