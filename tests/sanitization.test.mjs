import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function files(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const child = path.join(dir, entry.name);
        return entry.isDirectory() ? files(child) : entry.isFile() ? [child] : [];
    });
}

// A private CI setting can supply employer, staff and internal product names without publishing them.
const forbidden = (process.env.VAULT_FORBIDDEN_TERMS ?? '')
    .split(/\r?\n/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
const internalUrl =
    /(?:https?|wss?):\/\/(?:[^/\s@]+@)?(?:localhost\b|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[(?:::1|f[cd][0-9a-f:]+|fe80:[0-9a-f:]+)\]|[\w.-]+\.(?:corp|internal|local|lan|intranet)\b|[\w-]+(?=[:/]))/i;
const citation = /\[\s*cite\s*:/i;
const secret =
    /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----|(?:AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{32,}|github_pat_\w{30,}/;

test('sanitization detects private hosts, credentials, and accidental citation markup', () => {
    for (const sample of [
        'http://localhost:5173',
        'wss://172.31.1.1/data',
        'https://payroll.corp/x',
        'http://[::1]/',
        'https://intranet/pay',
    ])
        assert.match(sample, internalUrl);
    assert.doesNotMatch('https://github.com/youss8', internalUrl);
    assert.match('[cite: 123]', citation);
    assert.match('ghp_' + 'x'.repeat(36), secret);
});

test('source and public assets contain no private identifiers, internal URLs or citation artifacts', (t) => {
    const inputs = [...files('src'), ...files('public')];
    const failures = [];
    for (const file of inputs) {
        let content = readFileSync(file).toString('utf8');
        if (
            file.startsWith(path.join('public', 'build', 'assets') + path.sep) &&
            file.endsWith('.js')
        ) {
            // Inertia's SSR URL parser uses this synthetic base when window is unavailable.
            content = content.replace(
                /(new URL\([^,]+,\w+\?)\x60http:\/\/localhost\x60(:window\.location\.toString\(\)\))/g,
                '$1""$2',
            );
        }
        const lower = content.toLowerCase();
        if (
            internalUrl.test(content) ||
            citation.test(content) ||
            secret.test(content) ||
            forbidden.some((term) => lower.includes(term))
        )
            failures.push(file);
    }
    assert.deepEqual(failures, [], 'Review the listed files for unpublished identifiers');
    t.diagnostic(inputs.length + ' files scanned');
});

test('Vault examples only load executable code from the local build', () => {
    const executable = /(?:<script\b[^>]*?\bsrc\s*=\s*["']|\bimport\s*\(\s*["']|\bfrom\s*["'])(?:https?:)?\/\//i;
    for (const file of files('src/content/vault').filter(path => /\.(html|tsx?|php|js|json)$/.test(path))) {
        assert.doesNotMatch(readFileSync(file, 'utf8'), executable, file);
    }
});
