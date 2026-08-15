/**
 * Scaffold a minimal Univer Sheet UI plugin package.
 * Usage: npx tsx scaffold-plugin.ts <plugin-name> [--path <dir>]
 */

import fs from 'node:fs';
import path from 'node:path';

const UNIVER_VERSION = '1.0.0-beta.0';
const TYPESCRIPT_VERSION = '^6.0.3';

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}

const args = process.argv.slice(2);
let nameArg: string | undefined;
let baseDir = '.';

for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--path') {
        const value = args[index + 1];
        if (!value || value.startsWith('--')) fail('Expected a directory after --path.');
        baseDir = value;
        index++;
    } else if (arg.startsWith('--')) {
        fail(`Unknown option: ${arg}`);
    } else if (nameArg) {
        fail(`Unexpected argument: ${arg}`);
    } else {
        nameArg = arg;
    }
}

if (!nameArg) fail('Usage: scaffold-plugin.ts <plugin-name> [--path <dir>]');
if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(nameArg)) {
    fail('Plugin name must be lowercase kebab-case, for example "my-plugin".');
}

const pluginName = nameArg;
const className = pluginName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
const pluginClass = `Univer${className.endsWith('Plugin') ? className : `${className}Plugin`}`;
const pluginNameConstant = `${pluginName.replace(/-/g, '_')}_NAME`.toUpperCase();
const outDir = path.resolve(baseDir, pluginName);

const files: Record<string, string> = {
    'package.json': `${JSON.stringify(
        {
            name: pluginName,
            version: '0.0.1',
            type: 'module',
            files: ['dist'],
            sideEffects: ['./dist/facade/*.js'],
            main: './dist/index.js',
            module: './dist/index.js',
            types: './dist/index.d.ts',
            exports: {
                '.': {
                    types: './dist/index.d.ts',
                    import: './dist/index.js',
                },
                './facade': {
                    types: './dist/facade/f-univer.d.ts',
                    import: './dist/facade/f-univer.js',
                },
            },
            scripts: {
                build: 'tsc -p tsconfig.json',
                typecheck: 'tsc -p tsconfig.json --noEmit',
            },
            peerDependencies: {
                '@univerjs/core': UNIVER_VERSION,
                '@univerjs/sheets': UNIVER_VERSION,
                '@univerjs/sheets-ui': UNIVER_VERSION,
                '@univerjs/ui': UNIVER_VERSION,
            },
            devDependencies: {
                '@univerjs/core': UNIVER_VERSION,
                '@univerjs/sheets': UNIVER_VERSION,
                '@univerjs/sheets-ui': UNIVER_VERSION,
                '@univerjs/ui': UNIVER_VERSION,
                typescript: TYPESCRIPT_VERSION,
            },
            engines: {
                node: '>=18.17.0',
            },
        },
        null,
        2
    )}\n`,

    'tsconfig.json': `${JSON.stringify(
        {
            compilerOptions: {
                target: 'ES2020',
                lib: ['ES2020', 'DOM'],
                module: 'ESNext',
                moduleResolution: 'bundler',
                rootDir: 'src',
                outDir: 'dist',
                declaration: true,
                strict: true,
                noImplicitOverride: true,
                experimentalDecorators: true,
                useDefineForClassFields: true,
                verbatimModuleSyntax: true,
                skipLibCheck: true,
                noEmitOnError: true,
            },
            include: ['src'],
        },
        null,
        2
    )}\n`,

    'src/index.ts': `export { ${pluginClass} } from './plugin.js';\n`,

    'src/plugin.ts': `import { DependentOn, ICommandService, Inject, Injector, Plugin, UniverInstanceType } from '@univerjs/core';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';

import { MyCommand } from './commands/my-command.js';
import { MyMenuController } from './controllers/menu.controller.js';

export const ${pluginNameConstant} = '${pluginName}';

@DependentOn(UniverSheetsPlugin, UniverSheetsUIPlugin)
export class ${pluginClass} extends Plugin {
    static override pluginName = ${pluginNameConstant};
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        _config: undefined,
        @Inject(Injector) protected override readonly _injector: Injector,
        @ICommandService private readonly _commandService: ICommandService
    ) {
        super();
    }

    override onStarting(): void {
        this.disposeWithMe(this._commandService.registerCommand(MyCommand));
        this.disposeWithMe(this._injector.createInstance(MyMenuController));
    }
}
`,

    'src/commands/my-command.ts': `import type { ICommand } from '@univerjs/core';
import { CommandType } from '@univerjs/core';
import { IMessageService } from '@univerjs/ui';

export interface IMyCommandParams {
    value: string;
}

export const MyCommand: ICommand<IMyCommandParams> = {
    id: '${pluginName}.command.my-command',
    type: CommandType.COMMAND,
    handler: (accessor, params) => {
        if (!params) return false;

        accessor.get(IMessageService).show({ content: params.value });
        return true;
    },
};
`,

    'src/controllers/menu.controller.ts': `import { Disposable } from '@univerjs/core';
import { IMenuManagerService, MenuItemType, RibbonOthersGroup } from '@univerjs/ui';

import { MyCommand } from '../commands/my-command.js';

export class MyMenuController extends Disposable {
    constructor(@IMenuManagerService menuManagerService: IMenuManagerService) {
        super();

        menuManagerService.mergeMenu({
            [RibbonOthersGroup.OTHERS]: {
                [MyCommand.id]: {
                    order: 10,
                    menuItemFactory: () => ({
                        id: MyCommand.id,
                        title: 'My action',
                        tooltip: 'Run my action',
                        type: MenuItemType.BUTTON,
                        params: { value: 'Hello from ${pluginName}!' },
                    }),
                },
            },
        });
    }
}
`,

    'src/facade/f-univer.ts': `import { FUniver } from '@univerjs/core/facade';

export interface IFUniver${className}Mixin {
    helloPlugin(): string;
}

export class FUniver${className}Mixin extends FUniver implements IFUniver${className}Mixin {
    override helloPlugin(): string {
        return 'Hello from ${pluginName}!';
    }
}

FUniver.extend(FUniver${className}Mixin);

declare module '@univerjs/core/facade' {
    interface FUniver extends IFUniver${className}Mixin {}
}
`,
};

if (fs.existsSync(outDir)) fail(`Directory already exists: ${outDir}`);

for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(outDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}

console.log(`Scaffolded ${pluginName} at ${outDir}`);
