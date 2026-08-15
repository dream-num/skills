# UI customization

## Toolbar menus

Merge a menu schema with `IMenuManagerService`. The menu item executes its `commandId`, or its `id` when `commandId` is absent.

```ts
import type { MenuSchemaType } from '@univerjs/ui';
import { MenuItemType, RibbonOthersGroup } from '@univerjs/ui';

import { MyCommand } from '../commands/my-command';

export const menuSchema: MenuSchemaType = {
    [RibbonOthersGroup.OTHERS]: {
        [MyCommand.id]: {
            order: 10,
            menuItemFactory: () => ({
                id: MyCommand.id,
                title: 'my-plugin.menu.run',
                tooltip: 'my-plugin.menu.run',
                icon: 'MyPluginIcon',
                type: MenuItemType.BUTTON,
            }),
        },
    },
};
```

Register it once from the owning controller:

```ts
this._menuManagerService.mergeMenu(menuSchema);
```

`mergeMenu()` currently returns `void`; do not pass it to `disposeWithMe()`.

Current ribbon positions/groups exported by `@univerjs/ui` include:

- `RibbonPosition.START`, `INSERT`, `FORMULAS`, `DATA`, `VIEW`, `OTHERS`
- `RibbonStartGroup`, `RibbonInsertGroup`, `RibbonFormulasGroup`, `RibbonDataGroup`, `RibbonViewGroup`, `RibbonOthersGroup`

Use a group that already exists in the target UI schema. `RibbonFormulaGroup` is not a current export; the current name is `RibbonFormulasGroup`.

## Submenus

Use `MenuItemType.SUBITEMS` and nest child schema nodes under the parent node. There is no `children` field on `IMenuItem`.

```ts
import type { MenuSchemaType } from '@univerjs/ui';
import { MenuItemType, RibbonOthersGroup } from '@univerjs/ui';

import { FirstCommand, SecondCommand } from '../commands/actions';

const MY_SUBMENU_ID = 'my-plugin.menu.actions';

export const submenuSchema: MenuSchemaType = {
    [RibbonOthersGroup.OTHERS]: {
        [MY_SUBMENU_ID]: {
            order: 10,
            menuItemFactory: () => ({
                id: MY_SUBMENU_ID,
                title: 'my-plugin.menu.actions',
                type: MenuItemType.SUBITEMS,
            }),
            [FirstCommand.id]: {
                order: 0,
                menuItemFactory: () => ({
                    id: FirstCommand.id,
                    title: 'my-plugin.menu.first',
                    type: MenuItemType.BUTTON,
                }),
            },
            [SecondCommand.id]: {
                order: 1,
                menuItemFactory: () => ({
                    id: SecondCommand.id,
                    title: 'my-plugin.menu.second',
                    type: MenuItemType.BUTTON,
                }),
            },
        },
    },
};
```

## Context-menu items

Add context-menu items through the same menu schema. `IContextMenuService` opens/hides a context menu and registers a host handler; it does not provide `addContextMenuItem()`.

```ts
import type { MenuSchemaType } from '@univerjs/ui';
import { ContextMenuGroup, ContextMenuPosition, MenuItemType } from '@univerjs/ui';

import { MyCommand } from '../commands/my-command';

export const contextMenuSchema: MenuSchemaType = {
    [ContextMenuPosition.MAIN_AREA]: {
        [ContextMenuGroup.OTHERS]: {
            [MyCommand.id]: {
                order: 10,
                menuItemFactory: () => ({
                    id: MyCommand.id,
                    title: 'my-plugin.menu.run',
                    type: MenuItemType.BUTTON,
                }),
            },
        },
    },
};
```

Other current positions include `COL_HEADER`, `ROW_HEADER`, `FOOTER_TABS`, `FOOTER_MENU`, `PARAGRAPH`, and `DRAWING`. Menu visibility should use observables such as the owning product's `getMenuHiddenObservable()` pattern, not DOM inspection.

## Shortcuts

`IShortcutItem` carries a command ID and static parameters. It has no `handler`; `IShortcutService` dispatches the matching command automatically.

```ts
import type { IShortcutItem } from '@univerjs/ui';
import { whenSheetEditorFocused } from '@univerjs/sheets-ui';
import { KeyCode, MetaKeys } from '@univerjs/ui';

import { MyCommand } from '../commands/my-command';

export const MyShortcut: IShortcutItem = {
    id: MyCommand.id,
    description: 'my-plugin.shortcut.run',
    binding: KeyCode.KEY_K | MetaKeys.CTRL_CMD | MetaKeys.SHIFT,
    priority: 100,
    preconditions: whenSheetEditorFocused,
    staticParameters: { value: 'from-shortcut' },
};
```

