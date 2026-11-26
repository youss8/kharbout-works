import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const directory = new URL('../src/data/diagrams/', import.meta.url);
const output = new URL('rendered/', directory);
const diagrams = (await readdir(directory)).filter(name => name.endsWith('.mmd')).sort();
const themes = {
    light: {
        primaryColor: '#E7F2EE', primaryTextColor: '#101412', primaryBorderColor: '#53786C',
        lineColor: '#4A5550', background: '#FFFFFF',
    },
    dark: {
        darkMode: true, primaryColor: '#18201D', primaryTextColor: '#ECF1EE',
        primaryBorderColor: '#75978D', lineColor: '#A1B0AA', background: '#121816',
    },
};
const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
    await mkdir(output, { recursive: true });
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.addScriptTag({
        path: fileURLToPath(new URL('../node_modules/mermaid/dist/mermaid.min.js', import.meta.url)),
    });
    for (const filename of diagrams) {
        const id = filename.slice(0, -4);
        const source = (await readFile(new URL(filename, directory), 'utf8')).replaceAll('\r\n', '\n');
        const digest = createHash('sha256').update(source).digest('hex');
        for (const [theme, colors] of Object.entries(themes)) {
            const svg = await page.evaluate(async ({ renderId, source, colors }) => {
                window.mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme: 'base',
                    deterministicIds: true,
                    deterministicIDSeed: renderId,
                    themeVariables: { ...colors, fontFamily: 'Arial, sans-serif' },
                });
                const result = await window.mermaid.render(renderId, source);
                return result.svg;
            }, { renderId: id + '-' + theme, source, colors });
            await writeFile(new URL(id + '-' + theme + '.svg', output), '<!-- Mermaid source SHA-256 ' + digest + ' -->\n' + svg + '\n');
        }
    }
} finally {
    await browser.close();
}
