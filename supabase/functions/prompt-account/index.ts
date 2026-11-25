import { adminClient, endpoint, verifiedUser } from '../_shared/http.ts';

Deno.serve(endpoint(async (request, reply) => {
    const user = await verifiedUser(request);
    if (!user) return reply({ error: 'prompt_forbidden' }, 401);
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    if (error) return reply({ error: 'cloud_error' }, 500);
    return reply({ deleted: true });
}));
