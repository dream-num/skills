# Command system

All persisted or undoable business-state changes must flow through `ICommandService`.

## Command types

```ts
enum CommandType {
    COMMAND = 0,
    OPERATION = 1,
    MUTATION = 2,
}
```

| Type | Responsibility |
| --- | --- |
| `COMMAND` | Validate intent, gather current state, execute mutations/operations, and push undo/redo. |
| `MUTATION` | Deterministically change persisted model state. It is the collaboration conflict-resolution unit. |
| `OPERATION` | Change transient UI state such as selection, scroll, or an open panel. |

Register every definition and retain the returned disposable:

```ts
this.disposeWithMe(this._commandService.registerCommand(MyCommand));
this.disposeWithMe(this._commandService.registerCommand(MyMutation));
```

## A command

Handlers return their result directly or as a promise. `executeCommand()` returns a promise of that result; it does not return an object containing `.result`.

```ts
import type { ICommand } from '@univerjs/core';
import { CommandType, ICommandService } from '@univerjs/core';
import { SetRangeValuesCommand } from '@univerjs/sheets';

export interface IMyCommandParams {
    unitId: string;
    subUnitId: string;
    row: number;
    column: number;
    value: string;
}

export const MyCommand: ICommand<IMyCommandParams> = {
    id: 'my-plugin.command.set-cell',
    type: CommandType.COMMAND,
    handler: (accessor, params) => {
        if (!params) return false;

        return accessor.get(ICommandService).executeCommand(SetRangeValuesCommand.id, {
            unitId: params.unitId,
            subUnitId: params.subUnitId,
            range: {
                startRow: params.row,
                endRow: params.row,
                startColumn: params.column,
                endColumn: params.column,
            },
            value: { v: params.value },
        });
    },
};
```

Prefer an existing public command when it already represents the user intent. Use a built-in mutation directly only when the custom command is intentionally taking responsibility for validation, interceptors, and undo/redo.

## A mutation

A mutation must depend only on serializable parameters plus DI model services. It must not read DOM, selection, or other transient UI state.

```ts
import type { IMutation } from '@univerjs/core';
import { CommandType } from '@univerjs/core';

export interface ISetPluginStateMutationParams {
    unitId: string;
    enabled: boolean;
}

export const SetPluginStateMutation: IMutation<ISetPluginStateMutationParams> = {
    id: 'my-plugin.mutation.set-state',
    type: CommandType.MUTATION,
    handler: (accessor, params) => {
        const model = accessor.get(MyPluginModel);
        model.setEnabled(params.unitId, params.enabled);
        return true;
    },
};
```

If the model is persisted, also register its resource serialization and disposal/collaboration cleanup. A mutation is not automatically added to undo/redo history.

## An operation

Use `IOperation` for transient state:

```ts
import type { IOperation } from '@univerjs/core';
import { CommandType } from '@univerjs/core';

export interface ISetPanelVisibleOperationParams {
    visible: boolean;
}

export const SetPanelVisibleOperation: IOperation<ISetPanelVisibleOperationParams> = {
    id: 'my-plugin.operation.set-panel-visible',
    type: CommandType.OPERATION,
    handler: (accessor, params) => {
        accessor.get(MyPanelService).setVisible(params.visible);
        return true;
    },
};
```

## Undo/redo

Capture undo state before running redo. Execute synchronous mutation sequences with `sequenceExecute()`, reverse undo ordering when there is more than one redo mutation, and push history only after the redo succeeds.

