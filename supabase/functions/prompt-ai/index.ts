import { adminClient, endpoint, verifiedUser } from '../_shared/http.ts';
import { maximumChargeMicros, providerRequest, readOutput, readRequest, requestByteLimit } from './contract.ts';

class RequestTooLarge extends Error {}

async function readBody(request: Request): Promise<unknown> {
    const reader = request.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let body = '';
    try {
        while (true) {
            const next = await reader.read();
            if (next.done) break;
            bytes += next.value.byteLength;
            if (bytes > requestByteLimit) {
                await reader.cancel();
                throw new RequestTooLarge();
            }
            body += decoder.decode(next.value, { stream: true });
        }
        return JSON.parse(body + decoder.decode());
    } finally {
        reader.releaseLock();
    }
}

interface ResponsePayload {
    status?: string;
    output?: { content?: { type: string; text?: string }[] }[];
    usage?: { input_tokens: number; output_tokens: number };
}

Deno.serve(endpoint(async (request, reply) => {
    const user = await verifiedUser(request);
    if (!user) return reply({ error: 'prompt_forbidden' }, 401);
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) return reply({ error: 'ai_unavailable' }, 503);
    let raw: unknown;
    try {
        raw = await readBody(request);
    } catch (error) {
        return error instanceof RequestTooLarge ? reply({ error: 'ai_length' }, 413) : reply({ error: 'ai_error' }, 400);
    }
    const input = readRequest(raw);
    if (!input) return reply({ error: 'ai_error' }, 400);
    const provider = providerRequest(input);
    if (new TextEncoder().encode(JSON.stringify(provider)).byteLength > requestByteLimit + 2_000) {
        return reply({ error: 'ai_length' }, 413);
    }
    const admin = adminClient();
    const { data: reservation, error } = await admin.rpc('reserve_prompt_ai', {
        actor: user.id, request_action: input.action, hold_micros: maximumChargeMicros,
    });
    if (error || !reservation?.reservation) {
        const reason = reservation?.error ?? 'ai_unavailable';
        return reply({ error: reason }, reason === 'ai_limit' ? 429 : reason === 'prompt_forbidden' ? 403 : 503);
    }

    const started = performance.now();
    let outcome = 'provider_error';
    let billed: number | null = null;
    try {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
            body: JSON.stringify(provider),
            signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) return reply({ error: response.status === 429 ? 'ai_unavailable' : 'ai_error' }, 502);
        const payload = await response.json() as ResponsePayload;
        if (Number.isSafeInteger(payload.usage?.input_tokens) && Number.isSafeInteger(payload.usage?.output_tokens)) {
            // Use standard input pricing for cached tokens to keep reconciliation conservative.
            billed = Math.ceil(payload.usage!.input_tokens * 0.75 + payload.usage!.output_tokens * 4.50);
        }
        const parts = (payload.output ?? []).flatMap(item => item.content ?? []);
        if (parts.some(part => part.type === 'refusal')) {
            outcome = 'refused';
            return reply({ error: 'ai_refused' }, 422);
        }
        if (payload.status !== 'completed') return reply({ error: 'ai_error' }, 502);
        const output = parts.filter(part => part.type === 'output_text').map(part => part.text ?? '').join('');
        const result = readOutput(input, output);
        if (!result) return reply({ error: 'ai_error' }, 502);
        outcome = 'success';
        return reply(result);
    } catch (error) {
        if (error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name)) {
            outcome = 'timeout';
            return reply({ error: 'ai_timeout' }, 504);
        }
        return reply({ error: 'ai_error' }, 502);
    } finally {
        // An unconfirmed upstream charge keeps its reservation until the monthly window rolls over.
        await admin.rpc('finish_prompt_ai', {
            reservation: reservation.reservation, billed_micros: billed, outcome,
            elapsed_ms: Math.round(performance.now() - started),
        }).then(() => undefined, () => undefined);
    }
}));
