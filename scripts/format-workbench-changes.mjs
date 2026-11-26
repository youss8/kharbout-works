import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// CI supplies the revision before the change. Local runs include staged and unstaged edits.
const base = process.env.FORMAT_BASE_REF || 'HEAD';
const mode = process.argv.includes('--write') ? '--write' : '--check';
function paths(args) {
    return execFileSync('git', [...args, '--', 'src'], { encoding: 'utf8' })
        .split('\0')
        .filter(Boolean);
}

const tracked = /^0+$/.test(base)
    ? paths(['ls-files', '-z'])
    : paths(['diff', '--name-only', '--diff-filter=ACMRT', '-z', base]);
const added = paths(['ls-files', '--others', '--exclude-standard', '-z']);
const files = [...new Set([...tracked, ...added])].filter(
    (path) => !path.startsWith('src/content/') && /\.(?:astro|css|[cm]?js|jsx|tsx?)$/.test(path),
);

if (files.length) {
    const prettier = fileURLToPath(
        new URL('../node_modules/prettier/bin/prettier.cjs', import.meta.url),
    );
    const result = spawnSync(process.execPath, [prettier, mode, ...files], { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} else {
    console.log('No changed workbench source files to format.');
}
