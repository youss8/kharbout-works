import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Vite compiles the TSX shown in the code tab. Tailwind scans both unescaped source languages.
const content = resolve('src/content/vault');
const output = resolve('.astro/vault-previews');
function synchronize() {
    mkdirSync(output, { recursive: true });
    const expected = new Set();
    for (const file of existsSync(content) ? readdirSync(content) : []) {
        if (!file.endsWith('.json')) continue;
        const item = JSON.parse(readFileSync(join(content, file), 'utf8'));
        if (file !== item.id + '.json' || !/^[a-z0-9-]+$/.test(item.id)) throw new Error('Invalid vault identifier in ' + file);
        for (const [extension, source] of [['tsx', item.codeReact], ['html', item.codeAlpine]]) {
            const name = item.id + '.' + extension;
            expected.add(name);
            const path = join(output, name);
            if (!existsSync(path) || readFileSync(path, 'utf8') !== source) writeFileSync(path, source);
        }
    }
    for (const file of readdirSync(output)) {
        if (/^[a-z0-9-]+\.(tsx|html)$/.test(file) && !expected.has(file)) unlinkSync(join(output, file));
    }
}

export default function vaultPreviews() {
    return {
        name: 'vault-source-previews',
        hooks: {
            'astro:config:setup': synchronize,
            'astro:server:setup': ({ server }) => {
                server.watcher.on('all', (event, file) => {
                    if (['add', 'change', 'unlink'].includes(event) && file.endsWith('.json') && resolve(file).startsWith(content + (process.platform === 'win32' ? '\\' : '/'))) synchronize();
                });
            },
        },
    };
}
