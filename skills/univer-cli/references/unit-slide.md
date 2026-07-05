# Slide Unit

Unit-specific reference for `slide` units. Open it when the target unit is a `slide` presentation,
before authoring shape/text migrations or slide assertions.

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

`createPresentation` takes `Partial<ISlideData>` — verified minimal: `{ id, name, defaultPageSize }`
is enough (`slideOrder`/`slides` are not required); the result is a valid 0-slide deck ready for
`appendSlide()`, not a broken/partial object. Pin the unit's id by passing it as `data.id`, not as a
separate option — `ICreateUnitOptions` (the second argument) has no id field. `getPresentation(id)`
on a missing id returns a falsy value (not a throw), so the `??` guard above is safe on first apply
and a no-op on re-apply — remember a fresh deck still starts at 0 slides, so guard the first slide
the same way rather than assuming index 0 exists.

## Slide Facade API Pocket Guide

Use these stable primitives before lookup when the task is ordinary shape/text authoring. Elements
are built with a builder chain — `newTextBox()` / `newShape()` / `newImage()` on a slide, then
position/size/style setters, then `insertShape()` / `insertImage(builder.build())` — and updated with
`slide.getElementById(id)` → `updateShape(...)`.

Default style for a new text box (SDK-defined constants, not task-specific): white solid fill, 1px
`#bcbcbc` stroke, text 16px `#111827` (near-black), left/top alignment; size defaults to 260×88 when
`setSize` is omitted.

Check these three against the page background before treating a shape/text-box task as done;
none of them error when left at their default, they just render wrong:

- **Fill**: `setNoneFill()` / `setShapeSolidFill(color[, opacity])` — the default white fill renders
  as a solid block on a dark or colored background.
- **Stroke**: removing it requires `setStrokeOpacity(0)`. `setStrokeWidth(0)` does **not** suppress
  the rendered stroke (verified: the stroke stays visible on both `newTextBox()` and `newShape()`
  elements) — do not use it as the way to hide a border.
- **Text color**: `setTextStyle({ color })` — the default near-black text is invisible on a dark
  background if no color is set.

`setText()` on the `newShape()` builder chain resets the element's width/height to the default
text-box size (260×88), overwriting an earlier `setSize()` call; the position and shape type are
unaffected. Call `setSize()` **after** `setText()` to keep the intended size. `newTextBox()` is not
affected by call order.

`setTextStyle` has no alignment field (only `color`/`fontFamily`/`fontSize`/`bold`/`italic`/
`underline`). Horizontal/vertical alignment exists at the data layer and renders correctly when
injected into the built element before inserting it:

```ts
const info = slide
  .newShape()
  .setShapeType(univerAPI.Enum.SlideShapeTypeEnum.Ellipse)
  .setText("9")
  .setSize(56, 56) // setSize after setText — see above
  .setAbsolutePosition(x, y)
  .setShapeSolidFill("#4472c4")
  .setTextStyle({ color: "#ffffff", fontSize: 20 })
  .build();
info.element.shapeData.shapeText.horizontalAlign = "center"; // "left" | "center" | "right", default "left"
info.element.shapeData.shapeText.verticalAlign = "middle"; // "top" | "middle" | "bottom", default "top"
slide.insertShape(info);
```

Shape type and gradient type enum members (e.g. the arrow family, gradient stops) are real Facade
capabilities but do not resolve well from natural-language lookup queries — a query like
`"slide gradient fill"` or `"slide arrow shape"` can return an unrelated chart symbol instead. Use
exact-symbol lookup for these instead of a task-intent query:

```bash
univer lookup "FShapeBuilder.setShapeGradientFill"
univer lookup "ShapeGradientTypeEnum"
univer lookup "ShapeTypeEnum"
```

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
  expects `stroke.width: 0` will pass even though the stroke still renders (see the pocket guide
  above) — a passing `style()` assertion is not proof that the element looks right. Prefer
  `setStrokeOpacity(0)` in the migration itself, and confirm the actual render with `screenshot`.
- Text color, font, and alignment have **no** assertion coverage at all (`style()` excludes
  `shapeText`; `text()` checks only the string). For any task where those must be correct, `sac
  verify` passing is not sufficient evidence — render and inspect the page.

## Visual verification

`univer screenshot` renders the unit's real viewer output to PNG — one file per page for a slide
unit. It is a scope command: pass `--worktree "$WORKTREE_ID"` to render the worktree under review, or
it silently renders trunk (the pre-change state) instead.

```bash
UNIVERFILE=./deck.univer

univer screenshot setup --json # once, if no cached browser yet
univer screenshot "$UNIVERFILE" --worktree "$WORKTREE_ID" --unit "replace-with-slide-unitId" --out ./slide-review --json
```

For any task where fill, stroke, text color, or layout/overflow correctness matters, render and look
at the PNGs before `sac verify`/`worktree merge`. Treat a passing `sac verify` and a rendered
screenshot as both required, not either/or: `sac verify` is the repeatable structural/style-storage
gate, `screenshot` is the only surface that catches what it cannot — default styles left uncovered,
`setStrokeWidth(0)` not suppressing a stroke, and text overflowing its declared box (silent; no
diagnostic, no assertion failure).
