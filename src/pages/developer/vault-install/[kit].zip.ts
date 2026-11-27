import type { APIRoute } from 'astro';
import { createVaultKitArchive, installableVaultKits } from '../../../lib/tools/vault-install';

export const getStaticPaths = () =>
    installableVaultKits.map((kit) => ({ params: { kit: kit.id } }));

export const GET: APIRoute = async ({ params }) => {
    const kit = installableVaultKits.find(({ id }) => id === params.kit);
    if (!kit) return new Response(null, { status: 404 });
    return new Response(await createVaultKitArchive(kit), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="kharbout-vault-${kit.id}.zip"`,
        },
    });
};
