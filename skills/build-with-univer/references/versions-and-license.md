# Versions and License

## Choosing versions

Never take a version from memory or from an example's lockfile. Resolve it when you build.

1. **Existing project:** read `package.json` and the lockfile. Keep the installed versions of
   `@univerjs/*`, `@univerjs-pro/*` and `@univer-cli/*` unless the user asked to upgrade.
2. **New project:** query the registry for every package you will import.

   ```bash
   npm view @univerjs/presets dist-tags
   npm view @univerjs-pro/collaboration-service dist-tags
   npm view @univer-cli/headless-univer dist-tags
   ```

   Use the `latest` tag; for `@univerjs/*` every other tag is a prerelease or nightly. Packages in
   one family do not always publish the same `latest` on the same day (server packages can lag the
   browser ones). Install the highest version that every package you import has published, and use
   it for all of them. Put every package you will import in `PKGS`; the result is the highest stable
   version all of them have published. `none` means one has no stable release yet: install that
   package from its `rc` or `beta` tag and take the rest from the highest common version.

   ```bash
   PKGS="@univerjs/presets @univerjs-pro/collaboration-service" node --input-type=module -e '
   import { execFileSync } from "node:child_process";
   const sets = process.env.PKGS.split(" ").map((p) => new Set([].concat(JSON.parse(execFileSync("npm", ["view", p, "versions", "--json"], { encoding: "utf8" }))).filter((v) => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(v))));
   console.log([...sets[0]].filter((v) => sets.every((s) => s.has(v))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop() ?? "none");'
   ```
3. **Pin exactly.** No `^` or `~` on packages in a release group. Install them in one command so
   the package manager resolves them together.
4. **Check after install.** The lockfile must contain one version per release group. A mismatch
   shows up as duplicated core instances, missing plugin registrations or Facade methods that
   do not exist. When a lagging package drags the group below a transitive dependency's range,
   transitive copies of newer versions can slip in: force one version with the package manager's
   overrides, re-check the lockfile, and report it if one version cannot be achieved rather than
   shipping a mixed tree.

## Release groups

These scopes must share one exact version inside an application:

- `@univerjs/*`
- `@univerjs-pro/*`
- `@univer-cli/*`

Independently versioned packages follow their own versions; take them from the dependency range
declared by the package that needs them: `@univerjs/icons`, `@univerjs-pro/cli-assets`,
`@univerjs-pro/doc-typst-native-binding`, `@univerjs-pro/engine-formula-rust-binding`,
`@univerjs-pro/exchange-node-binding`, `@univerjs-pro/uexcli`.

`@univerjs/preset-*` packages are in the `@univerjs/*` group even when they pull in Pro packages.
`@univerjs-labs/*` is not in any group: it has its own versions and accepts Univer peers through a
`^1.0.0-0` range.

## Binding SDK registry

`@univerjs-labs/*` is served from the Univer insider registry, not npmjs. Add one line to the
project's `.npmrc`:

```ini
@univerjs-labs:registry=https://insider-npm-registry.univer.work/
```

Reads are anonymous, and the registry also serves public npm metadata, so no other scope needs
redirecting. Use `latest` when the package has one, otherwise `rc`. Do not use `dev` builds in an
application. The registry
publishes an agent-readable guide at `https://insider-npm-registry.univer.work/llms.txt`.

## Node and tooling

Check each package's `engines` field and its README rather than assuming. The headless Web SDK,
the Server SDK's SQLite adapters, the AI SDK and the example repositories have different minimum
Node versions, and the example repositories pin a package manager. Recent package managers block dependency install
scripts until approved: `protobufjs` (and `esbuild` in Vite projects) are the usual ones. In pnpm
add `allowBuilds: { protobufjs: true }` to `pnpm-workspace.yaml`; in npm approve them with
`npm approve-scripts`. This is not a Univer fault, so approve and continue.

## License

A license is optional while building.

- Everything runs without one. Open-source Sheets and Docs behave normally.
- Pro surfaces (Slides, Boards, Bases, PDFs, advanced Sheets features) show watermarks or restrict
  some operations. Print and image export APIs can return `false`; Pro-gated writes in the AI SDK
  are rejected before any mutation is produced.
- The Server SDK packages do not check licenses. Licensing happens in the client and in headless
  runtimes.
- Do not stop to ask for a key, do not remove Pro features to avoid the watermark, and do not
  quote restriction numbers from memory. Build with no key and add one when it exists.

Wiring, once a key is available:

- **Plugin mode:** register `UniverLicensePlugin` from `@univerjs-pro/license` first, before any
  other plugin.
- **Preset mode:** pass `license` in the preset options.
- **Headless AI SDK runtime:** pass `license` to `createStandardHeadlessUniverFactory`; an empty
  string means unlicensed.
- Pass the license content, not a file path. Read it from an environment variable at build or
  startup, never commit it. Browser bundles only see variables the bundler exposes (in Vite,
  `VITE_`-prefixed or mapped with `define`; see [server-sdk.md](server-sdk.md)); an unexposed
  variable is silently empty and the app runs unlicensed.
