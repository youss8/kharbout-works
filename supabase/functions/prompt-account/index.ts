import { adminClient, endpoint, verifiedUser } from '../_shared/http.ts';

Deno.serve(endpoint(async (request, reply) => {
    const user = await verifiedUser(request);
    if (!user) return reply({ error: 'prompt_forbidden' }, 401);
    const admin = adminClient();
    const { data: blocked, error: checkError } = await admin.rpc('prompt_account_has_shared_folders', { account_id: user.id });
    if (checkError) return reply({ error: 'cloud_error' }, 500);
    if (blocked) return reply({ error: 'prompt_account_shared_folders' }, 409);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return reply({ error: 'cloud_error' }, 500);
    return reply({ deleted: true });
}));
