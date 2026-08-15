# Plugin architecture

## Base class and dependencies

Every plugin extends `Plugin`. Declare dependencies with `@DependentOn`; Univer registers a missing dependency without configuration, so explicitly register dependencies that need non-default configuration before registering the dependent plugin.

```ts
import type { Dependency } from '@univerjs/core';
import { DependentOn, ICommandService, Inject, Injector, Plugin, UniverInstanceType } from '@univerjs/core';
import { UniverSheetsPlugin } from '@univerjs/sheets';

import { MyCommand } from './commands/my-command';
import { MyController } from './controllers/my.controller';

@DependentOn(UniverSheetsPlugin)
export class UniverMyPlugin extends Plugin {
    static override pluginName = 'MY_PLUGIN';
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        _config: undefined,
        @Inject(Injector) protected override readonly _injector: Injector,
        @ICommandService private readonly _commandService: ICommandService
    ) {
        super();
    }

    override onStarting(): void {
        ([[MyController]] as Dependency[]).forEach((dependency) => this._injector.add(dependency));
        this.disposeWithMe(this._commandService.registerCommand(MyCommand));
        this._injector.get(MyController);
    }
}
```

`Plugin` already supplies `packageName` and the target Univer compatibility `version` from `@univerjs/core`. First-party packages override both with their own package manifest because all official packages share one release version. A separately versioned third-party package may override `packageName`, but it should keep the inherited Univer compatibility version instead of reporting its independent npm package version there.

## Choose the product boundary

The current 1.0 product matrix has six unit families. A model-only extension normally depends on the owning core plugin; an extension that registers menus, shortcuts, popups, or render/UI modules also depends on the owning UI plugin.

| Product | Unit type | Official core plugin | Official UI plugin |
| --- | --- | --- | --- |
| Sheets | `UNIVER_SHEET` | `UniverSheetsPlugin` from `@univerjs/sheets` | `UniverSheetsUIPlugin` from `@univerjs/sheets-ui` |
| Docs | `UNIVER_DOC` | `UniverDocsPlugin` from `@univerjs/docs` | `UniverDocsUIPlugin` from `@univerjs/docs-ui` |
| Slides | `UNIVER_SLIDE` | choose `@univerjs/slides` or `@univerjs-pro/slides` | choose the matching `@univerjs/slides-ui` or `@univerjs-pro/slides-ui` |
| Bases | `UNIVER_BASE` | `UniverBasesPlugin` from `@univerjs-pro/bases` | `UniverBasesUIPlugin` from `@univerjs-pro/bases-ui` |
| Boards | `UNIVER_BOARD` | `UniverBoardsPlugin` from `@univerjs-pro/boards` | `UniverBoardsUIPlugin` from `@univerjs-pro/boards-ui` |
| PDFs | `UNIVER_PDF` | `UniverPdfsPlugin` from `@univerjs-pro/pdfs` | `UniverPdfsUIPlugin` from `@univerjs-pro/pdfs-ui` |

The OSS and Pro slide packages export the same class names and plugin IDs. They are alternative product stacks, not additive dependencies; never register both pairs in one runtime. Follow the target preset/application.

`UniverDocsPlugin` and `UniverDocsUIPlugin` deliberately retain the base plugin's global `UNIVER_UNKNOWN` scope because the docs engine is also embedded by other products. Use `UNIVER_DOC` for a custom plugin that acts only on document units; use `UNIVER_UNKNOWN` only for genuinely cross-product behavior and filter target units explicitly.

`@DependentOn` auto-registers a missing official plugin with its default configuration. That is useful for dependency closure, but it is not a substitute for host setup. Register and configure the selected product/preset stack first, then register the custom plugin:

```ts
univer.registerPlugin(UniverSheetsPlugin, sheetsConfig);
univer.registerPlugin(UniverSheetsUIPlugin, sheetsUIConfig);
univer.registerPlugin(UniverMyPlugin);
```

Declare only direct public plugin requirements. Let each official plugin declare its own engine, renderer, license, formula, shape, or editor dependencies; do not copy its transitive `@DependentOn` list into a third-party plugin. A headless host should not register a UI-dependent custom plugin.

In 0.25, the protocol exposed only unknown, docs, sheets, slides, and project-style unit types, and the Pro Slides, Bases, Boards, and PDF product packages did not exist. Do not derive a 1.0 product plugin from an old generic/project type or an old Sheet-only registration recipe.

The low-level `univer.registerPlugin(PluginCtor, config?)` call and `@DependentOn` default-registration behavior exist on both release lines. The 1.0 migration difference is composition: preset mode lets the preset register its product stack, while plugin mode explicitly registers the selected 1.0 core/UI pair and its configuration. New Pro products require their matching pairs, and the OSS/Pro slide pairs are mutually exclusive. Do not both register a dependency manually after a dependent plugin has already auto-registered it; register configured host dependencies first and the custom plugin last.