Register and dispose it:

```ts
this.disposeWithMe(this._shortcutService.registerShortcut(MyShortcut));
```

Use the product's exported focus predicate. Preserve native text-editor behavior unless the shortcut intentionally overrides it.

## Components and icons

Use `ComponentManager` for renderable components and `IconManager` for menu/toolbar icons. Keep static production registrations in the plugin's `ComponentsController`.

```ts
import { Disposable, Inject } from '@univerjs/core';
import { FolderIcon } from '@univerjs/icons';
import { ComponentManager, IconManager } from '@univerjs/ui';

import { MyPopup } from '../views/MyPopup';

export class ComponentsController extends Disposable {
    constructor(
        @Inject(ComponentManager) componentManager: ComponentManager,
        @Inject(IconManager) iconManager: IconManager
    ) {
        super();
        this.disposeWithMe(componentManager.register('MyPluginPopup', MyPopup));
        this.disposeWithMe(iconManager.register('MyPluginIcon', FolderIcon));
    }
}
```

`@univerjs/icons` is independently versioned (`1.35.0` in the checked manifests); use the version declared by the target Univer package instead of forcing it to the `1.0.0-beta.0` release-train version.

### Migrating 0.25 component and icon registration

0.25 registered both renderable components and icon components through `ComponentManager`. In 1.0, register icons with the separate `IconManager` and components with `ComponentManager`. First-party packages centralize static production registrations in `src/controllers/components.controller.ts`; custom plugins should follow the same ownership pattern and dispose both registrations.

Menu and shortcut schemas also evolved. Use the current exported ribbon groups and current schema fields (`replace`, header actions, quick columns/variants, and grid layout where needed). A shortcut still dispatches its `id`; adding a `handler` was not the 1.0 migration path.

## Cell and range popups

With `@univerjs/sheets-ui/facade` loaded, `FRange` exposes `attachPopup()` and `attachRangePopup()`. Each accepts a registered component key or a component directly and returns a disposable or `null`.

```ts
import '@univerjs/sheets-ui/facade';

const worksheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
const popup = worksheet?.getRange('C3:E5').attachRangePopup({
    componentKey: MyPopup,
    direction: 'top-center',
    extraProps: { source: 'my-plugin' },
});

if (popup) {
    this.disposeWithMe(popup);
}
```

Use `attachPopup()` to anchor at the range's start cell and `attachRangePopup()` to anchor to the whole range. Do not use the removed `IRangePopupService` API.

## CSS ownership in 1.0

CSS loading depends on how the host assembles Univer:

- Preset mode imports the preset's aggregated stylesheet, for example `@univerjs/preset-sheets-core/lib/index.css`.
- Plugin mode imports the stylesheet for every registered UI package, for example `@univerjs/design/lib/index.css`, `@univerjs/ui/lib/index.css`, `@univerjs/docs-ui/lib/index.css`, and `@univerjs/sheets-ui/lib/index.css` for the Sheet UI stack.
- The 1.0 Pro product UIs add their own entries: `@univerjs-pro/slides-ui/lib/index.css`, `@univerjs-pro/bases-ui/lib/index.css`, `@univerjs-pro/boards-ui/lib/index.css`, and `@univerjs-pro/pdfs-ui/lib/index.css`. Import only the product stack the host registers.

The design/UI package CSS paths and the preset-aggregate versus Plugin Mode split already existed in 0.25; the 1.0 migration is not a blanket CSS-path rename. The material differences are that `@univerjs/presets` no longer re-exports `./preset-*` entries, each preset is imported from its dedicated package with changed aggregate contents, and the new product UI packages add more CSS owners. A plugin without CSS needs no extra stylesheet. A plugin with CSS must use a CSS-aware build, publish a stable CSS entry, and document the host import; TypeScript compilation alone does not emit CSS.

## Theme and localization

- Store stable locale keys in menu/shortcut metadata and provide the package-owned locale resources. Translate dynamic copy with `LocaleService.t()` at the nearest UI boundary.
- Use existing `--univer-*` CSS variables or theme-aware utility classes in DOM styles.
- Use `ThemeService.getColorFromTheme()` / `currentTheme$` in model or canvas code. Do not read runtime colors directly from `@univerjs/themes`.
- Do not guess CSS class names or replacement component keys. Reuse an exported, documented extension point from the target version.
