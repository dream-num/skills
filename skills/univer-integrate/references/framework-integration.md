# Framework Integration

Univer owns imperative runtime resources. Every framework integration needs one sized container, one initialization point, and deterministic disposal.

## React

Create Univer in an effect after the container exists and dispose it from the same effect:

```tsx
import { useEffect, useRef } from 'react';

import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';

import '@univerjs/preset-sheets-core/lib/index.css';

export function UniverSheet() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({ container: containerRef.current }),
      ],
    });

    univerAPI.createWorkbook({});
    return () => univer.dispose();
  }, []);

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
}
```

Do not create the Univer instance during render. In React Strict Mode, effect cleanup makes development remounts safe. The complete project is in `../assets/templates/react-vite/` relative to this reference.

## Vue 3

Create Univer in `onMounted` and dispose it in `onUnmounted`. Register `UniverVue3AdapterPlugin` when Univer UI needs to render Vue components:

```ts
import type { Univer } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverVue3AdapterPlugin } from '@univerjs/ui-adapter-vue3';
import { createApp, onMounted, onUnmounted, ref } from 'vue';

import '@univerjs/preset-sheets-core/lib/index.css';

const App = {
  setup() {
    const container = ref<HTMLDivElement | null>(null);
    let univer: Univer | null = null;

    onMounted(() => {
      if (!container.value) return;

      const result = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
        },
        theme: defaultTheme,
        presets: [UniverSheetsCorePreset({ container: container.value })],
        plugins: [UniverVue3AdapterPlugin],
      });

      univer = result.univer;
      result.univerAPI.createWorkbook({});
    });

    onUnmounted(() => univer?.dispose());
    return { container };
  },
  template: '<div ref="container" style="height: 100vh; width: 100%"></div>',
};

createApp(App).mount('#app');
```

The complete project is in `../assets/templates/vue3-vite/`.

## Plain HTML

Use the UMD template in `../assets/templates/plain-html/`. UMD script order matters: runtime dependencies, Univer packages, locale bundles, plugins, Facade bundles, then application initialization.

Pin every CDN URL to the same Univer version. A plain `<script>` setup is useful for a proof of concept; use a bundler when the application needs tree-shaking, TypeScript declarations, or worker modules.

## Web Component hosts

`@univerjs/ui-adapter-web-component` adapts Univer UI components registered by plugins. Import `UniverWebComponentAdapterPlugin` from that package and add it to the `plugins` array of the application's existing `createUniver` configuration.

It does not replace the editor container or lifecycle contract. Size the host element and dispose Univer when the custom element disconnects permanently.

## iframe embedding

Run Univer as an ordinary application inside the iframe and define a narrow message protocol:

```ts
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://host.example.com') return;
  if (event.data?.type !== 'load-workbook') return;

  univerAPI.createWorkbook(event.data.snapshot);
});
```

Validate `origin`, message shape, permissions, and snapshot size. Do not accept arbitrary command ids or URLs from `postMessage`.

## Node.js

Use `@univerjs/preset-sheets-node-core` and omit browser UI, CSS, DOM adapters, and render-only features. See the `univer-node-backend` skill and the copy-ready template in `../assets/templates/node/`.

## Shared lifecycle rules

- Keep all `@univerjs/*` packages on one exact version.
- Mount into an element with non-zero width and height.
- Retain and dispose event/RxJS subscriptions owned by the host framework.
- Call `univer.dispose()` exactly once when the editor owner is destroyed.
- Do not reuse Facade handles after their unit or Univer instance is disposed.
