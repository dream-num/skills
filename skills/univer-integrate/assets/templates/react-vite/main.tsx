import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';

import '@univerjs/preset-sheets-core/lib/index.css';

function UniverSheet() {
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

    univerAPI.createWorkbook({
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

    return () => univer.dispose();
  }, []);

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
}

createRoot(document.getElementById('root')!).render(<UniverSheet />);
