# Binding SDK

Plain HTML/CSS/JS pages bound to live Univer Sheet data through `data-univer-*` attributes. The page
runs in a sandboxed iframe; a host application connects it to a Server SDK collaboration backend.
Labs scope: young and expected to change. Pin exact versions and re-read the package READMEs after
every upgrade.

## Packages

| Package | Role |
| --- | --- |
| `@univerjs-labs/html-view` | Parser and validator. Returns normalized HTML plus binding metadata. Runs in Node or a browser; executes nothing |
| `@univerjs-labs/html-view-renderer` | Browser-only. Root entry: `createBindingHost`, `createHtmlViewDocument`, `mountHtmlView`. `/runtime` is the in-iframe bootstrap, bundled by the `/vite` plugin (`htmlViewRuntime`) |
| `@univerjs-labs/binding-engine` | Headless engine, one instance per Sheet Unit: reads, writes, subscriptions, collaboration lifecycle |

All three share one exact version, independent of the Univer packages: at `rc` they are on their
own pre-release line and accept Univer peers through a `^1.0.0-0` range, so install the latest
Univer versions beside them. Add the `.npmrc` line and pick the tag as described in
[versions-and-license.md](versions-and-license.md). The engine also needs
`@univerjs-pro/collaboration-client`, `@univerjs-pro/collaboration-client-ui` and
`@univerjs-pro/license` (a required peer; configuring a key is optional), at the same version as your
other `@univerjs-pro/*` packages. The page runtime is bundled with Vite (an optional peer needed for
`/vite`); there is no CDN or plain-script build.

**The API differs between tags.** This file documents the `rc` tag. Builds tagged `dev` add
`renderHtmlView` at `/render`, `*ById` subscriptions, `insertRowsWithValues`, `data-univer-*-subscribe` attributes and an Inspector. Before using any of
them, read the installed package's `README.md` and `docs/` and check its `exports`; `npm view`
can print nothing for this registry, so use the install itself or fetch the metadata with `curl`.

```bash
npm install --save-exact @univerjs-labs/binding-engine@<tag> @univerjs-labs/html-view@<tag> @univerjs-labs/html-view-renderer@<tag>
```

Run generated or user-edited HTML through `parseHtmlView` from `html-view` first; it rejects
invalid references and unsupported controls, and `getHtmlViewUnitIds()` lists the declared Units.

## Architecture

- Needs a [Server SDK](server-sdk.md) collaboration backend (snapshot, changeset, WebSocket,
  session-ticket and authz routes). Create the Unit with `createUnitFromData()` on the server and
  follow `quick-start` and `permissions` there; this SDK does not provide the backend. A page opened as a plain file does nothing:
  `window.univerBinding` exists only inside a rendered view.
- The iframe never holds an engine or credentials. Calls cross a message channel to the host, which
  owns one engine per Unit.
- A UI Sheet editor (Facade UI extensions are global to a JS environment) and the headless engine
  must run in separate JS environments, for example separate pages.
- Formula results converge through the collaboration service, so other editors see them too.

## Binding syntax

Reference: `unitId:sheetId:A1`. Wrap each id in `encodeURIComponent` and escape HTML attribute
characters. Ids are case sensitive and are stable ids, not tab names. Coordinates are fixed: B7 is
row 6, column 1. No `$A$1`.

| Attribute | Direction | Behavior |
| --- | --- | --- |
| `data-univer-cell-text` | cell to element | Replaces `textContent`; `null` becomes empty. Use a dedicated leaf element |
| `data-univer-cell-model` | cell and control | Form control synced both ways; valid edits are written back |

Ranges and charts have no attribute at `rc`: subscribe from page JavaScript (below). One binding
attribute per element; no nesting inside a text binding; none on metadata, `script`, `style` or void
elements.

`cell-model` controls:

| Control | Value | Submits on |
| --- | --- | --- |
| `input` (text or default), `textarea`, single `select` | string | `change` |
| `input type="number"` | finite number | `change` |
| `input type="range"` | finite number | throttled `input` (about 100 ms), final `change` |
| `input type="checkbox"` | boolean | `change` |

