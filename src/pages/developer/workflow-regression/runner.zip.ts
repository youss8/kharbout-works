import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { build } from 'vite';
import license from '../../../../LICENSE?raw';

const runner = `import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareWorkflowSources, workflowOutcome } from './runtime.mjs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const comparison = compareWorkflowSources({
    baseline: read('baseline.json'),
    candidate: read('candidate.json'),
    suite: read('acceptance-suite.json'),
});
if (comparison.errors) {
    throw new Error(Object.entries(comparison.errors).flatMap(([name, errors]) =>
        errors.map((error) => name + ': ' + error)).join('\\n'));
}
for (const row of comparison.report.rows) {
    test(row.title, () => {
        assert.deepEqual(workflowOutcome(row.candidate), row.expected, row.candidate.reason);
    });
}
`;

const readme = `# Workflow regression suite

Use Node.js 24 or later. Run \`npm test\` or \`node --test regression.test.mjs\` in this directory. No dependency installation is required.

The command checks the candidate policy against each independently specified result in \`acceptance-suite.json\`. It exits with a failing status if a decision, next state, or audit event differs. The baseline is retained for comparison in the workbench. This tests a policy model using the supplied request facts. To verify a deployed application, run the same cases against its server-side authorization and persistence.

Keep the policy JSON files and acceptance suite under version control. Run the command in CI before merging changes to the contract. The bundled runtime is the same evaluator used by Kharbout Works.
`;

export const GET: APIRoute = async () => {
    const result = await build({
        configFile: false,
        logLevel: 'error',
        publicDir: false,
        build: {
            lib: {
                entry: resolve('src/lib/tools/workflow-regression.ts'),
                formats: ['es'],
            },
            minify: false,
            write: false,
            target: 'node24',
        },
    });
    const bundles = Array.isArray(result) ? result : [result];
    const output = bundles.flatMap((bundle) => ('output' in bundle ? bundle.output : []));
    const runtime = output[0];
    if (
        output.length !== 1 ||
        runtime?.type !== 'chunk' ||
        runtime.imports.length ||
        runtime.dynamicImports.length
    ) {
        throw new Error('The workflow regression runtime must be a standalone module.');
    }
    const require = createRequire(import.meta.url);
    const zodLicense = await readFile(
        resolve(require.resolve('zod/package.json'), '../LICENSE'),
        'utf8',
    );
    const archive = new JSZip();
    archive.file('LICENSE', license);
    archive.file('README.md', readme);
    archive.file('regression.test.mjs', runner);
    archive.file('runtime.mjs', `/*! Includes Zod\n${zodLicense.trim()}\n*/\n${runtime.code}`);
    archive.file(
        'package.json',
        JSON.stringify(
            {
                name: 'workflow-regression',
                private: true,
                scripts: { test: 'node --test regression.test.mjs' },
            },
            null,
            2,
        ) + '\n',
    );
    const data = await archive.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    return new Response(data, {
        headers: { 'Content-Type': 'application/zip' },
    });
};
