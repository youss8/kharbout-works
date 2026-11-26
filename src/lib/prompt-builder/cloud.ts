import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import type { Draft } from './model';

export interface CloudDraftSummary {
    id: string;
    name: string;
    created_by: string | null;
    revision: number;
    folder_id: string | null;
}
export interface CloudDraft extends CloudDraftSummary { payload: unknown }

export interface Folder { id: string; name: string; owner_id: string }
export type MemberRole = 'viewer' | 'editor';
export interface Member { user_id: string; display_email: string; role: MemberRole }
export interface Invitation { id: string; role: MemberRole; created_at: string; expires_at: string }
export interface VersionSummary { revision: number; created_at: string; name: string }
export interface Version extends VersionSummary { payload: unknown }
export interface Share { id: string; title: string; expires_at: string }
export interface Snapshot { title: string; prompt: string }
export interface SessionInfo { id: string; email: string }
export type AIRequest =
    | { action: 'suggest'; notes: string; fields: { key: string; label: string }[] }
    | { action: 'run'; prompt: string }
    | { action: 'evaluate'; runs: { prompt: string; result: string }[]; checks: string[] };
export type AIReply =
    | { action: 'suggest'; fields: { key: string; value: string }[] }
    | { action: 'run'; result: string }
    | { action: 'evaluate'; results: { index: number; a: boolean; b: boolean; explanation: string }[] };

export class CloudError extends Error {}

