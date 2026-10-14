# Server SDK

Self-hosted real-time collaboration and Office import/export. Node.js packages you assemble inside
your own backend, not a standalone server. Your app owns users, ACLs, tenants, storage and
deployment; the SDK owns OT, revisions, snapshots, sessions and rooms.

Sources: `https://docs.univer.ai/server/collaboration/overview.md` and its sibling pages,
`dream-num/univer-collaboration-examples` (`main`), and each package's npm README.

## Layers

```text
Transport (HTTP/WS) -> Endpoint (client protocol, sessions, rooms) -> Service (lifecycle, OT) -> IDatabaseAdapter
```

| Package | Role |
| --- | --- |
| `@univerjs-pro/collaboration-transport-node` | `createNodeTransport()`; app-level middleware, `attach(httpServer)` |
| `@univerjs-pro/collaboration-endpoint` | `UniverCollabEndpoint`: protocol, sessions, rooms, presence |
| `@univerjs-pro/collaboration-service` | `UniverCollabService`, `CollabError`: Unit lifecycle, OT, revision CAS |
| `@univerjs-pro/collaboration-database-memory` / `-sqlite` | Built-in adapters: memory for tests and demos, SQLite for local and small single-node use |
| `@univerjs-pro/collaboration-history*`, `-comment*`, `-worktree*` | Optional services, each with its own endpoint, adapter and middleware |
| `@univerjs-pro/exchange-node` | Office import/export with no collaboration dependency; see [Office import/export](#office-importexport) |

A custom `IDatabaseAdapter` (PostgreSQL, MySQL, ...) must provide: atomic unit creation, revision
CAS on commit, submission idempotency keyed by `(unitID, sid, reqId)`, and all-or-nothing batch
delete/recover. A plain CRUD mapping breaks OT. See `/server/collaboration/database-adapters.md` and
the `database-adapter` example, which ships memory, libsql and PostgreSQL (`pg`) adapters under
`server/custom-database-adapter/`. Start a Postgres backend from that adapter, in its own schema
separate from your application tables.

## Minimal server

Copied from `examples/quick-start/server/main.ts`. `unitData` is the `IWorkbookData` literal from the
example (one sheet, `id: UNIT_ID`, `rev: 1`).

```ts
import { createServer } from "node:http";
import express from "express";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const transport = createNodeTransport();

transport.use(async (context, next) => {
  context.userID = USER_ID; // demo: fixed user
  await next();
});
endpoint.use("connect", async (context, next) => {
  context.member.name = context.session.userID;
  await next();
});
transport.register(endpoint);

await service.createUnitFromData({ type: UniverType.UNIVER_SHEET, data: unitData }, { userID: USER_ID });

const app = express();
app.post("/universer-api/authz/-/object/-/batch_allowed", express.json(), (request, response) => {
  // demo: allow everything
  response.json({
    error: { code: ErrorCode.OK, message: "" },
    objectActions: request.body.requests.map((item: any) => ({
      unitID: item.unitID,
      objectID: item.objectID,
      actions: item.actions.map((action: unknown) => ({ action, allowed: true })),
    })),
  });
});

const server = createServer(app);
transport.attach(server); // share the port with your existing Express/HTTP app
server.listen(3010);
```

To add collaboration to an existing app, keep its `createServer(app)` and call `transport.attach()`
on that server. "Create document" is your own API: authenticate, write the product record and ACL,
then call `service.createUnitFromData()` / `createUnitFromSnapshot()` with a server-generated unit
ID. The collaboration protocol only opens existing units.

## Authorization: install all three hooks

A frontend read-only flag is a hint, not a boundary. Install all of these:

| Hook | Guards |
| --- | --- |
| `service.use("readUnitData", ...)` | HTTP snapshot, block and changeset reads |
| `endpoint.use("joinUnit", ...)` | Entering the realtime room (does not cover HTTP reads) |
| `service.use("submitChangeset", ...)` | Edits |

```ts
import { CollabError } from "@univerjs-pro/collaboration-service";

service.use("submitChangeset", async (context, next) => {
  if (!(await acl.canEdit(context.userID, context.request.changeset.unitID))) {
    throw new CollabError("PERMISSION_DENIED", "Unit is read-only");
  }
  await next();
});
```

Also guard `createUnit`, `deleteUnits`, `recoverUnits` the same way, and repeat the rules on each
enabled History, Comment and Worktree service: core-service middleware does not cover them.

- Set identity in `transport.use()` from your cookie, session or token. On failure set status 401
  and end the response without `next()`. Never trust a client-supplied userID, memberID or revision.
- `userID` is your stable business key and is recorded as the author. `memberID` is per-WebSocket
  and changes on reconnect.
- `applyChangeset` and `commitChangeset` middleware re-run on revision CAS retry: keep them
  side-effect-free (no emails, charges, external writes).
- Post-commit side effects go in `service.on("changesetCommitted" | "unitCreated" | "unitsDeleted" |
  "unitsRecovered", ...)`. Listeners are in-process, awaited, and failures do not roll back the commit.

## Client wiring

This is the browser client, even when the backend runs in Node. Start with the imports, locales
and core registrations in [Web SDK's browser plugin setup](web-sdk.md#browser-plugin-setup-sheets),
then add the collaboration packages from `examples/quick-start/web/main.ts`. That example uses a
preset; for a new plugin-mode client, use the following initialization instead. Do not create
a blank workbook from the base example; load the backend's existing Unit after all registrations.

```ts
import { IAuthzIoService, IMentionIOService, IUndoRedoService } from "@univerjs/core";
import CollaborationClientEnUS from "@univerjs-pro/collaboration-client/locale/en-US";
import CollaborationClientUIEnUS from "@univerjs-pro/collaboration-client-ui/locale/en-US";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";
import "@univerjs-pro/collaboration-client/facade";

const baseURL = `${location.protocol === "https:" ? "https" : "http"}://${location.host}/universer-api`;
const wsProtocol = location.protocol === "https:" ? "wss" : "ws";

const univer = new Univer({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      DesignEnUS, UIEnUS, DocsUIEnUS, SheetsEnUS, SheetsUIEnUS,
      SheetsFormulaUIEnUS, SheetsNumfmtUIEnUS,
      CollaborationClientEnUS, CollaborationClientUIEnUS,
    ),
  },
  override: [[IUndoRedoService, null], [IAuthzIoService, null], [IMentionIOService, null]],
});
univer.registerPlugin(UniverLicensePlugin, { license: import.meta.env.UNIVER_LICENSE || undefined });
univer.registerPlugin(UniverRenderEnginePlugin);
univer.registerPlugin(UniverFormulaEnginePlugin);
univer.registerPlugin(UniverUIPlugin, { container: "app" });
univer.registerPlugin(UniverDocsPlugin);
univer.registerPlugin(UniverDocsUIPlugin);
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsUIPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);
univer.registerPlugin(UniverSheetsFormulaUIPlugin);
univer.registerPlugin(UniverSheetsNumfmtPlugin);
univer.registerPlugin(UniverSheetsNumfmtUIPlugin);
univer.registerPlugin(UniverCollaborationPlugin);
univer.registerPlugin(UniverCollaborationClientPlugin, {
  socketService: BrowserCollaborationSocketService,
  authzUrl: `${baseURL}/authz`,
  snapshotServerUrl: `${baseURL}/snapshot`,
  collabSubmitChangesetUrl: `${baseURL}/comb`,
  collabWebSocketUrl: `${wsProtocol}://${location.host}/universer-api/comb/connect`,
  wsSessionTicketUrl: `${baseURL}/user/session-ticket`,
});
univer.registerPlugin(UniverCollaborationClientUIPlugin);
const univerAPI = FUniver.newAPI(univer);
```

- The three dependency overrides replace what `createUniver({ collaboration: true })` sets up.
  That flag belongs to the preset helper; it is not an option on `new Univer`. Keep these overrides
  and register the license first. Existing preset clients can retain their initialization.
- Vite only exposes `VITE_`-prefixed variables to browser code. The examples map the key with
  `define: { "import.meta.env.UNIVER_LICENSE": JSON.stringify(process.env.UNIVER_LICENSE ?? "") }` in
  `vite.config.ts`; otherwise name the variable `VITE_UNIVER_LICENSE`. An unmapped variable is silently
  `undefined` and the app runs unlicensed.
- Keep the core browser plugins' CSS and locales as well as the collaboration imports above.
  The page needs `<div id="app">` with a real height.
- Preset alternative: `UniverSheetsCollaborationPreset({ universerEndpoint: <your backend base URL>,
  univerContainerId: "app" })` from `@univerjs/preset-sheets-collaboration` (Docs has a matching
  preset). It only registers browser plugins; the server routes are still yours.
- Browsers cannot set an `Authorization` header on a WebSocket. Identity reaches the realtime
  session through the one-time session ticket: an authenticated HTTP request to `wsSessionTicketUrl`
  returns an opaque ticket that the WebSocket open consumes. Authenticate that HTTP request with a
  cookie-based session (or whatever `transport.use()` reads) and include credentials; the ticket
  carries no user fields. See `/server/collaboration/identity-and-authorization.md`.
- Open a document: `import "@univerjs-pro/collaboration-client/facade"`, then
  `await univerAPI.getCollaboration().loadSheetAsync(unitID)`. Use the unit ID your backend
  returned; do not create a new blank document on each visit.
- The browser calls an authz batch route (`POST .../authz/-/object/-/batch_allowed`). The Endpoint
  does not serve it: implement it in your app, backed by the same ACL as the middleware above.

## Office import/export

`@univerjs-pro/exchange-node` runs in plain Node and needs no license or collaboration backend.
It ships a native binding for a fixed platform list and declares no `engines`; take the Node
requirement from the example's `package.json`.

- Plain documents: `importBuffer(buffer, { type, format, fileName })` returns workbook data you
  store yourself; `exportToBuffer(data, { type, format })` returns the file bytes. `fileName` is
  required on import. `ExchangeFormat` selects xlsx, csv and the other formats.
- Collaborative Units: `importBufferToSnapshot(...)` yields `{ snapshot, sheetBlocks }` for
  `service.createUnitFromSnapshot(...)`. To export a live Unit, read it with
  `service.getUnitLoadDataWithBlocks(...)`, materialize it with `new UnitSnapshotMaterializer()`
  (from `collaboration-service`), then call `exportSnapshotToBuffer(snapshot, options)`.
- Numeric cells come back as a string value with a numeric type marker (`{ v: "120", t: 2 }`,
  where `2` is `CellValueType.NUMBER`), not a JS number. Assert on the type marker, not `typeof`.
- Bound upload size, keep files out of memory-only stores in production, and read
  `examples/exchange/server/exchange.ts` for the full routes.

## Operational rules

- Realtime sessions and broadcasts live in one process. Behind multiple nodes, route tickets,
  WebSockets and submissions by consistent hash on unitID (see `multi-node`). Committed data stays
  consistent through the adapter; misrouted broadcasts can be missed.
- Dispose in reverse assembly order: `await transport.dispose()` (also disposes registered
  endpoints), then `service.dispose()`, then `database.dispose()`. Handle SIGINT/SIGTERM.
- On restart with a persistent adapter, create the startup unit only on `UNIT_NOT_FOUND`; never overwrite.
- SQLite (single-node, small scale) pulls in a native dependency, and the docs warn that the SQLite
  examples compile native modules at install: keep `node-gyp`, Python and a C/C++ toolchain
  available. Beyond that scale use a contract-tested custom adapter.
- Put tenant or user context in `context.customData` in transport middleware; later hooks and the
  adapter reuse it, and it is never persisted or sent to clients. Keeping business tables strongly
  consistent with collaboration data requires doing the write inside the adapter's transaction.
- A license is read only by the browser (`UniverLicensePlugin`); the server needs none. See
  [versions-and-license.md](versions-and-license.md).
- Copy the example's `package.json` for the package set; check its `engines` for Node and pnpm.

## Examples

Repo: `https://github.com/dream-num/univer-collaboration-examples`. Each has `server/main.ts` and
`web/main.ts`; read those two files.

