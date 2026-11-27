import type { APIRoute } from 'astro';
import JSZip from 'jszip';
import license from '../../../LICENSE?raw';
import component from '../../content/vault/status-gate-lifecycle/Example.php?raw';
import model from '../../content/vault/status-gate-lifecycle/model.ts?raw';
import view from '../../content/vault/status-gate-lifecycle/view.blade.php?raw';
import recorded from '../../data/stack-parity-livewire.json';
import recordedSource from '../../data/stack-parity-livewire.json?raw';
import fixture from '../../data/stack-parity.json?raw';
import runner from '../../lib/tools/stack-parity.ts?raw';
import nodeTest from '../../../tests/stack-parity.test.mjs?raw';
import phpTest from '../../../tests/workbench/stack-parity-livewire.php?raw';

const files = {
    LICENSE: license,
    'src/content/vault/status-gate-lifecycle/Example.php': component,
    'src/content/vault/status-gate-lifecycle/model.ts': model,
    'src/content/vault/status-gate-lifecycle/view.blade.php': view,
    'src/data/stack-parity-livewire.json': recordedSource,
    'src/data/stack-parity.json': fixture,
    'src/lib/tools/stack-parity.ts': runner,
    'tests/stack-parity.test.mjs': nodeTest,
    'tests/workbench/stack-parity-livewire.php': phpTest,
};

const readme = `# Stack Parity Lab

Use Node.js 24 or later to run the React model and verify it against the recorded Livewire trace:

\`node --test tests/stack-parity.test.mjs\`

To repeat the Livewire test, use PHP 8.4 or later with Composer 2. From the extracted folder, run \`composer install\` followed by \`php tests/workbench/stack-parity-livewire.php\`. The capture mounts the original Livewire component, applies the fixture, asserts the expected state, and prints a fresh JSON trace.

The shared fixture is \`src/data/stack-parity.json\`. It starts a review, attempts a stale write after a concurrent change, then reloads and approves. The rejected write emits no event. Approval produces an in-memory \`status_changed\` event containing the source state, destination state, version, and reason. The included Livewire trace records its runtime versions and fingerprints of the fixture, component, and view. The Node tests verify those fingerprints and check the original React model.
`;

export const GET: APIRoute = async () => {
    const archive = new JSZip();
    for (const [path, source] of Object.entries(files)) archive.file(path, source);
    archive.file('README.md', readme);
    archive.file(
        'composer.json',
        JSON.stringify(
            {
                name: 'kharbout-works/stack-parity',
                require: {
                    php: '^8.4',
                    'laravel/framework': recorded.laravelVersion.replace(/^v/u, ''),
                    'livewire/livewire': recorded.livewireVersion.replace(/^v/u, ''),
                },
                autoload: { 'psr-4': { 'App\\': 'app/' } },
            },
            null,
            2,
        ) + '\n',
    );
    const bytes = await archive.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    return new Response(bytes, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="stack-parity.zip"',
        },
    });
};
