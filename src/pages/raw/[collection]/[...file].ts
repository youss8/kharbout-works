import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths = (() => {
    const documents = import.meta.glob<string>('/src/content/{ai-kit,templates}/**/*.md', {
        query: '?raw', import: 'default', eager: true,
    });
    return Object.entries(documents).map(([path, content]) => {
        const [collection, ...file] = path.replace('/src/content/', '').split('/');
        return { params: { collection, file: file.join('/') }, props: { content } };
    });
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(props.content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