Controls start disabled until data arrives. An empty number field stays a draft; it never writes
zero or clears the cell. Remote updates do not overwrite an active draft. Native `min`, `max`,
`step`, `disabled` and `readonly` are honored.

Minimal page (ids illustrative; B2 numeric, B5 a formula):

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Budget</title></head>
<body>
  <label>Income <input type="number" min="0" step="1"
    data-univer-cell-model="my-book:my-sheet:B2"></label>
  <p>Balance: <span data-univer-cell-text="my-book:my-sheet:B5">Loading...</span></p>
  <pre id="rows"></pre>
  <script>
    window.univerBinding.subscribeRange(
      { unitId: "my-book", sheetId: "my-sheet",
        range: { startRow: 1, endRow: 3, startColumn: 0, endColumn: 2 } },
      ({ value }) => { document.getElementById("rows").textContent = JSON.stringify(value); },
    ).catch(console.error);
  </script>
</body></html>
```

## `window.univerBinding`

Created before author scripts run (type `BindingEngineClient`). Every method returns a promise;
invalid references, authorization failures and failed loads reject.

| Method | Notes |
| --- | --- |
| `subscribeCell(ref, cb)` / `subscribeRange(ref, cb)` | Delivers the current state before the promise resolves, then changes. Resolves to a disposable |
| `getCellState(ref)` / `getRangeState(ref)` | One-shot reads for button handlers and validation |
| `setCellValue(ref, value)` | Scalar write; resolves when the local write is issued |
| `getCollaborationStatus(unitId)` / `subscribeCollaborationStatus(unitId, cb)` | Sync state |
| `flush()` | Submits control drafts, drains writes, waits for server acknowledgement |

References use raw (unencoded) ids and zero-based indexes:
`{ unitId, sheetId, row, col }` for a cell and
`{ unitId, sheetId, range: { startRow, endRow, startColumn, endColumn } }` for a range (inclusive).
A cell state is `{ value }`; a range state is `{ value }` holding a 2D array. `value` is a string,
number, boolean or `null`. Formulas read as their calculated result; empty and missing cells read
`null`.

Writes are scalar only: string, finite number or boolean. Strings stay literal (`"=SUM(A1)"` is
text, not a formula), `null` is rejected so a cell cannot be cleared, and a write replaces any
existing formula or rich text. Dispose subscriptions on `pagehide`; the runtime also cancels the
rest when the page closes.

## Host side

Bundle the page runtime with Vite, then create one iframe, one connection id and one host per page
load.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { htmlViewRuntime } from "@univerjs-labs/html-view-renderer/vite";
export default defineConfig({ plugins: [htmlViewRuntime()] });

// env.d.ts
declare module "virtual:html-view-runtime" { const runtime: string; export default runtime; }
```

```ts
import { BindingEngine } from "@univerjs-labs/binding-engine";
import { parseHtmlView } from "@univerjs-labs/html-view";
import { createBindingHost, createHtmlViewDocument } from "@univerjs-labs/html-view-renderer";
import runtime from "virtual:html-view-runtime";

const connectionId = crypto.randomUUID();
const iframe = document.createElement("iframe");
iframe.setAttribute("sandbox", "allow-scripts");   // never add allow-same-origin
iframe.referrerPolicy = "no-referrer";
let host: ReturnType<typeof createBindingHost> | undefined;

window.addEventListener("message", (event) => {
  if (event.source !== iframe.contentWindow || event.origin !== "null" ||
      event.data?.type !== "univer-html-view-connect" ||
      event.data.token !== connectionId || !event.ports[0]) return;
  if (host) { event.ports[0].close(); return; }
  host = createBindingHost(event.ports[0], {
    async loadEngine(unitId, signal) {
      await authorizeUnit(unitId, signal);          // yours: application access check
      signal.throwIfAborted();
      const engine = new BindingEngine({ unitId, collaborationClientConfig });
      signal.addEventListener("abort", () => engine.dispose(), { once: true });
      try { await engine.load(); signal.throwIfAborted(); return engine; }
      catch (e) { engine.dispose(); throw e; }      // release partial engines
    },
    onError: (message) => console.error(message),
  });
});

iframe.srcdoc = createHtmlViewDocument({ template: parseHtmlView(html), runtime, connectionId });
document.body.append(iframe);
```

