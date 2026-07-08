# Doc Unit

A `doc` unit is a top-level document object inside a `.univer` file. It is selected by `unitId`; it
is not the `.univer` file path, not a paragraph range, and not the Markdown fragment you generate.
Open this reference before creating or replacing document content, especially when the desired
content is naturally represented as Markdown.

## When to use Markdown

Use the Markdown facade path when the task asks for prose, headings, lists, links, emphasis, code
blocks, or pipe tables. It is the compact authoring surface for generated document content and keeps
the public API at the facade level.

For exact API shape, query the CLI references instead of recalling signatures:

```bash
univer lookup "create doc from markdown"
univer api show FUniver.createDocument FUniver.getDocument FUniver.convertMarkdown FDocument.replaceRange
univer api show FDocument.toMarkdown FDocumentTable.toMarkdown
univer api find markdown --unit doc
```

## Markdown authoring pocket guide

In SaC migration source, create or resolve the top-level document unit by its `unitId`, convert
Markdown to an `FDocumentFragment`, then apply it through a Doc facade range:

```ts
const document =
  univerAPI.getDocument("brief") ??
  univerAPI.createDocument({ id: "brief", title: "Executive Brief" });

const fragment = univerAPI.convertMarkdown(`# Executive Brief

## Summary

Approved forecast.

| Metric | Value |
| --- | ---: |
| Revenue | 1280 |
`);

document.replaceRange({ startOffset: 0, endOffset: 0 }, fragment);
```

For an existing document, derive the replacement range from Doc facade state such as paragraph
ranges, table cell content ranges, or a previously discovered target range. Do not compute offsets
from a separate Markdown string or from package internals.

Use `document.replaceRange(range, fragment)` for multi-paragraph Markdown and tables. The text and
paragraph helpers are for narrower shapes; if a fragment shape is rejected, follow the diagnostic
and use `replaceRange`.

## Markdown export

Use Markdown export when the task asks for a Markdown representation of supported Doc content:

```ts
const markdown = document.toMarkdown();
const firstTableMarkdown = document.getTables()[0]?.toMarkdown();
```

Tables created from Markdown are native Doc tables through docs-table facade behavior. Keep table
creation and export on the facade path; do not construct `tableSource`, table ids, body markers, or
document storage fragments by hand.

## Verification

Use `docUnit(unitId, ...)` assertions for final-state text, headings, paragraphs, outline, and
cross-unit facts. For Markdown table content, assert representative document text plus any table
facade facts available in the current API reference. If the verification surface cannot express a
required visual or structural Doc fact, report that surface gap and verify the closest
target-visible behavior instead of reading `.univer` internals.
