import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Exercise the same copy-and-build path as a consumer of the Livewire source tab.
const root = fileURLToPath(new URL('../../test-results/livewire-runtime/', import.meta.url));
const kit = fileURLToPath(new URL('../../src/content/vault/office-pdf-preview/', import.meta.url));
const entry = 'resources/js/office-preview/register.ts';
const target = resolve(root, 'resources/js/office-preview');
await mkdir(target, { recursive: true });
for (const name of await readdir(kit)) {
    if (name.endsWith('.ts') || name.startsWith('sample.')) {
        await copyFile(resolve(kit, name), resolve(target, name));
    }
}
await build({
    root,
    configFile: false,
    publicDir: false,
    base: '/build/',
    logLevel: 'warn',
    build: {
        manifest: 'manifest.json',
        outDir: 'public/build',
        emptyOutDir: false,
        rollupOptions: { input: resolve(root, entry) },
    },
});
