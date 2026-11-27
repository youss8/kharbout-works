import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, realpath, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [destination, option, ...extra] = process.argv.slice(2);
const usage = 'Usage: node install.mjs <existing React project> [--apply]';

async function statIfPresent(path) {
    try {
        return await lstat(path);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

async function checkDestination(root, file) {
    const parts = file.split('/');
    const target = resolve(root, file);
    for (let depth = 1; depth < parts.length; depth++) {
        const parent = resolve(root, ...parts.slice(0, depth));
        const info = await statIfPresent(parent);
        if (info && (info.isSymbolicLink() || !info.isDirectory())) {
            throw new Error(`Destination parent must be a real directory: ${parent}`);
        }
    }
    if (await statIfPresent(target)) throw new Error(`Destination already exists: ${target}`);
    return target;
}

async function run() {
    if (!destination || extra.length || (option && option !== '--apply')) throw new Error(usage);
    const root = await realpath(resolve(destination));
    const manifest = JSON.parse(
        await readFile(new URL('./install-manifest.json', import.meta.url), 'utf8'),
    );
    const packageInfo = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
    if (!packageInfo.dependencies?.react && !packageInfo.devDependencies?.react) {
        throw new Error('The destination package.json must declare React.');
    }
    const files = manifest.files;
    if (
        manifest.version !== 1 ||
        !Array.isArray(files) ||
        files.length === 0 ||
        new Set(files).size !== files.length ||
        files.some(
            (file) =>
                typeof file !== 'string' ||
                !/^src\/kharbout\/(?:[\w-]+\/)*[\w.-]+$/u.test(file) ||
                file.endsWith('/.') ||
                file.endsWith('/..'),
        )
    ) {
        throw new Error('The install manifest contains an invalid file path.');
    }

    const plan = await Promise.all(
        files.map(async (file) => {
            const source = fileURLToPath(new URL(file, import.meta.url));
            const info = await lstat(source);
            if (info.isSymbolicLink() || !info.isFile())
                throw new Error(`Expected a bundled source file: ${file}`);
            return { file, source, target: await checkDestination(root, file) };
        }),
    );
    console.log(option === '--apply' ? 'Installing files:' : 'Preview (no files written):');
    for (const { file } of plan) console.log(`  ${file}`);
    if (option !== '--apply') return;

    const written = [];
    try {
        for (const { file, source, target } of plan) {
            await mkdir(dirname(await checkDestination(root, file)), { recursive: true });
            await checkDestination(root, file);
            await copyFile(source, target, constants.COPYFILE_EXCL);
            written.push(target);
        }
    } catch (error) {
        await Promise.allSettled(written.map((path) => unlink(path)));
        throw error;
    }
    console.log('Installed. See README.md in this archive for the component entry points.');
}

try {
    await run();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
