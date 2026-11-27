import type { APIRoute } from 'astro';
import { installableVaultKits, vaultKitRegistryItem } from '../../../lib/tools/vault-install';

export const getStaticPaths = () =>
    installableVaultKits.map((kit) => ({ params: { kit: kit.id } }));

export const GET: APIRoute = ({ params }) => {
    const kit = installableVaultKits.find(({ id }) => id === params.kit);
    if (!kit) return new Response(null, { status: 404 });
    return new Response(JSON.stringify(vaultKitRegistryItem(kit), null, 2) + '\n', {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
};
