import JSZip from 'jszip';
import license from '../../../LICENSE?raw';
import manifestSource from '../../../kit/components/search-dialog/package.json?raw';
import lockSource from '../../../kit/components/search-dialog/package-lock.json?raw';
import searchExample from '../../../kit/components/search-dialog/Example.tsx?raw';
import searchDialog from '../../../kit/components/search-dialog/SearchDialog.tsx?raw';
import searchStyles from '../../../kit/components/search-dialog/search-dialog.css?raw';
import hostHtml from '../../../kit/developer/vault-install/index.html?raw';
import hostCss from '../../../kit/developer/vault-install/host.css?raw';
import installer from '../../../kit/developer/vault-install/install.mjs?raw';
import searchMain from '../../../kit/developer/vault-install/search-main.tsx.txt?raw';
import searchSmoke from '../../../kit/developer/vault-install/search.smoke.mjs?raw';
import viewsMain from '../../../kit/developer/vault-install/views-main.tsx.txt?raw';
import viewsSmoke from '../../../kit/developer/vault-install/views.smoke.mjs?raw';
import viewsExample from '../../content/vault/saved-views-sticky-filters/Example.tsx?raw';
import viewsModel from '../../content/vault/saved-views-sticky-filters/model.ts?raw';
import viewsStyles from '../../content/vault/saved-views-sticky-filters/style.css?raw';
import headerPicker from '../../content/vault/saved-views-sticky-filters/header-picker.ts?raw';
import useKitModel from '../../components/vault/useKitModel.ts?raw';
import demoStorage from '../kernels/demoStorage.ts?raw';
import vaultStyles from '../../styles/vault-preview.css?raw';

interface InstallableKit {
    id: string;
    title: string;
    summary: string;
    preview: string;
    entry: string;
    setup: string;
    main: string;
    smoke: string;
    testCommand: string;
    files: Record<string, string>;
}

const searchPath = 'src/kharbout/kits/search-dialog';
const viewsPath = 'src/kharbout/content/vault/saved-views-sticky-filters';
const searchEntry = `${searchPath}/SearchDialog.tsx`;

export const installableVaultKits: InstallableKit[] = [
    {
        id: 'search-dialog',
        title: 'Keyboard search dialog',
        summary:
            'Open a native dialog, navigate results with the keyboard, and return focus to the trigger.',
        preview: '/developer/vault-install/keyboard-search/',
        entry: searchEntry,
        setup: 'Import the dialog into a React host and let the host supply results, open state, and the selection callback. The component imports its own CSS. The included Example shows how to bind Ctrl+K and Cmd+K once.',
        main: searchMain,
        smoke: searchSmoke,
        testCommand: `vite build --ssr ${searchEntry} --outDir .vault-smoke --emptyOutDir && node --test smoke.test.mjs`,
        files: {
            [searchEntry]: searchDialog,
            [`${searchPath}/search-dialog.css`]: searchStyles,
            [`${searchPath}/Example.tsx`]: searchExample,
            [`${searchPath}/LICENSE`]: license,
        },
    },
    {
        id: 'saved-views',
        title: 'Role-scoped saved views',
        summary: 'Save table filters by role, then switch roles to check what stays visible.',
        preview: '/vault/preview/saved-views-sticky-filters/?engine=react',
        entry: `${viewsPath}/Example.tsx`,
        setup: 'Import the React example and both CSS files. The fixture uses browser storage for saved preferences. Replace the example records and give the host responsibility for the actual user role and data access.',
        main: viewsMain,
        smoke: viewsSmoke,
        testCommand: 'node --test smoke.test.mjs',
        files: {
            [`${viewsPath}/Example.tsx`]: viewsExample,
            [`${viewsPath}/model.ts`]: viewsModel,
            [`${viewsPath}/header-picker.ts`]: headerPicker,
            [`${viewsPath}/style.css`]: viewsStyles,
            [`${viewsPath}/LICENSE`]: license,
            'src/kharbout/components/vault/useKitModel.ts': useKitModel,
            'src/kharbout/lib/kernels/demoStorage.ts': demoStorage,
            'src/kharbout/styles/vault-preview.css': vaultStyles,
        },
    },
];

const baseManifest = JSON.parse(manifestSource) as {
    name: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
};

export const vaultKitDependencies = {
    runtime: Object.entries(baseManifest.dependencies).map(
        ([name, version]) => `${name}@${version}`,
    ),
    development: Object.entries(baseManifest.devDependencies).map(
        ([name, version]) => `${name}@${version}`,
    ),
};

export function vaultKitRegistryItem(kit: InstallableKit) {
    return {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: `kharbout-${kit.id}`,
        type: 'registry:block',
        title: kit.title,
        description: kit.summary,
        files: Object.entries(kit.files).map(([path, content]) => ({
            path,
            target: `~/${path}`,
            type: 'registry:file',
            content,
        })),
    };
}

function readme(kit: InstallableKit) {
    return `# ${kit.title}

${kit.summary}

## Try the verified standalone example

Use Node.js 24 or later and npm. Extract this ZIP into an empty directory and run the following commands there.

\`\`\`sh
npm ci
npm test
npm run dev
\`\`\`

Open the address Vite prints. Run \`npm run build\` to build the hosted output. React and React DOM are pinned in \`package-lock.json\` with the Vite build dependency.

## Install the source into an existing React project

Run the first command from the extracted directory to see what would be copied. Run the second to install after reviewing the paths.

\`\`\`sh
node install.mjs /path/to/react-project
node install.mjs /path/to/react-project --apply
\`\`\`

The installer checks the destination package and requires a vacant path for every file. It copies the listed source only. The host needs React with TSX and CSS import support.

Entry point is \`${kit.entry}\`.

${kit.setup}

Keep the bundled MIT notice with redistributed source.
`;
}

export async function createVaultKitArchive(kit: InstallableKit): Promise<Uint8Array<ArrayBuffer>> {
    const name = `kharbout-vault-${kit.id}`;
    const manifest = {
        ...baseManifest,
        name,
        scripts: { ...baseManifest.scripts, test: kit.testCommand },
    };
    const lock = JSON.parse(lockSource) as {
        name: string;
        packages: Record<string, { name: string }>;
    };
    lock.name = name;
    lock.packages[''].name = name;
    const json = (data: object) => JSON.stringify(data, null, 2) + '\n';
    const contents: Record<string, string> = {
        ...kit.files,
        'package.json': json(manifest),
        'package-lock.json': json(lock),
        'index.html': hostHtml,
        'src/main.tsx': kit.main,
        'src/host.css': hostCss,
        'smoke.test.mjs': kit.smoke,
        'install.mjs': installer,
        'install-manifest.json': json({ version: 1, files: Object.keys(kit.files) }),
        'README.md': readme(kit),
        LICENSE: license,
        '.gitignore': 'node_modules/\ndist/\n.vault-smoke/\n',
    };
    const archive = new JSZip();
    for (const [file, content] of Object.entries(contents)) {
        archive.file(file, content, { date: new Date(Date.UTC(2000, 0, 1)), createFolders: false });
    }
    return new Uint8Array(
        await archive.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' }),
    );
}
