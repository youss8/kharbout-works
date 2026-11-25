import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import licenseText from '../../../../../LICENSE?raw';
import { skillGuides } from '../../../../data/claude-skills';
import { guideArchive, guideFiles } from '../../../../lib/claude-skill-exports';

export const getStaticPaths = (() => skillGuides.flatMap(guide =>
    ['SKILL.md', 'guide.json', guide.slug + '.zip'].map(file => ({
        params: { slug: guide.slug, file }, props: { guide, file },
    }))
)) satisfies GetStaticPaths;

export const GET: APIRoute<InferGetStaticPropsType<typeof getStaticPaths>> = async ({ props: { guide, file } }) => {
    const headers = { 'Content-Disposition': 'attachment; filename="' + file + '"' };
    if (file === guide.slug + '.zip') {
        return new Response(await guideArchive([guide], licenseText), {
            headers: { ...headers, 'Content-Type': 'application/zip' },
        });
    }
    const { markdown, json } = guideFiles(guide, licenseText);
    const isMarkdown = file === 'SKILL.md';
    return new Response(isMarkdown ? markdown : json, {
        headers: { ...headers, 'Content-Type': isMarkdown ? 'text/markdown; charset=utf-8' : 'application/json; charset=utf-8' },
    });
};