| Example | Shows |
| --- | --- |
| `quick-start` | Recommended starter: memory adapter, fixed user, fixed sheet, minimal path |
| `database-adapter` | SQLite persistence, restart recovery, custom `IDatabaseAdapter` implementations |
| `all-unit` | Sheet, Doc, Slide, Board and Base units, sidebar switching, SQLite |
| `permissions` | Cookie identity, per-role read/JOIN/submit checks (editor, viewer, no access) |
| `object-permissions` | Worksheet and range protection with an app-owned ACL |
| `history` | Version history service, endpoint and browser entry |
| `comments` | Thread Comment service; endpoint reuses the main endpoint's rooms via `roomHost` |
| `worktree` | Draft, ready, reopen and merge lifecycle |
| `exchange` | Office import/export with `exchange-node` (file store is in-memory, not production) |
| `multi-node` | Docker Compose, Nginx consistent hashing by unitID, two nodes |

Run: `pnpm install --frozen-lockfile && pnpm example:<name>` from the repo root. It builds, then
starts (no hot reload; rerun after edits). Open `http://127.0.0.1:3010/?unit=<id>&type=2`; the
unit ID is in each example's README (`quick-start`: `quick-start-sheet`), and `permissions`,
`object-permissions`, `all-unit` and `multi-node` open at `http://127.0.0.1:3010/`.
`multi-node` needs Docker Compose. Port busy: set `PORT`. `UNIVER_LICENSE` is optional; set it before
the build (embedded into the browser bundle).

## Replace the demo shortcuts

| Demo shortcut | Replace with |
| --- | --- |
| Fixed `userID` in `transport.use()` | Your authentication mapped to a stable user ID |
| Authz route that always allows | Your ACL, consistent with `readUnitData`, `joinUnit`, `submitChangeset` |
| `MemoryDatabaseAdapter` | SQLite or a custom adapter that passes the contract |
| Fixed unit created at startup | App create API calling `createUnitFromData()` after ACL and record creation |
| No middleware on History, Comment, Worktree | Separate read and write policy on each enabled service |
