# Custom Formula Functions

Univer `1.0.0-beta.0` exposes custom formula registration through the Formula Facade. The Sheets Core presets register this Facade automatically. Manual Plugin Mode needs both formula plugins and these side-effect imports:

```ts
import '@univerjs/engine-formula/facade';
import '@univerjs/sheets-formula/facade';
```

## Synchronous function

```ts
const formula = univerAPI.getFormula();

const registration = formula.registerFunction(
  'DISCOUNT',
  (price, discountPercent) => Number(price) * (1 - Number(discountPercent) / 100),
  'Returns a price after a percentage discount',
);

const worksheet = univerAPI.getActiveWorkbook()!.getActiveSheet();
worksheet.getRange('A1:B2').setValues([
  ['Price', 'Discount'],
  [100, 20],
]);
worksheet.getRange('C2').setFormula('=DISCOUNT(A2,B2)');

// Unregister when the feature owner is disposed.
registration.dispose();
```

The registration object implements `IDisposable`. Retain it and dispose it with the plugin, component, or application feature that owns the function.

## Asynchronous function

```ts
const registration = univerAPI.getFormula().registerAsyncFunction(
  'FETCH_RATE',
  async (currency) => {
    const response = await fetch(`/api/rates/${encodeURIComponent(String(currency))}`);
    if (!response.ok) {
      throw new Error(`Rate request failed: ${response.status}`);
    }

    const data = await response.json() as { rate: number };
    return data.rate;
  },
  'Fetches an exchange rate',
);
```

Keep network validation, authentication, caching, and retry policy at the application boundary. Formula functions may run repeatedly during recalculation and must not perform unintended writes.

## Localized description

`registerFunction` also accepts an options object:

```ts
const registration = univerAPI.getFormula().registerFunction(
  'DOUBLE',
  (value) => Number(value) * 2,
  {
    description: 'customFunction.DOUBLE.description',
    locales: {
      enUS: {
        customFunction: {
          DOUBLE: {
            description: 'Doubles a number',
          },
        },
      },
    },
  },
);
```

Use the locale identifiers and object shape supported by the installed release.

## Initial registration

For a headless Node preset, functions may also be supplied when composing the preset. Prefer runtime Facade registration unless the function must exist before the first workbook is created or must be mirrored into a worker at initialization.

Do not execute internal function-registration mutations from application code. Use the Facade for runtime registration in the current process. A `BaseFunction` class is only appropriate when the function must be supplied through initialization configuration, including a worker that cannot receive a serialized callback; see `univer-node-backend` for that boundary.
