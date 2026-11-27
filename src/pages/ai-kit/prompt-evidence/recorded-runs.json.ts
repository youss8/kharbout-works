import type { APIRoute } from 'astro';
import recorded from '../../../lib/prompt-builder/example-runs.json';

export const GET: APIRoute = () =>
    new Response(JSON.stringify(recorded, null, 2) + '\n', {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