```ts
import type { ICellData, ICommand, IMutationInfo, IObjectMatrixPrimitiveType, Workbook } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import {
    CommandType,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    UniverInstanceType,
} from '@univerjs/core';
import { SetRangeValuesMutation, SetRangeValuesUndoMutationFactory } from '@univerjs/sheets';

export interface ISetRowBackgroundParams {
    unitId: string;
    subUnitId: string;
    rowIndex: number;
    color: string;
}

export const SetRowBackgroundCommand: ICommand<ISetRowBackgroundParams> = {
    id: 'my-plugin.command.set-row-background',
    type: CommandType.COMMAND,
    handler: (accessor, params) => {
        if (!params) return false;

        const workbook = accessor
            .get(IUniverInstanceService)
            .getUnit<Workbook>(params.unitId, UniverInstanceType.UNIVER_SHEET);
        const worksheet = workbook?.getSheetBySheetId(params.subUnitId);
        if (!worksheet || params.rowIndex < 0 || params.rowIndex >= worksheet.getRowCount()) return false;

        const cellValue: IObjectMatrixPrimitiveType<ICellData> = {
            [params.rowIndex]: {},
        };
        for (let column = 0; column < worksheet.getColumnCount(); column++) {
            cellValue[params.rowIndex][column] = { s: { bg: { rgb: params.color } } };
        }

        const redoParams: ISetRangeValuesMutationParams = {
            unitId: params.unitId,
            subUnitId: params.subUnitId,
            cellValue,
        };
        const undoParams = SetRangeValuesUndoMutationFactory(accessor, redoParams);
        const redoMutations: IMutationInfo[] = [{ id: SetRangeValuesMutation.id, params: redoParams }];
        const undoMutations: IMutationInfo[] = [{ id: SetRangeValuesMutation.id, params: undoParams }];
        const commandService = accessor.get(ICommandService);
        const applied = commandService.syncExecuteCommand(SetRangeValuesMutation.id, redoParams);

        if (!applied) return false;

        accessor.get(IUndoRedoService).pushUndoRedo({
            unitID: params.unitId,
            undoMutations,
            redoMutations,
        });
        return true;
    },
};
```

For multiple synchronous mutations, `sequenceExecute()` returns a sequence-status object; destructure and check its `result` field. `executeCommand()` and `syncExecuteCommand()` return the command handler's result directly. Do not confuse these APIs.

Current sheet undo helpers exported from `@univerjs/sheets` include:

- `SetRangeValuesUndoMutationFactory`
- `SetWorksheetRowCountUndoMutationFactory`
- `SetWorksheetColumnCountUndoMutationFactory`
- `InsertRowMutationUndoFactory` and `InsertColMutationUndoFactory`
- `AddMergeUndoMutationFactory` and `RemoveMergeUndoMutationFactory`
- `InsertSheetUndoMutationFactory` and `RemoveSheetUndoMutationFactory`

Check the target package's root exports before using a helper; do not import an internal command file.

## Sync and async execution

```ts
const changed = await commandService.executeCommand(MyCommand.id, params);
if (!changed) return false;

const mutated = commandService.syncExecuteCommand(SetRangeValuesMutation.id, mutationParams);
if (!mutated) return false;
```

Use `syncExecuteCommand()` only when the registered command and all downstream handlers are synchronous. Use `sequenceExecuteAsync()` for an ordered async sequence.

## Built-in commands

Import the exported definition and use its `.id`; do not hard-code a built-in ID.

```ts
import { ICommandService } from '@univerjs/core';
import { SetRangeValuesCommand } from '@univerjs/sheets';

await commandService.executeCommand(SetRangeValuesCommand.id, {
    unitId,
    subUnitId,
    range,
    value: [[1, 2], [3, 4]],
});
```

Typical owners:

| Package | Examples |
| --- | --- |
| `@univerjs/core` | `UndoCommand`, `RedoCommand` |
| `@univerjs/sheets` | sheet commands and persisted mutations such as `SetRangeValuesCommand` / `SetRangeValuesMutation` |
| `@univerjs/sheets-ui` | selection, zoom, scroll, clipboard, and other sheet UI commands/operations |
| feature package | filter, sort, data-validation, conditional-formatting, note, table, and Pro-specific commands |

## Command listeners

Both listener APIs return `IDisposable`:

```ts
this.disposeWithMe(
    this._commandService.onCommandExecuted((commandInfo, options) => {
        if (commandInfo.id === SetRangeValuesMutation.id) {
            this._handleValueChange(commandInfo.params, options);
        }
    })
);

this.disposeWithMe(
    this._commandService.beforeCommandExecuted((commandInfo) => {
        if (commandInfo.id === MyCommand.id) {
            this._validate(commandInfo.params);
        }
    })
);
```

Direct `ICommandService` listeners are observation/interception hooks and cannot cancel by returning `false`. For public cancellable hooks, use a supported `Before*` Facade event and set `event.cancel = true`.
