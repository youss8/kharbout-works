import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.119.2/cors';

const url = Deno.env.get('SUPABASE_URL') ?? '';

function platformKey(bundle: string, fallback: string): string {
    const configured = Deno.env.get(bundle);
    if (configured) {
        const keys = JSON.parse(configured) as Record<string, string>;
        if (keys.default) return keys.default;
    }
    return Deno.env.get(fallback) ?? '';
}

const authOptions = { autoRefreshToken: false, persistSession: false };

export function adminClient() {
    return createClient(url, platformKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), { auth: authOptions });
}

export async function verifiedUser(request: Request) {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return null;
    const client = createClient(url, platformKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'), { auth: authOptions });
    const { data, error } = await client.auth.getUser(token);
    return error || !data.user?.email_confirmed_at ? null : data.user;
}

export function endpoint(handler: (request: Request, reply: (payload: unknown, status?: number) => Response) => Promise<Response>) {
    const origins = (Deno.env.get('PROMPT_BUILDER_ORIGINS') ?? '').split(',').map(origin => origin.trim());
    return async (request: Request) => {
        const origin = request.headers.get('origin') ?? '';
        const allow = !origin || origins.includes(origin);
        const headers = new Headers({
            'content-type': 'application/json',
            'cache-control': 'no-store',
            'vary': 'Origin',
        });
        if (origin && allow) {
            headers.set('access-control-allow-origin', origin);
            headers.set('access-control-allow-methods', 'POST, OPTIONS');
            headers.set('access-control-allow-headers', corsHeaders['Access-Control-Allow-Headers']);
        }
        const reply = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers });
        if (!allow) return reply({ error: 'prompt_forbidden' }, 403);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method !== 'POST') return reply({ error: 'cloud_error' }, 405);
        try {
            return await handler(request, reply);
        } catch {
            return reply({ error: 'cloud_error' }, 500);
        }
    };
}
