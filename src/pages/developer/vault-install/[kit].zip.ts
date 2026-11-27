import type { APIRoute } from 'astro';
import {
    createVaultKitArchive,
    installableVaultKits,
    vaultKitArchiveStem,
} from '../../../lib/tools/vault-install';

export const getStaticPaths = () =>
    installableVaultKits.flatMap(({ id }) =>
        [id, vaultKitArchiveStem(id)].map((kit) => ({ params: { kit } })),
    );

export const GET: APIRoute = async ({ params }) => {
    const kit = installableVaultKits.find(
        ({ id }) => id === params.kit || vaultKitArchiveStem(id) === params.kit,
    );
    if (!kit) return new Response(null, { status: 404 });
    return new Response(await createVaultKitArchive(kit), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${vaultKitArchiveStem(kit.id)}.zip"`,
        },
    });
};
