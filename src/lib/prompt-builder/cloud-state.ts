import type {
    CloudClient,
    CloudDraft,
    CloudDraftSummary,
    Folder,
    Invitation,
    Member,
    MemberRole,
    SessionInfo,
    Share,
    Snapshot,
    VersionSummary,
} from './cloud';
import type { Draft } from './model';
import { builderPath } from './workflows';

const pageSize = 20;

export function cloudState() {
    let client: CloudClient | undefined;
    let unsubscribe: (() => void) | undefined;
    let refreshSequence = 0;
    let linkSequence = 0;
    let shareSequence = 0;
    let sessionSequence = 0;
    let sessionRequests = new AbortController();
    let signingOut = false;
    return {
        available: Boolean(
            import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ),
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
        invites: [] as Invitation[],
        inviteToken: '',
        drafts: [] as CloudDraftSummary[],
        moreDrafts: false,
        draftOffset: 0,
        versions: [] as VersionSummary[],
        moreVersions: false,
        current: null as CloudDraftSummary | null,
        legacyPayload: null as { value: unknown } | null,
        conflict: false,
        shares: [] as Share[],
        shared: null as Snapshot | null,
        sharedMissing: false,
        sharedError: false,
        sharePreview: null as Snapshot | null,
        shareLink: '',

        async start(onAccountChange: () => void) {
            const url = import.meta.env.PUBLIC_SUPABASE_URL;
            const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
            if (!url || !key) {
                await this.followLink();
                return;
            }
            const { connectCloud } = await import('./cloud');
            client = connectCloud(url, key);
            unsubscribe = client.onSession((account) => {
                this.ready = true;
                const changed = this.account?.id !== account?.id;
                this.account = account;
                if (!changed) return;
                this.clearAccount();
                onAccountChange();
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
            sessionSequence++;
            sessionRequests.abort();
        },
        clearAccount() {
            refreshSequence++;
            sessionSequence++;
            sessionRequests.abort();
            sessionRequests = new AbortController();
            this.busy = false;
            this.status = '';
            this.email = '';
            this.code = '';
            this.codeSent = false;
            this.drafts = [];
            this.moreDrafts = false;
            this.draftOffset = 0;
            this.folders = [];
            this.memberships = [];
            this.shares = [];
            this.manageFolder = '';
            this.members = [];
            this.selectedFolder = '';
            this.folderName = '';
            this.inviteLink = '';
            this.invites = [];
            this.clearShare();
            this.detach();
        },
        clearShare() {
            shareSequence++;
            this.sharePreview = null;
            this.shareLink = '';
        },
        detach() {
            this.legacyPayload = null;
            this.current = null;
            this.versions = [];
            this.moreVersions = false;
            this.conflict = false;
            this.selectedFolder = '';
        },
        async perform<T>(
            operation: (api: CloudClient, signal: AbortSignal) => Promise<T>,
        ): Promise<T | undefined> {
            if (!client || this.busy || signingOut) return;
            const sequence = sessionSequence;
            this.busy = true;
            this.status = '';
            try {
                const result = await operation(client, sessionRequests.signal);
                return sequence === sessionSequence ? result : undefined;
            } catch (error) {
                if (sequence === sessionSequence)
                    this.status = error instanceof Error ? error.message : 'cloud_error';
                return undefined;
            } finally {
                if (sequence === sessionSequence) this.busy = false;
            }
        },
        async refresh() {
            if (!client || !this.account) return;
            const update = ++refreshSequence;
            try {
                const [page, listing] = await Promise.all([
                    client.draftPage(0, pageSize + 1),
                    client.foldersAndShares(),
                ]);
                if (update !== refreshSequence) return;
                Object.assign(this, listing);
                this.drafts = page.slice(0, pageSize);
                this.moreDrafts = page.length > pageSize;
                this.draftOffset = this.drafts.length;
            } catch {
                if (update === refreshSequence) this.status = 'cloud_error';
            }
        },
        async loadMoreDrafts() {
            const update = refreshSequence;
            const page = await this.perform((api) => api.draftPage(this.draftOffset, pageSize + 1));
            if (!page || update !== refreshSequence) return;
            const rows = page.slice(0, pageSize);
            this.drafts.push(
                ...rows.filter((row) => !this.drafts.some((item) => item.id === row.id)),
            );
            this.draftOffset += rows.length;
            this.moreDrafts = page.length > pageSize;
        },
        async requestCode() {
            const sent = await this.perform(async (api) => {
                await api.requestCode(this.email.trim());
                return true;
            });
            if (sent) {
                this.codeSent = true;
                this.status = 'code_sent';
            }
        },
        async confirmCode() {
            await this.perform((api) => api.confirmCode(this.email.trim(), this.code.trim()));
        },
        async signOut() {
            if (!client || signingOut) return;
            signingOut = true;
            try {
                await client.signOut();
            } catch {
                this.status = this.account ? 'cloud_error' : 'signed_out_offline';
            } finally {
                signingOut = false;
            }
        },
        canWrite(folderId: string | null | undefined) {
            if (!folderId) return true;
            return (
                this.folders.some(
                    (folder) => folder.id === folderId && folder.owner_id === this.account?.id,
                ) ||
                this.memberships.some(
                    (item) => item.folder_id === folderId && item.role === 'editor',
                )
            );
        },
        attach({ payload: _payload, ...summary }: CloudDraft) {
            this.legacyPayload = null;
            this.current = summary;
            this.conflict = false;
            this.selectedFolder = this.canWrite(summary.folder_id) ? (summary.folder_id ?? '') : '';
            this.versions = [];
            this.moreVersions = false;
        },
        async save(name: string, draft: Draft, asCopy: boolean) {
            const current = asCopy ? null : this.current;
            const folder = current
                ? current.folder_id
                : this.canWrite(this.selectedFolder)
                  ? this.selectedFolder
                  : '';
            const result = await this.perform((api) =>
                api.save(current?.id ?? null, current?.revision ?? 0, folder || null, name, draft),
            );
            if (result) {
                const { payload: _payload, ...summary } = result;
                this.drafts = [summary, ...this.drafts.filter((item) => item.id !== result.id)];
                if (!current) this.draftOffset++;
            }
            if (this.status === 'prompt_conflict') this.conflict = true;
            return result;
        },
        async latest(id: string) {
            return this.perform((api) => api.draft(id));
        },
        async showVersions(more = false) {
            const id = this.current?.id;
            if (!id) return;
            const before = more ? this.versions.at(-1)?.revision : undefined;
            const list = await this.perform((api) => api.versionPage(id, pageSize + 1, before));
            if (list && this.current?.id === id) {
                this.versions = [...(more ? this.versions : []), ...list.slice(0, pageSize)];
                this.moreVersions = list.length > pageSize;
            }
        },
        async getVersion(revision: number) {
            const id = this.current?.id;
            if (!id) return;
            const version = await this.perform((api) => api.version(id, revision));
            if (this.current?.id === id) return version;
        },
        async remove(id: string) {
            const removed = await this.perform(async (api) => {
                await api.remove(id);
                return true;
            });
            if (removed) {
                if (this.current?.id === id) this.detach();
                if (this.drafts.some((item) => item.id === id)) this.draftOffset--;
                this.drafts = this.drafts.filter((item) => item.id !== id);
                this.status = 'removed';
            }
        },
        async createFolder() {
            const name = this.folderName.trim();
            if (!name) return;
            const created = await this.perform(async (api) => {
                await api.createFolder(name);
                return true;
            });
            if (created) {
                this.folderName = '';
                this.status = 'saved';
                await this.refresh();
            }
        },
        async deleteFolder(id: string) {
            const removed = await this.perform(async (api) => {
                await api.deleteFolder(id);
                return true;
            });
            if (removed) {
                if (this.current?.folder_id === id) this.detach();
                if (this.selectedFolder === id) this.selectedFolder = '';
                this.manageFolder = '';
                this.inviteLink = '';
                this.status = 'removed';
                await this.refresh();
            }
        },
        async showMembers(id: string) {
            const detail = await this.perform((api) =>
                Promise.all([api.members(id), api.invites(id)]),
            );
            if (detail) {
                [this.members, this.invites] = detail;
                this.manageFolder = id;
                this.inviteLink = '';
            }
        },
        async setMember(userId: string, role: MemberRole | null) {
            const folder = this.manageFolder;
            const members = await this.perform(async (api) => {
                await api.setMember(folder, userId, role);
                return api.members(folder);
            });
            if (members && this.manageFolder === folder) this.members = members;
        },
        async transferFolder(member: string) {
            const folder = this.manageFolder;
            const transferred = await this.perform(async (api) => {
                await api.transferFolder(folder, member);
                return true;
            });
            if (transferred) {
                this.manageFolder = '';
                this.members = [];
                this.invites = [];
                this.inviteLink = '';
                this.status = 'saved';
                await this.refresh();
            }
        },
        async invite() {
            const folder = this.manageFolder;
            const detail = await this.perform(async (api) => {
                const token = await api.invite(folder, this.inviteRole);
                return { token, invitations: await api.invites(folder) };
            });
            if (detail && this.manageFolder === folder) {
                this.inviteLink = new URL(
                    builderPath + '#invite=' + detail.token,
                    location.origin,
                ).href;
                this.invites = detail.invitations;
            }
        },
        async revokeInvite(id: string) {
            const folder = this.manageFolder;
            const removed = await this.perform(async (api) => {
                await api.revokeInvite(folder, id);
                return true;
            });
            if (removed && this.manageFolder === folder) {
                this.invites = this.invites.filter((item) => item.id !== id);
                this.inviteLink = '';
                this.status = 'removed';
            }
        },
        async acceptInvite() {
            const accepted = await this.perform(async (api) => {
                await api.acceptInvite(this.inviteToken);
                return true;
            });
            if (accepted) {
                this.inviteToken = '';
                history.replaceState(history.state, '', location.pathname + location.search);
                this.status = 'saved';
                await this.refresh();
            }
        },
        async publish() {
            const snapshot = this.sharePreview;
            if (!snapshot) return;
            const sequence = shareSequence;
            const token = await this.perform((api) => api.share(snapshot));
            if (token) {
                if (sequence === shareSequence) {
                    this.shareLink = new URL(builderPath + '#share=' + token, location.origin).href;
                    this.sharePreview = null;
                }
                await this.refresh();
            }
        },
        async revoke(id: string) {
            const removed = await this.perform(async (api) => {
                await api.revoke(id);
                return true;
            });
            if (removed) {
                this.shareLink = '';
                this.status = 'removed';
                await this.refresh();
            }
        },
        async exportData() {
            const account = this.account;
            if (!account) return;
            return this.perform(async (api, signal) => {
                const [data, summaries] = await Promise.all([
                    api.foldersAndShares(),
                    api.allDraftSummaries(),
                ]);
                const folders = data.folders.filter((folder) => folder.owner_id === account.id);
                const exportIds = summaries
                    .filter(
                        (draft) =>
                            draft.created_by === account.id ||
                            folders.some((folder) => folder.id === draft.folder_id),
                    )
                    .map((draft) => draft.id);
                const metadata = { version: 1, account, folders, memberships: data.memberships };
                const parts: BlobPart[] = [JSON.stringify(metadata).slice(0, -1), ',"drafts":['];
                const revisions = [];
                for (const id of exportIds) {
                    signal.throwIfAborted();
                    const draft = await api.draft(id);
                    if (revisions.length) parts.push(',');
                    parts.push(new Blob([JSON.stringify(draft)]));
                    revisions.push({ id, revision: draft.revision });
                }
                parts.push('],"histories":[');
                for (const [index, { id, revision }] of revisions.entries()) {
                    parts.push(
                        (index ? ',' : '') + '{"id":' + JSON.stringify(id) + ',"versions":[',
                    );
                    let first = true;
                    for await (const versions of api.exportedVersions(id, revision, signal)) {
                        if (versions.length) {
                            if (!first) parts.push(',');
                            parts.push(
                                new Blob([
                                    versions.map((version) => JSON.stringify(version)).join(','),
                                ]),
                            );
                            first = false;
                        }
                    }
                    parts.push(']}');
                }
                parts.push('],"shares":[');
                let first = true;
                for await (const shares of api.exportedShares(signal)) {
                    if (shares.length) {
                        if (!first) parts.push(',');
                        parts.push(
                            new Blob([shares.map((share) => JSON.stringify(share)).join(',')]),
                        );
                        first = false;
                    }
                }
                parts.push(']}');
                return new Blob(parts, { type: 'application/json;charset=utf-8' });
            });
        },
        async deleteAccount() {
            await this.perform((api) => api.deleteAccount());
        },
    };
}

export const cloudMessages = {
    code_sent: 'codeSent',
    saved: 'saveOk',
    removed: 'removed',
    prompt_forbidden: 'forbidden',
    prompt_conflict: 'conflict',
    prompt_invite_invalid: 'inviteInvalid',
    prompt_account_shared_folders: 'accountSharedFolders',
    prompt_storage_limit: 'cloudQuota',
    prompt_invalid: 'invalid',
    signed_out_offline: 'signOutOffline',
    ai_limit: 'aiLimit',
    ai_unavailable: 'aiUnavailable',
    ai_timeout: 'aiTimeout',
    ai_refused: 'aiRefused',
    ai_length: 'aiLength',
    ai_error: 'aiError',
} as const;