## Lifecycle

### `onStarting()`

The injector and global services are available, but product units and the DOM are not. Use this hook to:

- add DI dependencies;
- register commands, menus, shortcuts, components, and icons;
- instantiate controllers that do not require a product unit or renderer.

### `onReady()`

At least one matching product unit has been created. Use this hook to read initial unit state and activate controllers that depend on models.

### `onRendered()`

The UI renderer exists. Use this hook for render modules, canvas extensions, and DOM-dependent behavior.

### `onSteady()`

All plugins have reached `onRendered()`. Use this for optional background work, not for registrations required by initial rendering.

## Dependency injection

Use constructor injection for long-lived classes and the command handler's accessor for command-local lookups:

```ts
import type { IAccessor, ICommand } from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService, UniverInstanceType } from '@univerjs/core';

export const MyCommand: ICommand = {
    id: 'my-plugin.command.run',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const instanceService = accessor.get(IUniverInstanceService);
        return Boolean(instanceService.getCurrentUnitOfType(UniverInstanceType.UNIVER_SHEET));
    },
};

export class MyController {
    constructor(@ICommandService private readonly _commandService: ICommandService) {}
}
```

Common public tokens:

| Token | Package | Purpose |
| --- | --- | --- |
| `ICommandService` | `@univerjs/core` | Register and execute commands |
| `IUniverInstanceService` | `@univerjs/core` | Resolve units for any registered product type |
| `IUndoRedoService` | `@univerjs/core` | Push symmetric undo/redo mutations |
| `IConfigService` | `@univerjs/core` | Share plugin configuration |
| `LocaleService` | `@univerjs/core` | Translate package-owned locale keys |
| `ThemeService` | `@univerjs/core` | Read and observe runtime theme values |
| `IMenuManagerService` | `@univerjs/ui` | Merge toolbar and context-menu schemas |
| `IShortcutService` | `@univerjs/ui` | Register keyboard shortcuts |
| `ComponentManager` | `@univerjs/ui` | Register UI components |
| `IconManager` | `@univerjs/ui` | Register menu/toolbar icons |
| `IRenderManagerService` | `@univerjs/engine-render` | Register and resolve render modules |
| `SheetsSelectionsService` | `@univerjs/sheets` | Read sheet selection state |

Import directly from the package that owns the symbol. Do not guess a subpath or copy an internal path from repository source.

## Configuration

Keep the registration argument as the constructor's first parameter. Store cross-controller configuration in `IConfigService` under a package-owned key.

```ts
import { IConfigService, Inject, Injector, merge, Plugin, UniverInstanceType } from '@univerjs/core';

import type { IMyPluginConfig } from './types';

const MY_PLUGIN_CONFIG_KEY = 'my-plugin.config';
const defaultConfig: IMyPluginConfig = { enabled: true };

export class UniverMyPlugin extends Plugin {
    static override pluginName = 'MY_PLUGIN';
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        config: Partial<IMyPluginConfig> = defaultConfig,
        @Inject(Injector) protected override readonly _injector: Injector,
        @IConfigService configService: IConfigService
    ) {
        super();
        configService.setConfig(MY_PLUGIN_CONFIG_KEY, merge({}, defaultConfig, config));
    }
}

univer.registerPlugin(UniverMyPlugin, { enabled: false });
```

Use an `I` prefix for interfaces. Keep Univer release-train dependencies (`core`, product/UI packages, and Pro packages) on one exact version; follow the target manifest for independently versioned packages such as `@univerjs/icons`.

## Controllers and resources

Use a controller to own one coherent registration/lifecycle area. Extend `Disposable` or `RxDisposable` whenever it owns resources:

```ts
import { Disposable, ICommandService } from '@univerjs/core';
import { IShortcutService, KeyCode } from '@univerjs/ui';

import { MyCommand } from '../commands/my-command';

export class MyShortcutController extends Disposable {
    constructor(
        @ICommandService commandService: ICommandService,
        @IShortcutService shortcutService: IShortcutService
    ) {
        super();
        this.disposeWithMe(commandService.registerCommand(MyCommand));
        this.disposeWithMe(shortcutService.registerShortcut({ id: MyCommand.id, binding: KeyCode.KEY_K }));
    }
}
```

Own returned disposables from commands, listeners, subscriptions, shortcuts, components, icons, UI parts, render modules, sockets, workers, timers, and event handlers. Dispose an old resource before replacing it. `IMenuManagerService.mergeMenu()` currently returns `void`; do not pass it to `disposeWithMe()`.

Keep production-time static component and icon registrations in a `ComponentsController`. Keep commands, menus, shortcuts, dialogs, and other business registrations in their owning controllers.
