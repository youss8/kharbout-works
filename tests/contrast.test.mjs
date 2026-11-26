import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const themes = {
    light: /^:root\s*\{([^}]+)\}/m,
    dark: /^\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/m,
};

function luminance(hex) {
    assert.match(hex ?? '', /^#[\da-f]{6}$/i);
    const [r, g, b] = hex
        .slice(1)
        .match(/../g)
        .map((channel) => {
            const s = parseInt(channel, 16) / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first, second) {
    const a = luminance(first),
        b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [theme, selector] of Object.entries(themes)) {
    const block = css.match(selector)?.[1];
    assert.ok(block, 'Missing palette for ' + theme);
    const colors = Object.fromEntries(
        [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [m[1], m[2]]),
    );
    const surfaces = ['bg-surface', 'bg-canvas', 'bg-subtle'];
    const textPairs = ['ink-primary', 'ink-secondary', 'ink-muted', 'accent-primary'].flatMap(
        (fg) => surfaces.map((bg) => [fg, bg]),
    );
    textPairs.push(['accent-primary', 'accent-tint']);
    for (const tone of ['ok', 'warn', 'crit'])
        textPairs.push(
            ['status-' + tone, 'status-' + tone + '-tint'],
            ['status-' + tone, 'bg-surface'],
        );
    const controls = surfaces.map((bg) => ['border-strong', bg]);
    for (const [name, minimum, pairs] of [
        ['text', 4.5, textPairs],
        ['control boundaries', 3, controls],
    ]) {
        test(theme + ' ' + name + ' meet AA', (t) => {
            const measurements = pairs.map(([fg, bg]) => {
                const ratio = contrast(colors[fg], colors[bg]);
                assert.ok(ratio >= minimum, [theme, fg, bg, ratio].join(' '));
                return ratio;
            });
            t.diagnostic(
                pairs.length + ' pairs, minimum ' + Math.min(...measurements).toFixed(2) + ':1',
            );
        });
    }
}
