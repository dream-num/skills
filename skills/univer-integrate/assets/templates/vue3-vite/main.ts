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
        presets: [
          UniverSheetsCorePreset({ container: container.value }),
        ],
        plugins: [UniverVue3AdapterPlugin],
      });

      univer = result.univer;
      result.univerAPI.createWorkbook({
        id: 'workbook-1',
        name: 'Demo',
        sheetOrder: ['sheet-1'],
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            rowCount: 100,
            columnCount: 20,
          },
        },
      });
    });

    onUnmounted(() => univer?.dispose());

    return { container };
  },
  template: '<div ref="container" style="height: 100vh; width: 100%"></div>',
};

createApp(App).mount('#app');
