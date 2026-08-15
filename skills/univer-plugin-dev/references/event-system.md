# Event system

## Typed Facade events

Prefer `univerAPI.addEvent()` for public application-facing events. Load the Facade modules that contribute event names and parameter types:

```ts
import '@univerjs/sheets/facade';
import '@univerjs/sheets-ui/facade';

const valueChanged = univerAPI.addEvent(
    univerAPI.Event.SheetValueChanged,
    ({ effectedRanges, payload }) => {
        console.log(effectedRanges, payload);
    }
);

valueChanged.dispose();
```

`effectedRanges` is the current API spelling.

Common event owners:

| Owner | Examples |
| --- | --- |
| `@univerjs/core/facade` | `LifeCycleChanged`, `BeforeCommandExecute`, `CommandExecuted`, `BeforeUndo`, `Undo`, `BeforeRedo`, `Redo`, `DocCreated`, `DocDisposed` |
| `@univerjs/sheets/facade` | `WorkbookCreated`, `WorkbookDisposed`, `BeforeSheetCreate`, `SheetCreated`, `BeforeSheetDelete`, `SheetDeleted`, `ActiveSheetChanged`, `SheetValueChanged` |
| `@univerjs/sheets-ui/facade` | editing, selection, pointer, scroll, zoom, and clipboard events |

Inspect `univerAPI.Event` and the owning package's `/facade` exports for the target version. There is no current `FSheetHooks` API, and worksheet deletion is exposed as `SheetDeleted`, not `SheetDisposed`.

### Cancellation

Only supported `Before*` events are cancellable. Set the event parameter's `cancel` flag:

```ts
const disposable = univerAPI.addEvent(univerAPI.Event.BeforeCommandExecute, (event) => {
    if (event.id === MyCommand.id && shouldBlock(event.params)) {
        event.cancel = true;
    }
});
```

The Facade bridge converts that flag into a canceled command. An `ICommandService.beforeCommandExecuted()` listener cannot cancel by returning `false`.

## Filter command execution

Use exported definitions instead of command-ID strings:

```ts
import { SetRangeValuesMutation } from '@univerjs/sheets';

const disposable = univerAPI.addEvent(univerAPI.Event.CommandExecuted, (event) => {
    if (event.id === SetRangeValuesMutation.id) {
        console.log(event.params, event.options);
    }
});
```

Inside a plugin/controller, listen to `ICommandService` directly when Facade is unavailable or execution options are required:

```ts
this.disposeWithMe(
    this._commandService.onCommandExecuted((commandInfo, options) => {
        if (commandInfo.id === SetRangeValuesMutation.id) {
            this._onValuesChanged(commandInfo.params, options);
        }
    })
);
```

`onCommandExecuted()` does not receive mutations executed with the `syncOnly` option. Collaboration adapters that need those use the specialized `onMutationExecutedForCollab()` boundary.

## Custom Facade events

Do not use an `IEventService`; it is not part of the current public API. Extend `FEventName` and `IEventParamConfig`, then bridge an observable source through `FUniver.registerEventHandler()`.

### Define the event name and parameter type

```ts
import type { IEventBase } from '@univerjs/core/facade';
import { FEventName } from '@univerjs/core/facade';

export interface IMyPluginChangedEventParams extends IEventBase {
    value: string;
}

export interface IFMyPluginEventNameMixin {
    readonly MyPluginChanged: 'MyPluginChanged';
}

export interface IMyPluginEventParamConfig {
    MyPluginChanged: IMyPluginChangedEventParams;
}

export class FMyPluginEventNameMixin extends FEventName implements IFMyPluginEventNameMixin {
    override get MyPluginChanged(): 'MyPluginChanged' {
        return 'MyPluginChanged';
    }
}

FEventName.extend(FMyPluginEventNameMixin);

declare module '@univerjs/core/facade' {
    interface FEventName extends IFMyPluginEventNameMixin {}
    interface IEventParamConfig extends IMyPluginEventParamConfig {}
}
```

### Bridge the source into `FUniver`

```ts
import type { Injector } from '@univerjs/core';
import { ICommandService } from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';

import type { IMyCommandParams } from '../commands/my-command';
import type { IMyPluginChangedEventParams } from './f-event';
import { MyCommand } from '../commands/my-command';

export class FUniverMyPluginEventMixin extends FUniver {
    override _initialize(injector: Injector): void {
        const commandService = injector.get(ICommandService);

        this.disposeWithMe(
            this.registerEventHandler(
                this.Event.MyPluginChanged,
                () => commandService.onCommandExecuted((commandInfo) => {
                    if (commandInfo.id !== MyCommand.id) return;

                    const params = commandInfo.params as IMyCommandParams;
                    const eventParams: IMyPluginChangedEventParams = { value: params.value };
                    this.fireEvent(this.Event.MyPluginChanged, eventParams);
                })
            )
        );
    }
}

FUniver.extend(FUniverMyPluginEventMixin);
```

Export both files from the plugin's deliberate `facade` subpath so a consumer's side-effect import installs the event name, type augmentation, and bridge.

## Cleanup

`addEvent()`, `registerEventHandler()`, `onCommandExecuted()`, and `beforeCommandExecuted()` all return disposables. Dispose them manually in application code or own them with `disposeWithMe()` in a `Disposable`/Facade instance. Do not leave global command listeners registered after plugin or unit disposal.
