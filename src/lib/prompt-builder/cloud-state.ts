import type { CloudClient, CloudDraft, Folder, Member, MemberRole, SessionInfo, Share, Snapshot, Version } from './cloud';
import type { Draft } from './model';
import { builderPath } from './workflows';

export function cloudState() {
    let client: CloudClient | undefined;
    let unsubscribe: (() => void) | undefined;
    let refreshSequence = 0;
    let linkSequence = 0;
    return {
        available: Boolean(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY),
        ready: false,
        account: null as SessionInfo | null,
        email: '',
        code: '',
        codeSent: false,
        busy: false,
        status: '',
        folders: [] as Folder[],
        members: [] as Member[],
        memberships: [] as { folder_id: string; role: MemberRole }[],
        folderName: '',
        selectedFolder: '',
        manageFolder: '',
        inviteRole: 'viewer' as MemberRole,
        inviteLink: '',
        inviteToken: '',
        drafts: [] as CloudDraft[],
        versions: [] as Version[],
        current: null as CloudDraft | null,
        conflict: false,
        shares: [] as Share[],
        shared: null as Snapshot | null,
        sharedMissing: false,
        sharedError: false,
        sharePreview: null as Snapshot | null,
        shareLink: '',

        async start() {
            const url = import.meta.env.PUBLIC_SUPABASE_URL;
            const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
            if (!url || !key) {
                await this.followLink();
                return;
            }
            const { connectCloud } = await import('./cloud');
            client = connectCloud(url, key);
            unsubscribe = client.onSession(account => {
                this.ready = true;
                const changed = this.account?.id !== account?.id;
                this.account = account;
                if (!changed) return;
                this.clearAccount();
                if (account) {
                    this.codeSent = false;
                    this.code = '';
                    setTimeout(() => void this.refresh(), 0);
                }
            });
            await this.followLink();
        },
        async followLink() {
            const sequence = ++linkSequence;
            const hash = new URLSearchParams(location.hash.slice(1));
            const share = hash.get('share');
            const invite = hash.get('invite');
            this.inviteToken = invite && /^[a-f0-9]{64}$/.test(invite) ? invite : '';
            this.shared = null;
            this.sharedMissing = false;
            this.sharedError = false;
            if (!share) return;
            if (!client) {
                this.sharedError = !this.available;
                return;
            }
            try {
                const snapshot = /^[a-f0-9]{64}$/.test(share) ? await client.snapshot(share) : null;
                if (sequence === linkSequence) {
                    this.shared = snapshot;
                    this.sharedMissing = !snapshot;
                }
            } catch {
                if (sequence === linkSequence) this.sharedError = true;
            }
        },
        stop() {
            unsubscribe?.();
            refreshSequence++;
            linkSequence++;
        },
        clearAccount() {
            refreshSequence++;
            this.drafts = [];
            this.folders = [];
            this.memberships = [];
            this.shares = [];
            this.manageFolder = '';
            this.members = [];
            this.selectedFolder = '';
            this.inviteLink = '';
            this.shareLink = '';
            this.sharePreview = null;
            this.detach();
        },
        detach() {
            this.current = null;
            this.versions = [];
            this.conflict = false;
            this.selectedFolder = '';
        },
        async perform<T>(operation: (api: CloudClient) => Promise<T>): Promise<T | undefined> {
            if (!client || this.busy) return;
            this.busy = true;
            this.status = '';
            try {
                return await operation(client);
            } catch (error) {
                this.status = error instanceof Error ? error.message : 'cloud_error';
                return undefined;
            } finally {
                this.busy = false;
            }
        },
        async refresh() {
            if (!client || !this.account) return;
            const update = ++refreshSequence;
            try {
                const listing = await client.library();
                if (update === refreshSequence) Object.assign(this, listing);
            } catch {
                if (update === refreshSequence) this.status = 'cloud_error';
            }
        },
        async requestCode() {
            const sent = await this.perform(async api => {
                await api.requestCode(this.email.trim());
                return true;
            });
            if (sent) {
                this.codeSent = true;
                this.status = 'code_sent';
            }
        },
        async confirmCode() {
            await this.perform(api => api.confirmCode(this.email.trim(), this.code.trim()));
        },
        async signOut() {
            await this.perform(api => api.signOut());
        },
        canWrite(folderId: string | null | undefined) {
            if (!folderId) return true;
            return this.folders.some(folder => folder.id === folderId && folder.owner_id === this.account?.id) ||
                this.memberships.some(item => item.folder_id === folderId && item.role === 'editor');
        },
        attach(item: CloudDraft) {
            this.current = item;
            this.conflict = false;
            this.selectedFolder = item.folder_id ?? '';
            this.versions = [];
        },
        async save(name: string, draft: Draft, asCopy: boolean) {
            const current = asCopy ? null : this.current;
            const folder = asCopy ? this.selectedFolder : current?.folder_id ?? this.selectedFolder;
            const result = await this.perform(api => api.save(current?.id ?? null, current?.revision ?? 0, folder || null, name, draft));
            if (result) await this.refresh();
            if (this.status === 'prompt_conflict') this.conflict = true;
            return result;
        },
        async latest(id: string) {
            return this.perform(api => api.draft(id));
        },
        async showVersions() {
            const id = this.current?.id;
            if (!id) return;
            const list = await this.perform(api => api.versions(id));
            if (list && this.current?.id === id) this.versions = list;
        },
        async remove(id: string) {
            await this.perform(async api => {
                await api.remove(id);
                if (this.current?.id === id) this.detach();
                await this.refresh();
                this.status = 'removed';
            });
        },
        async createFolder() {
            const name = this.folderName.trim();
            if (!name) return;
            await this.perform(async api => {
                await api.createFolder(name);
                await this.refresh();
                this.folderName = '';
                this.status = 'saved';
            });
        },
        async deleteFolder(id: string) {
            await this.perform(async api => {
                await api.deleteFolder(id);
                if (this.current?.folder_id === id) this.detach();
                if (this.selectedFolder === id) this.selectedFolder = '';
                this.manageFolder = '';
                this.inviteLink = '';
                await this.refresh();
                this.status = 'removed';
            });
        },
        async showMembers(id: string) {
            await this.perform(async api => {
                this.members = await api.members(id);
                this.manageFolder = id;
                this.inviteLink = '';
            });
        },
        async setMember(userId: string, role: MemberRole | null) {
            const folder = this.manageFolder;
            await this.perform(async api => {
                await api.setMember(folder, userId, role);
                this.members = await api.members(folder);
            });
        },
        async invite() {
            const folder = this.manageFolder;
            await this.perform(async api => {
                const token = await api.invite(folder, this.inviteRole);
                if (this.manageFolder === folder) this.inviteLink = new URL(builderPath + '#invite=' + token, location.origin).href;
            });
        },
        async acceptInvite() {
            await this.perform(async api => {
                await api.acceptInvite(this.inviteToken);
                this.inviteToken = '';
                history.replaceState(history.state, '', location.pathname + location.search);
                await this.refresh();
                this.status = 'saved';
            });
        },
        async publish() {
            const snapshot = this.sharePreview;
            if (!snapshot) return;
            await this.perform(async api => {
                const token = await api.share(snapshot);
                this.shareLink = new URL(builderPath + '#share=' + token, location.origin).href;
                this.sharePreview = null;
                await this.refresh();
            });
        },
        async revoke(id: string) {
            await this.perform(async api => {
                await api.revoke(id);
                this.shareLink = '';
                await this.refresh();
                this.status = 'removed';
            });
        },
        async exportData() {
            return this.perform(async api => {
                const [data, shares] = await Promise.all([api.library(), api.exportedShares()]);
                const drafts = data.drafts.filter(draft => draft.created_by === this.account?.id);
                const histories = [];
                for (const draft of drafts) histories.push({ id: draft.id, versions: await api.versions(draft.id) });
                return { version: 1, account: this.account, drafts, shares, histories, memberships: data.memberships,
                    folders: data.folders.filter(folder => folder.owner_id === this.account?.id) };
            });
        },
        async deleteAccount() {
            await this.perform(api => api.deleteAccount());
        },
    };
}

export const cloudMessages = {
    code_sent: 'codeSent', saved: 'saveOk', removed: 'removed',
    prompt_forbidden: 'forbidden', prompt_conflict: 'conflict', prompt_invite_invalid: 'inviteInvalid',
    ai_limit: 'aiLimit', ai_unavailable: 'aiUnavailable', ai_timeout: 'aiTimeout', ai_refused: 'aiRefused',
    ai_length: 'aiLength', ai_error: 'aiError',
} as const;
