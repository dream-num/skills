# Worker Setup

Use a worker when formula calculation measurably blocks the main thread. The worker must register a worker counterpart for every main-thread preset that participates in RPC.

## Browser preset

`main.ts`:

```ts
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';

import '@univerjs/preset-sheets-core/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
  },
  theme: defaultTheme,
  presets: [
    UniverSheetsCorePreset({
      container: 'app',
      workerURL: new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    }),
  ],
});

univerAPI.createWorkbook({});
```

`worker.ts`:

```ts
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';

createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
  },
  presets: [UniverSheetsCoreWorkerPreset()],
});
```

Vite, webpack, and other bundlers may impose their own worker URL conventions. The `new URL(..., import.meta.url)` pattern is supported by Vite.

## Feature worker presets

Some features export a `/worker` preset. Register matching main and worker presets together. For example, `UniverSheetsFilterPreset()` on the main thread pairs with `UniverSheetsFilterWorkerPreset()` in the worker.

Do not guess that every feature has a worker entry. Inspect the installed package `exports` field before adding one.

## No-worker browser mode

Omit `workerURL`. `UniverSheetsCorePreset()` then runs the formula engine on the main thread. This is the smallest setup and should remain the default until workload measurements justify a worker.

## Node preset

`@univerjs/preset-sheets-node-core` accepts an optional compiled child-process entry. Convert the module URL to a platform-correct filesystem path:

```ts
import { fileURLToPath } from 'node:url';

const workerSrc = fileURLToPath(new URL('./formula-worker.js', import.meta.url));
const preset = UniverSheetsNodeCorePreset({ workerSrc });
```

The worker entry must initialize the matching Node worker/RPC plugins and must exist as runnable JavaScript at runtime. Use the inline Node preset when a separate compiled worker is not already part of the deployment pipeline.

## Cleanup and troubleshooting

- `univer.dispose()` disposes the main-thread RPC plugin and an internally owned browser worker.
- If the application supplies a `Worker` instance, verify ownership and termination behavior in the installed `@univerjs/rpc` version.
- A worker that loads a different Univer version can fail during protocol or command registration. Pin one exact version in both bundles.
- Missing worker-side presets appear as unhandled remote commands or formulas that never complete.
- CSP must allow the generated worker URL.

The removed `WebWorkerEngine` recipe is not part of the current RPC API.
