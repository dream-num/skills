# Theme API and migration

This reference distinguishes current source from the npm package that currently carries the same `1.0.0-beta.0` version label.

## Package ownership and built-ins

Current `@univerjs/themes` source owns the `Theme` type and these complete palettes:

- `defaultTheme` and its alias `blueTheme`
- `darkBlueTheme`
- `greenTheme`
- `orangeTheme`
- `purpleTheme`
- `redTheme`
- `yellowTheme`

`@univerjs/presets` currently re-exports the core and theme public APIs, so a preset application may import a theme from that root. A reusable package that imports themes directly should declare `@univerjs/themes` as its own dependency. The theme package has no CSS, locale, plugin, or `/facade` entry.

## Release gate

Do not use the manifest version string alone to infer the surface:

| Surface | Published npm `1.0.0-beta.0` | Current source with `1.0.0-beta.0` manifests |
|---|---|---|
| Built-ins | default, green, orange, purple, red, yellow | Also `blueTheme` alias and `darkBlueTheme` |
| Neutral endpoints | Legacy top-level endpoints | `gray.0`, `gray.1000` |
| Base Facade | `toggleDarkMode()` | Also `setTheme()`, `getCurrentTheme()`, `isDarkMode()` |

Always inspect the target package exports and `FUniver` declarations. The portable intersection is to derive from that target's `defaultTheme` and pass the complete result to `createUniver({ theme })`.

## Current source schema

`Theme` is `typeof defaultTheme`, not `Partial<typeof defaultTheme>`:

Current source exposes the neutral endpoints only as `gray.0` and `gray.1000`; do not invent top-level neutral token names.

| Branch | Keys | Values |
|---|---|---|
| `primary` | `50` through `900` | CSS colors |
| `gray` | `0`, `50` through `900`, `1000` | CSS colors |
| `blue`, `red`, `orange`, `yellow`, `green`, `jiqing`, `indigo`, `purple`, `pink` | `50` through `900` | CSS colors |
| `loop-color` | `1` through `12` | theme paths such as `purple.400` |
| `highlight.background` | `1` through `16` | `{ color: themePath, alpha: number }` |

Start with a built-in and spread every replaced nested branch. `setTheme()` is a complete replacement, not a deep merge:

```ts
import type { Theme } from '@univerjs/themes';
import { defaultTheme } from '@univerjs/themes';

const theme: Theme = {
  ...defaultTheme,
  primary: {
    ...defaultTheme.primary,
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
};
```

Use a coherent `50`–`900` ramp in production; changing one shade can make interaction states inconsistent.

## Initial configuration and lifecycle

Both the preset factory and low-level `Univer` constructor accept `theme` and `darkMode`. They apply these before product plugins start.

In React, create the Univer instance once in the mount effect, update appearance through the retained Facade, and call `univer.dispose()` in cleanup. Do not put a changing `theme` object in the creation effect's dependency list and rebuild the entire editor for a palette change.

## Current source Facade

The base `FUniver` exposes:

```ts
univerAPI.setTheme(theme);       // void
univerAPI.getCurrentTheme();     // Theme
univerAPI.toggleDarkMode(true);  // void
univerAPI.isDarkMode();          // boolean
```

No feature `/facade` import is required for these base methods. The published beta currently exposes only `toggleDarkMode()` from this list; prefer initialization for its theme selection.

## ThemeService for plugin code

Current `ThemeService` is exported from `@univerjs/core` and provides:

```ts
themeService.darkMode;
themeService.darkMode$;
themeService.getCurrentTheme();
themeService.currentTheme$;
themeService.setTheme(theme);
themeService.setDarkMode(true);
themeService.getColorFromTheme<string>('primary.600');
themeService.isValidThemeColor('primary.600');
```

Application code should normally use `FUniver`. Inject `ThemeService` inside plugins and services that need current runtime state. `getColorFromTheme()` does not validate arbitrary input, and `isValidThemeColor()` handles the current top-level or two-segment paths rather than deeply nested highlight paths.

## Browser CSS generation

When the UI workbench is mounted, it flattens the current source Theme into variables on `:root`:

| Theme path | CSS variable |
|---|---|
| `primary.600` | `--univer-primary-600` |
| `gray.0` | `--univer-gray-0` |
| `highlight.background.1.color` | `--univer-highlight-background-1-color` |
| `highlight.background.1.alpha` | `--univer-highlight-background-1-alpha` |

It replaces the style element with ID `univer-theme-css-variables` on every theme change. Dark mode adds or removes `univer-dark` on the document root and workbench.

Consequences:

- Variables and the root dark-mode class are document-global, not container-scoped.
- UI CSS injection requires the browser workbench; Node/headless runtimes do not create variables.
- Required preset/plugin stylesheets remain independent imports.
- Use direct color variables in custom CSS. A `loop-color` leaf stores another theme path and may require runtime resolution before it becomes a literal color.

## Dark mode

Theme and dark mode are independent state. Current source can set both explicitly:

```ts
univerAPI.setTheme(darkBlueTheme);
univerAPI.toggleDarkMode(true);
```

The flag drives the root class and canvas render conversion. A dark palette alone does not enable the flag.

## Migration from 0.25.0

Compared with `0.25.0`, current source moves the neutral endpoints under `gray` as `gray.0` and `gray.1000`, adds the extra built-ins and highlight branch, and adds the current Facade methods. `ThemeService` is otherwise similar, while `getColorFromTheme<T>()` now has a generic return type.

Rebuild custom objects from the target release's built-in theme so required branches are preserved. Replace application-level injector access with the available public Facade; never use `univer.__getInjector()` as an integration API.