export function connectCloud(url: string, key: string) {
    const client = createClient(url, key, { auth: { detectSessionInUrl: false } });
    const sessionInfo = (user: { id: string; email?: string } | undefined): SessionInfo | null =>
        user ? { id: user.id, email: user.email ?? '' } : null;

    function checked<T>(response: { data: T; error: { message: string } | null }): T {
        if (response.error) {
            const expected = ['prompt_conflict', 'prompt_forbidden', 'prompt_invite_invalid'];
            const code = response.error.message;
            throw new CloudError(expected.includes(code) ? code : 'cloud_error');
        }
        return response.data;
    }

    async function collect<T>(fetchPage: (first: number, last: number) =>
        PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
        const items: T[] = [];
        const pageSize = 100;
        for (let first = 0; ; first += pageSize) {
            const page = checked(await fetchPage(first, first + pageSize - 1)) ?? [];
            items.push(...page);
            if (page.length < pageSize) return items;
        }
    }

    async function invoke<T>(name: string, body: object, signal?: AbortSignal): Promise<T> {
        const response = await client.functions.invoke<T>(name, { body, signal });
        if (response.error instanceof FunctionsHttpError) {
            const payload = await response.error.context.json().catch(() => null);
            throw new CloudError(typeof payload?.error === 'string' ? payload.error : 'cloud_error');
        }
        return checked(response) as T;
    }

    const draftFields = 'id,name,created_by,revision,folder_id';
    const versionFields = 'revision,created_at,name';
    const versionPayloadFields = 'revision,created_at,name,payload';
    const draftSummaries = () => client.from('prompt_drafts').select(draftFields)
        .order('updated_at', { ascending: false }).order('id');
    const draftPage = async (offset: number, limit: number) => checked(
        await draftSummaries().range(offset, offset + limit - 1),
    ) as CloudDraftSummary[];

    async function foldersAndShares() {
        const [folders, memberships, shares] = await Promise.all([
            collect<Folder>((first, last) => client.from('prompt_folders').select('id,name,owner_id').order('name').order('id').range(first, last)),
            collect<{ folder_id: string; role: MemberRole }>((first, last) =>
                client.from('prompt_folder_members').select('folder_id,role').order('folder_id').range(first, last)),
            collect<Share>((first, last) => client.from('prompt_shares').select('id,title,expires_at')
                .gt('expires_at', new Date().toISOString()).order('expires_at').order('id').range(first, last)),
        ]);
        return { folders, memberships, shares };
    }

    return {
        onSession(callback: (user: SessionInfo | null) => void) {
            const { data } = client.auth.onAuthStateChange((_event, session) => callback(sessionInfo(session?.user)));
            return () => data.subscription.unsubscribe();
        },
        async requestCode(email: string) {
            checked(await client.auth.signInWithOtp({ email }));
        },
        async confirmCode(email: string, code: string) {
            checked(await client.auth.verifyOtp({ email, token: code, type: 'email' }));
        },
        async signOut() {
            const { error } = await client.auth.signOut();
            checked({ data: null, error });
        },
        foldersAndShares,
        draftPage,
        allDraftSummaries: () => collect<CloudDraftSummary>((first, last) => draftSummaries().range(first, last)),
        async draft(id: string) {
            return checked(await client.from('prompt_drafts').select(draftFields + ',payload').eq('id', id).single()) as CloudDraft;
        },
        async save(id: string | null, revision: number, folderId: string | null, name: string, draft: Draft) {
            return checked(await client.rpc('save_prompt_draft', {
                draft_id: id, base_revision: revision, in_folder: folderId, draft_name: name, draft_payload: draft,
            })) as CloudDraft;
        },
        async remove(id: string) {
            checked(await client.rpc('delete_prompt_draft', { draft_id: id }));
        },
        async versionPage(id: string, limit: number, before?: number) {
            const query = client.from('prompt_versions').select(versionFields)
                .eq('draft_id', id).order('revision', { ascending: false }).limit(limit);
            return checked(await (before === undefined ? query : query.lt('revision', before))) as VersionSummary[];
        },
        async version(id: string, number: number) {
            return checked(await client.from('prompt_versions').select(versionPayloadFields)
                .eq('draft_id', id).eq('revision', number).single()) as Version;
        },
        exportedVersions: (id: string) => collect<Version>((first, last) => client.from('prompt_versions').select(versionPayloadFields)
            .eq('draft_id', id).order('revision', { ascending: false }).range(first, last)),
        async createFolder(name: string) {
            checked(await client.rpc('create_prompt_folder', { folder_name: name }));
        },
        async deleteFolder(id: string) {
            checked(await client.rpc('delete_prompt_folder', { folder: id }));
        },
        async transferFolder(folder: string, member: string) {
            checked(await client.rpc('transfer_prompt_folder', { folder, member }));
        },
        async invite(folderId: string, role: MemberRole) {
            return checked(await client.rpc('invite_to_prompt_folder', { folder: folderId, member_role: role })) as string;
        },
        async invites(folder: string) {
            return checked(await client.rpc('list_prompt_folder_invites', { folder })) as Invitation[];
        },
        async revokeInvite(folder: string, invitation: string) {
            checked(await client.rpc('revoke_prompt_folder_invite', { folder, invitation }));
        },
        async acceptInvite(token: string) {
            checked(await client.rpc('accept_prompt_folder_invite', { invite_token: token }));
        },
        async members(folder: string) {
            return checked(await client.rpc('list_prompt_folder_members', { folder })) as Member[];
        },
        async setMember(folder: string, userId: string, role: MemberRole | null) {
            checked(await client.rpc('set_prompt_folder_member', { folder, member: userId, member_role: role }));
        },
        async share(snapshot: Snapshot) {
            return checked(await client.rpc('publish_prompt_snapshot', { snapshot_title: snapshot.title, snapshot_prompt: snapshot.prompt })) as string;
        },
        async snapshot(token: string) {
            return checked(await client.rpc('read_prompt_snapshot', { share_token: token })) as Snapshot | null;
        },
        async revoke(id: string) {
            checked(await client.rpc('revoke_prompt_snapshot', { share_id: id }));
        },
        exportedShares: () => collect<Share & { prompt: string }>((first, last) =>
            client.from('prompt_shares').select('id,title,prompt,expires_at').order('id').range(first, last)),
        ai: (request: AIRequest, signal?: AbortSignal) => invoke<AIReply>('prompt-ai', request, signal),
        async deleteAccount() {
            await invoke('prompt-account', {});
            await client.auth.signOut({ scope: 'local' });
        },
    };
}

export type CloudClient = ReturnType<typeof connectCloud>;
