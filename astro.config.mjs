import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@tailwindcss/vite';
import vaultPreviews from './scripts/vault-previews.mjs';

// Both applications share this checkout. Only portfolio assets belong in the static export.
const staticFiles = new URL('./.astro/workbench-public/', import.meta.url);
const sandboxCors = {
    origin: ['null', /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/],
};
mkdirSync(staticFiles, { recursive: true });
for (const name of ['favicon.svg', 'robots.txt', 'photo.jpg']) {
    const source = new URL('./public/' + name, import.meta.url);
    const target = new URL(name, staticFiles);
    if (existsSync(source)) copyFileSync(source, target);
    else rmSync(target, { force: true });
}

export default defineConfig({
    site: process.env.SITE_URL || undefined,
    output: 'static',
    publicDir: fileURLToPath(staticFiles),
    integrations: [vaultPreviews(), react(), mdx()],
    vite: {
        configFile: false,
        plugins: [tailwind()],
        // Preview modules are public assets loaded by the Vault's opaque sandbox.
        preview: { cors: sandboxCors },
    },
    markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark-dimmed' } } },
    devToolbar: { enabled: false },
});
