# Facade extensions

Facade classes that expose a static `extend()` use runtime mixins. An extension needs all three pieces:

1. a mixin class that extends the target Facade class;
2. one `Target.extend(Mixin)` call;
3. module augmentation for TypeScript.

Consumers must execute the extension module with a side-effect import.

Do not infer `extend()` support from a class being exported under `/facade`. Verify the target class itself before applying this pattern.

## Current class owners and mixin targets

| Class | Import | Static `extend()` |
| --- | --- | --- |
| `FUniver`, `FEventName`, `FEnum` | `@univerjs/core/facade` | Yes |
| `FWorkbook`, `FWorksheet`, `FRange` | `@univerjs/sheets/facade` | Yes |
| `FDocument`, `FDocumentParagraph`, `FDocumentTextRange` | `@univerjs/docs/facade` | Yes |
| `FPresentation`, `FSlide` | `@univerjs-pro/slides/facade` | Yes |
| `FPageElement` | `@univerjs-pro/slides/facade` | No |
| `FBoard` | `@univerjs-pro/boards/facade` | Yes |
| `FBase`, `FBaseTable`, `FBaseTableRange` | `@univerjs-pro/bases/facade` | No |
| `FPdf` | `@univerjs-pro/pdfs/facade` | Yes |
| `FPdfPage`, `FPdfPageElement` | `@univerjs-pro/pdfs/facade` | No |

Feature packages own additional Facade classes and mixins. Import from the root `/facade` subpath exposed by the package that defines the class; do not import an internal source file. A row marked “No” is an ownership reference only: consume that class normally, but do not call a nonexistent `extend()`. Pro classes marked “Yes” follow the same side-effect and module-augmentation rules as OSS mixin targets.

## Basic pattern

```ts
import { FRange } from '@univerjs/sheets/facade';

export interface IFRangeMyMixin {
    isSingleCell(): boolean;
}

export class FRangeMyMixin extends FRange implements IFRangeMyMixin {
    override isSingleCell(): boolean {
        const { startRow, endRow, startColumn, endColumn } = this.getRange();
        return startRow === endRow && startColumn === endColumn;
    }
}

FRange.extend(FRangeMyMixin);

declare module '@univerjs/sheets/facade' {
    interface FRange extends IFRangeMyMixin {}
}
```

The consumer must load the file once:

```ts
import 'my-plugin/facade';

const single = univerAPI.getActiveWorkbook()?.getActiveSheet().getRange('A1').isSingleCell();
```

Do not put the side-effect import inside a function or assume exporting the mixin executes it.

## Worksheet example

Follow Facade conventions: mutating methods return `this`, creating methods return the created object, and deleting methods return success/failure.

```ts
import { FWorksheet } from '@univerjs/sheets/facade';

export interface IFWorksheetMyMixin {
    formatHeader(color: string): this;
}

export class FWorksheetMyMixin extends FWorksheet implements IFWorksheetMyMixin {
    override formatHeader(color: string): this {
        this.getRange(0, 0, 1, this.getMaxColumns())
            .setBackground(color)
            .setFontWeight('bold');
        return this;
    }
}

FWorksheet.extend(FWorksheetMyMixin);

declare module '@univerjs/sheets/facade' {
    interface FWorksheet extends IFWorksheetMyMixin {}
}
```

Prefer existing Facade methods because they already route writes through commands. If a method needs new persisted behavior, implement a command/mutation with undo/redo and invoke it from the Facade boundary; do not mutate the underlying workbook model directly.

## Accessing DI and initialization

Do not add constructor parameters to a mixin. Facade construction is controlled by the base class. Existing protected fields such as `_injector` are available to instance methods.

Use an instance `_initialize()` method when every Facade instance needs setup:

```ts
import type { Injector } from '@univerjs/core';
import { ICommandService } from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';

import { MyCommand } from '../commands/my-command';

export interface IFUniverMyMixin {
    runMyCommand(value: string): Promise<boolean>;
}

export class FUniverMyMixin extends FUniver implements IFUniverMyMixin {
    override _initialize(injector: Injector): void {
        const commandService = injector.get(ICommandService);
        this.disposeWithMe(
            commandService.onCommandExecuted((commandInfo) => {
                if (commandInfo.id === MyCommand.id) {
                    this._afterRun(commandInfo.params);
                }
            })
        );
    }

    override runMyCommand(value: string): Promise<boolean> {
        return this._commandService.executeCommand(MyCommand.id, { value });
    }

    private _afterRun(params: unknown): void {
        // Update extension-owned transient state.
    }
}

FUniver.extend(FUniverMyMixin);

declare module '@univerjs/core/facade' {
    interface FUniver extends IFUniverMyMixin {}
}
```

`_initialize` is an instance method, not a static method. Initializers are collected and invoked for each new Facade instance. Dispose every listener or subscription from the Facade instance.

## Multiple extensions

`extend()` can be called by multiple packages. It copies each mixin prototype property onto the target prototype and accumulates `_initialize` methods. Different method names coexist; a later extension with the same property name replaces the earlier property.

Use package-specific method names and check the target Facade plus installed extensions before adding a public method. Merge only when two methods would genuinely collide; a single global combined mixin is not required.

## Side-effect entry points

Expose a deliberate Facade subpath from the plugin package:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./facade": {
      "types": "./dist/facade/f-univer.d.ts",
      "import": "./dist/facade/f-univer.js"
    }
  }
}
```

Keep the main plugin registration and Facade side effect separate so headless consumers do not load UI or Facade code accidentally.

Mark the built Facade entry as side-effectful so production tree shaking does not remove `Target.extend(...)`:

```json
{
  "sideEffects": ["./dist/facade/*.js"]
}
```

## Migrating a 0.25 Facade extension

Facade registration is still runtime side-effect registration in 1.0: exporting a mixin is not enough, and registering the plugin does not execute a separate Facade entry. Keep the explicit consumer import such as `import 'my-plugin/facade'` and preserve the entry with `package.json#sideEffects`.

Update the owner import before augmenting a module:

- 0.25 exposed `FDocument` through `@univerjs/docs-ui/facade`; 1.0 owns `FDocument`, `FDocumentParagraph`, and `FDocumentTextRange` in `@univerjs/docs/facade`. `@univerjs/docs-ui/facade` now provides UI extensions to the document Facade rather than owning the base class.
- 0.25 `FHooks` and `FSheetHooks` APIs are gone. Use typed `univerAPI.addEvent(univerAPI.Event.<name>, ...)` events from the owning Facade side-effect modules.
- 1.0's `FBaseInitialable.extend()` (used by unit Facades such as `FRange` and `FDocument`) preserves property descriptors and runs every collected instance `_initialize()` method. `FUniver` and `FEventName` have their own mixin implementations, so check the specific target before relying on getter/setter descriptors. Put methods and initialization on the mixin prototype; do not assign them manually or use the old hook wrappers.

After changing the import, augment the same 1.0 module specifier. Augmenting the old module can typecheck in an ambient declaration while failing to extend the class actually instantiated at runtime.

## Public API checklist

- Add JSDoc with parameters, return value, and a runnable example.
- Use an `I` prefix for extension interfaces.
- Use top-level `import type` declarations.
- Augment the exact module used to import the target class.
- Route persisted changes through `ICommandService`.
- Return `this` for mutation-style chainable methods.
- Dispose instance initialization resources.
- Add a behavioral test that imports the extension side effect and resolves Facade instances through Univer's injector-backed API.