`collaborationClientConfig` holds the Server SDK URLs (`socketService:
BrowserCollaborationSocketService` from `@univerjs-pro/collaboration-client-ui`, `snapshotServerUrl`,
`collabSubmitChangesetUrl`, `collabWebSocketUrl`, `wsSessionTicketUrl`, `authzUrl`), usually under
`/universer-api` through a same-origin proxy. Your app must establish the user session before
loading. The host caches one engine per Unit and disposes owned engines when the port closes.

When leaving, wait for the handshake and `await host.flush()`; on failure keep the page open and let
the user retry. `host.hasPendingChanges()` with the collaboration status drives navigation prompts.
`host.dispose()` releases connections and never saves implicitly. Read the installed package's
README and `docs/` for the exact host surface, including readiness and pending-change tracking.

## Security boundary

| Layer | Mechanism |
| --- | --- |
| Isolation | iframe `sandbox="allow-scripts"` without same-origin: no access to host DOM, cookies, credentials or Univer instances |
| Network | CSP limits external origins to `policy.allowedOrigins`; this grants no workbook access |
| Credentials | Never enter the iframe; the page cannot replace collaboration config or issue arbitrary commands |

- Declared references are not an access list. Page JavaScript can request Units it never declared,
  so authorize every Unit twice: in `loadEngine` on the host and in the Server SDK on every read
  and write.
- Known gap: the page can navigate itself, so CSP is not an offline or exfiltration guarantee. Treat
  AI-generated or user-authored HTML as untrusted, and keep `allowedOrigins` minimal and exact.
- Never loosen the sandbox to fix a load error. Check IDs, cell types, session, routes and CSP console errors.

## Charts

Draw charts with inline SVG or canvas fed by `subscribeRange`. External scripts and requests are
blocked by the page CSP unless their origin is in `allowedOrigins`; whether a given CDN chart
library loads has not been verified, so test it or bundle the library into the page.

- Coordinates are fixed: references do not follow row or column inserts and deletes. No named ranges.
- Writes are scalar: no formulas, no clearing. Read-then-write is not atomic across collaborators.
- No `select multiple`; only the input types listed above. No row insertion API at `rc`.
- One engine per Unit per host; each Sheet UI editor needs its own JS environment.
- Needs a bundler (Vite) for the page runtime; there is no plain-script or CDN build.
- Labs scope: APIs and docs move quickly. Do not copy API shapes from memory.

## Newer builds

Builds tagged `dev` add a one-call `renderHtmlView` host
(`/render`), `*ById` subscriptions with `data-univer-cell-subscribe` and `data-univer-range-subscribe`
attributes, `insertRowsWithValues`, and a built-in binding Inspector. They are not in the `rc` tag.
Do not use them unless the installed package's README lists them; if a feature you need is missing,
say so and write it against the lower-level API above.

## AI-generated views

Generation is an application concern. Give the model the real Unit and Sheet ids, a header row and
sample values, and the rules in this file; validate output with `parseHtmlView` before saving and
open it in a test view against a scratch Unit. Call the LLM from your server; the key stays
server-side.

## Reference

The installed packages are the whole reference: each ships a `README.md` and a `docs/` directory
(architecture, page API, host wiring). Read them from `node_modules` after install. Their links
point at a source repository that is not available to you; do not look for it or for example code
there. Build the backend from the Server SDK examples ([server-sdk.md](server-sdk.md)): it needs
real authentication and authorization, not a fixed user or an always-allow permission query.
