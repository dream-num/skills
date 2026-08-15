# License Guide

`@univerjs-pro/license` manages Pro license state. In the browser main thread it registers watermark rendering for Sheets, Docs, Slides, and Bases when the license is not valid for the current feature and build time. Keep license material outside source control.

## Configuration

The current input has one field:

```ts
interface IUniverLicenseInputConfig {
  license?: string;
}
```

Register the configured license immediately after constructing `Univer` and before every other Pro plugin:

```ts
import { UniverLicensePlugin } from '@univerjs-pro/license';

const univer = new Univer({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
});

univer.registerPlugin(UniverLicensePlugin, { license: clientLicense });
```

This order is functional, not cosmetic. A Pro plugin can declare `UniverLicensePlugin` as a dependency. If that dependent runs first, Univer may auto-register the dependency with empty defaults, and the later configured registration will be a duplicate.

## Preset Mode

Pass the license to the Advanced preset:

```ts
UniverSheetsAdvancedPreset({
  license: clientLicense,
  universerEndpoint,
});
```

The preset owns `UniverLicensePlugin`; do not also register it manually.

## Browser worker

`WORKER_INIT_LICENSE` is the query-parameter key `worker_init_ls_key`. It is **not** a license value.

In manual Plugin Mode, encode the license into the worker URL:

```ts
import { WORKER_INIT_LICENSE } from '@univerjs-pro/license';

const workerURL = `./worker.js?${WORKER_INIT_LICENSE}=${encodeURIComponent(clientLicense)}`;
```

Then register the plugin without a license argument inside the browser worker. The plugin reads the query parameter during worker initialization:

```ts
import { UniverLicensePlugin } from '@univerjs-pro/license';

workerUniver.registerPlugin(UniverLicensePlugin);
```

When using preset workers, pass the same license explicitly to the worker preset instead:

```ts
UniverSheetsAdvancedWorkerPreset({ license: clientLicense });
```

See `pro-features-guide.md` for the complete main-thread and worker preset composition.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Watermark remains | Confirm that the browser received a current license string before Pro plugins registered. |
| Worker-only feature fails | Confirm either the encoded query parameter in manual mode or the worker-preset license in preset mode. |
| Duplicate plugin error | Move the explicit license registration before all Pro dependents; do not combine preset and manual ownership. |
| Entitlement behavior differs across features | Confirm exact version parity across all `@univerjs/*`, `@univerjs-pro/*`, and preset packages. |

Server deployment paths, license-file names, trial terms, endpoints, and entitlements are deployment- and contract-specific. Do not invent them from the frontend package; use the matching Universer deployment documentation and license agreement.
