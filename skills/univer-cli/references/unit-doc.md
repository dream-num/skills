# Doc Unit

A `doc` unit is a top-level document object inside a `.univer` file. It is selected by `unitId`; it
is not the `.univer` file path, not a paragraph range, and not the Markdown fragment you generate.
Open this reference before creating, editing, exporting, or verifying document content through Doc
facade APIs.

## Facade boundary

Use Doc facade APIs for placement, replacement, export, verification, and any Doc-native behavior.
Do not construct document storage bodies, table sources, body markers, or resource ids by hand.

## Markdown shortcut

Markdown is an optional readable shortcut when the target content is naturally expressed as semantic
document content: prose, headings, lists, links, code blocks, or simple tables. It is not the full
Doc model. Use Doc-native facade APIs directly for precise edits, styling, layout, rich objects, or
unsupported Markdown features.

Minimal shape:

```ts
const fragment = univerAPI.convertMarkdown(markdown);
document.replaceRange(range, fragment);
```

For exact API shape, query the CLI references:

```bash
univer lookup "create doc from markdown"
univer api show FUniver.createDocument FUniver.getDocument FUniver.convertMarkdown FDocument.replaceRange
univer api show FDocument.toMarkdown FDocumentTable.toMarkdown
univer api find markdown --unit doc
```

For an existing document, derive the replacement range from Doc facade state such as paragraph
ranges, table cell content ranges, or a previously discovered target range. Do not compute offsets
from a separate Markdown string or from package internals.

Use `document.replaceRange(range, fragment)` for multi-paragraph Markdown and tables. The text and
paragraph helpers are for narrower shapes; if a fragment shape is rejected, follow the diagnostic
and use `replaceRange`.

Use Markdown export as an agent-readable content view when the task asks for supported Doc content in
Markdown. Treat it as a content view, not a full-fidelity Doc snapshot:

```ts
const markdown = document.toMarkdown();
const firstTableMarkdown = document.getTables()[0]?.toMarkdown();
```

## Verification

Use `docUnit(unitId, ...)` assertions for final-state text, headings, paragraphs, outline, and
cross-unit facts. For tables, assert representative document text plus any table facade facts
available in the current API reference. If the verification surface cannot express a required visual
or structural Doc fact, report that surface gap and verify the closest target-visible behavior
instead of reading `.univer` internals.
