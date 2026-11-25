import type { APIRoute } from 'astro';
import licenseText from '../../../../LICENSE?raw';
import { skillGuides } from '../../../data/claude-skills';
import { guideArchive } from '../../../lib/claude-skill-exports';

export const GET: APIRoute = async () => new Response(await guideArchive(skillGuides, licenseText), {
    headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="catalogue.zip"' },
});
