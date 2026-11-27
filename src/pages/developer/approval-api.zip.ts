import type { APIRoute } from 'astro';
import JSZip from 'jszip';
import license from '../../../LICENSE?raw';
import environment from '../../../kit/modules/approval-api/.env.example?raw';

const prefix = '../../../kit/modules/approval-api/';
const files = import.meta.glob<string>(
    '../../../kit/modules/approval-api/{README.md,artisan,composer.json,composer.lock,phpunit.xml,app/**/*.php,bootstrap/app.php,config/*.php,database/**/*.php,examples/*.json,public/index.php,routes/*.php,scripts/*.php,tests/**/*.php,traces/*.json}',
    { eager: true, query: '?raw', import: 'default' },
);

export const GET: APIRoute = async () => {
    const project = new JSZip();
    project.folder('bootstrap/cache');
    project.folder('storage/logs');
    for (const [path, source] of Object.entries(files))
        project.file(path.slice(prefix.length), source);
    project.file('LICENSE', license);
    project.file('.env.example', environment);
    return new Response(
        await project.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' }),
        {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="kharbout-approval-api.zip"',
            },
        },
    );
};
