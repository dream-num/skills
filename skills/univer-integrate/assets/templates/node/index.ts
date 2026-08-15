import { UniverSheetsNodeCorePreset } from '@univerjs/preset-sheets-node-core';
import UniverPresetSheetsNodeCoreEnUS from '@univerjs/preset-sheets-node-core/locales/en-US';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsNodeCoreEnUS),
  },
  presets: [UniverSheetsNodeCorePreset()],
});

try {
  const workbook = univerAPI.createWorkbook({});
  const worksheet = workbook.getActiveSheet()!;

  worksheet.getRange('A1:B1').setValues([[123, '=A1*6']]);

  await univerAPI.getFormula().onCalculationResultApplied();

  console.log(JSON.stringify(workbook.save(), null, 2));
} finally {
  univer.dispose();
}
