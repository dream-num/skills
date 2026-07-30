# Integrate Cowork in a browser host

Close the dependency, network, build, and runtime contracts described here whenever Cowork runs in
a real web host. Read [cowork-ui.md](cowork-ui.md) for API and component boundaries and
[composition.md](composition.md#connect-cowork-to-gateway) for controller composition.

## Contents

- Treat the installed artifact as authoritative
- Browser and Gateway topology
- React and Vite build
- Controller, refresh, and Viewer lifecycle
- Non-React hosts
- Browser runtime acceptance
- Persistent delivery

## Treat the installed artifact as authoritative

Pin the exact `@univerjs-pro/cowork` version, its complete `peerDependencies` object, every resolved
peer version, and the lockfile. Then inspect:

- `package.json#exports` for public entrypoints used by the host;
- `.d.ts` files for container, controller, content surface, Viewer request, and lifecycle contracts;
- the published Viewer runtime for the entries and dynamic chunks the bundler must produce.

Upgrades may change these contracts. Repeat artifact inspection and a real browser smoke after each
upgrade instead of carrying forward assumptions from an older release.

## Browser and Gateway topology

`127.0.0.1` in a browser always addresses the browser's machine. Never give the browser a loopback
origin owned by a daemon in a container or another machine. Prefer a same-origin proxy in the
existing web host:

```text
browser
  -> https://app.example/gateway/*
  -> host HTTP + WebSocket proxy
  -> Gateway origin returned by daemon status --json
  -> Univerfile target
```

Connection contract:

1. Start the daemon that owns the target Univerfile and read its upstream origin from the installed
   version's `daemon status --json`.
2. Expose `/gateway` from the host and proxy ordinary HTTP plus WebSocket Upgrade.
3. Strip `/gateway` before forwarding so the upstream receives its native routes.
4. Pass this browser-reachable origin to Cowork:

```ts
const origin = `${window.location.origin.replace(/\/$/, "")}/gateway`;
```

5. Assign application, proxy, and daemon lifecycles to an explicit host process or service manager.

A directly browser-reachable Gateway may be used without the proxy, but verify HTTP, WebSocket,
TLS, and cross-origin behavior from a real browser. Continue to treat a CLI Univerfile Link as an
opaque target; the browser proxy never parses the Link or derives a daemon-local path.

## React and Vite build

React hosts use `@univerjs-pro/cowork/react` and `@univerjs-pro/cowork/viewer/react`. Run the
application's standard build first, then inspect the release output for the files required by the
installed Viewer runtime.

The React Viewer in `@univerjs-pro/cowork@0.1.0` loads a sibling `./viewer.js` at browser runtime.
For that version, add a Vite library build after the application build and emit the public Viewer
entry into the same `dist/assets` directory:

```ts
// vite.viewer.config.ts
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const coworkViewerEntry = createRequire(import.meta.url).resolve(
  "@univerjs-pro/cowork/viewer",
);

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    target: "esnext",
    outDir: resolve(appRoot, "dist", "assets"),
    emptyOutDir: false,
    lib: { entry: coworkViewerEntry, formats: ["es"] },
    rollupOptions: {
      output: {
        entryFileNames: "viewer.js",
        chunkFileNames: "viewer-[name]-[hash].js",
        assetFileNames: "viewer-[name]-[hash][extname]",
      },
    },
  },
});
```

Corresponding script:

```json
{
  "scripts": {
    "build": "vite build && vite build --config vite.viewer.config.ts"
  }
}
```

At minimum, assert that `dist/assets/viewer.js` exists and load every Viewer chunk from a clean
static server. This configuration comes from the pinned public OpenWork integration and applies
only while the installed artifact declares the same runtime contract. When a newer version's
standard application build produces the complete Viewer output, remove the extra build rather than
retaining two mechanisms.

## Controller, refresh, and Viewer lifecycle

The data source and controller belong to a page or container session, not to one render. A React
host creates them once at a stable component boundary or with `useMemo`, updates host state when
readback changes, and disposes them only when the actual container changes or the page unmounts.

When the host initiates a CLI, Gateway, or Cowork action, await the write, call
`controller.refresh()` explicitly, and read the target content back. Lifecycle subscriptions detect
changes initiated outside the host; they do not replace completion confirmation for known writes.
Claim real-time refresh only after a real Gateway event test passes. When the installed version
exports a transport factory, connect it to the same-origin lifecycle endpoint without copying the
private Cowork protocol.

Keep one current Viewer when the request changes. Serialize disposal of the old handle and readiness
of the new Viewer so two Viewers never compete for one DOM container. Keep the React wrapper's
`request` and `reloadKey` stable and explainable. If the product flow needs only trunk content and
review actions, do not force a scope change for a preview that does not exist. If it needs worktree
or merge preview, accept the real Viewer in that exact scope.

## Non-React hosts

Vue, Svelte, Web Component, and native-page hosts use `@univerjs-pro/cowork`,
`@univerjs-pro/cowork/gateway`, and `@univerjs-pro/cowork/viewer` directly. Map controller snapshots
into framework state and mount content through the imperative Viewer; do not install the React
adapter.

These hosts follow the same Gateway proxy and Viewer artifact contracts. Framework components
serialize asynchronous Viewer replacement and release the previous Viewer, subscriptions, and
controller when the scope changes or the component unmounts.

## Browser runtime acceptance

Use a real target in a production build or equivalent release preview and verify:

1. The controller snapshot reads real Unit and trunk/worktree state.
2. The content surface generates a Viewer request for the user-selected scope.
3. The Viewer reports ready and displays real Sheet, Doc, Slide, or Base content.
4. A CLI or model-read API proves that key values and page content come from the same target.
5. Browser network records contain only reachable host/Gateway origins, including same-origin
   Gateway HTTP and at least one WebSocket connection.
6. Every Viewer entry, chunk, font, and style loads successfully, with no unhandled console error,
   404, or cross-origin failure.
7. Switching trunk/worktree or another Unit updates content without retaining the old Viewer.
8. Page unmount releases the Viewer, subscriptions, and controller.

Screenshots prove appearance; snapshots and CLI readback prove data. Both evidence classes identify
the current commit, lockfile, target, unitId, and worktreeId.

## Persistent delivery

When the user requests an accessible UI, deliver more than one development-server process. The
repository includes source, lockfile, build configuration, startup instructions, and reproduction
commands. A process manager or deployment platform owns the application, proxy, daemon, and
persistent `UNIVER_HOME`. After the builder agent exits, probe the external entry again and complete
one snapshot, Viewer-ready event, and data readback.
