import type { APIRoute } from 'astro';
import JSZip from 'jszip';
import license from '../../../../LICENSE?raw';

const files = import.meta.glob<string>(
    '../../../../kit/workflows/approval-workflow/{ApprovalDesk.jsx,README.md,index.html,main.jsx,package.json,package-lock.json,permission-matrix.json,smoke.test.mjs,style.css,workflow.mjs}',
    { eager: true, query: '?raw', import: 'default' },
);

export const GET: APIRoute = async () => {
    const archive = new JSZip();
    const project = archive.folder('approval-workflow')!;
    for (const [path, source] of Object.entries(files))
        project.file(path.split('/').at(-1)!, source);
    project.file('LICENSE', license);
    const bytes = await archive.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    return new Response(bytes, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="approval-workflow.zip"',
        },
    });
};
