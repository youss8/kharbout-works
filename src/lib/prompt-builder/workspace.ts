import type Alpine from 'alpinejs';
import { cloudMessages, cloudState } from './cloud-state';
import type { AIReply, AIRequest, CloudDraft, Version } from './cloud';
import { copy } from './copy';
import {
    advanceChain, compilePrompt, formats, handoffContext, invalidResponseExample, maxFieldLength, maxImportBytes, maxSavedRuns,
    newDraft, readDraft, tones, visiblePrompt, type Draft, type Variant,
} from './model';
import { isModelProfile, modelProfile } from './profiles';
import { emptyLibrary, loadLibrary, updateLibrary, type LibraryEntry } from './storage';
import { chains, findWorkflow, presets, type Locale } from './workflows';

type CopyKey = keyof typeof copy;
const translations = Object.fromEntries((['en', 'ar'] as const).map(locale => [
    locale, Object.fromEntries(Object.entries(copy).map(([key, text]) => [key, text[locale]])),
])) as Record<Locale, Record<CopyKey, string>>;

function createWorkspace() {
    return {
        locale: 'en' as Locale,
        presets,
        chains,
        tones,
        formats,
        draft: newDraft(),
        baseline: JSON.stringify(newDraft()),
        draftKey: 0,
        variant: 'concise' as Variant,
        editor: null as Variant | null,
        compare: false,
        exampleLoaded: false,
        handoffOpen: false,
        handoff: '',
        goal: '',
        library: emptyLibrary(),
        localId: '',
        name: '',
        status: '' as CopyKey | '',
        cloud: cloudState(),
        aiNotes: '',
        aiPending: null as AIRequest | null,
        suggestions: [] as { key: string; label: string; value: string; selected: boolean }[],
        results: [null, null] as (Draft['runs'][number] | null)[],
        runSlot: 0,
        aiStatus: '' as CopyKey | '',
        evaluation: [] as Extract<AIReply, { action: 'evaluate' }>['results'],

        get t() { return translations[this.locale]; },
        get workflow() { return findWorkflow(this.draft.workflowId)!; },
        get profile() { return modelProfile(this.draft.preferences.profile); },
        get invalidExample() { return invalidResponseExample(this.draft.preferences); },
        get profileHint() {
            const preferences = this.draft.preferences;
            const focus = preferences.format === 'json' ? 'example' : this.profile.focus;
            if (preferences[focus].trim()) return '';
            const hints = { sources: this.t.modelSourcesHint, criteria: this.t.modelCriteriaHint, example: this.t.modelExampleHint };
            return hints[focus];
        },
        get missing() { return this.workflow.fields.filter(field => field.required && !this.draft.values[field.key]?.trim()); },
        get activeText(): string { return visiblePrompt(this.draft, this.variant); },
        compileVariant(variant: Variant) { return compilePrompt(this.draft, variant); },
        workflowTitle(id: string) { return findWorkflow(id)?.title[this.locale] ?? id; },
        get isFavorite() { return this.library.favorites.includes(this.workflow.id); },
        get chain() { return chains.find(chain => chain.id === this.draft.chain?.id); },
        get nextStep() { return this.chain?.steps[(this.draft.chain?.step ?? 0) + 1]; },
        get cloudMessage() {
            const status = this.cloud.status;
            return status ? this.t[cloudMessages[status as keyof typeof cloudMessages] ?? 'cloudError'] : '';
        },
        get aiTransferText() {
            const request = this.aiPending;
            if (!request) return '';
            if (request.action === 'suggest') return request.notes + '\n\n' + request.fields.map(field => field.label).join('\n');
            if (request.action === 'run') return request.prompt;
            return request.checks.join('\n') + '\n\n' + request.runs.map(run => run.prompt + '\n\n' + run.result).join('\n\n---\n\n');
        },

        init() {
            try {
                if (localStorage.getItem('kharbout-prompt-builder-locale') === 'ar') this.locale = 'ar';
            } catch { /* The interface remains available without storage. */ }
            const selection = new URLSearchParams(location.search);
            const requested = selection.get('workflow');
            const chain = chains.find(item => item.id === selection.get('chain'));
            const initial = newDraft(findWorkflow(requested ?? '')?.id ?? chain?.steps[0] ?? 'blank', this.locale);
            const selectedModel = selection.get('model');
            if (isModelProfile(selectedModel)) initial.preferences.profile = selectedModel;
            const step = chain?.steps.indexOf(initial.workflowId) ?? -1;
            if (chain && step >= 0) initial.chain = { id: chain.id, step };
            this.applyDraft(initial, '');
            void loadLibrary().then(data => { this.library = data; }).catch(() => { this.status = 'storageError'; });
            void this.cloud.start().catch(() => { this.cloud.status = 'cloud_error'; });
        },
        destroy() { this.cloud.stop(); },
        setLocale(locale: Locale) {
            this.locale = locale;
            try { localStorage.setItem('kharbout-prompt-builder-locale', locale); } catch { /* Keep the current selection in memory. */ }
        },
        confirmReplace(keepProfile = false) {
            let baseline = this.baseline;
            if (keepProfile) {
                const saved = JSON.parse(baseline) as Draft;
                saved.preferences.profile = this.draft.preferences.profile;
                baseline = JSON.stringify(saved);
            }
            return JSON.stringify(this.draft) === baseline || window.confirm(this.t.replaceDraft);
        },
        installDraft(draft: Draft) {
            this.draftKey++;
            this.draft = draft;
            this.baseline = JSON.stringify(draft);
            this.editor = null;
            this.exampleLoaded = false;
            this.handoffOpen = false;
            this.aiPending = null;
            this.aiNotes = '';
            this.suggestions = [];
            this.results = [null, null];
            this.runSlot = 0;
            this.evaluation = [];
            this.aiStatus = '';
            this.status = '';
        },
        applyDraft(draft: Draft, name: string, id = '') {
            this.cloud.detach();
            this.installDraft(draft);
            this.localId = id;
            this.name = name;
        },
        updateUrl() {
            const url = new URL(location.href);
            url.searchParams.delete('workflow');
            url.searchParams.delete('chain');
            url.searchParams.delete('model');
            if (this.draft.workflowId !== 'blank') url.searchParams.set('workflow', this.draft.workflowId);
            if (this.draft.chain) url.searchParams.set('chain', this.draft.chain.id);
            if (this.draft.preferences.profile !== 'universal') url.searchParams.set('model', this.draft.preferences.profile);
            history.replaceState(history.state, '', url);
        },
        selectModel(id: string) {
            if (!isModelProfile(id)) return;
            this.draft.preferences.profile = id;
            this.updateUrl();
        },
        newWorkflow(id: string) {
            const draft = newDraft(id, this.draft.preferences.outputLocale);
            draft.preferences.profile = this.draft.preferences.profile;
            return draft;
        },
        chooseWorkflow(id: string) {
            if (!findWorkflow(id) || id === this.draft.workflowId || !this.confirmReplace(true)) return;
            this.applyDraft(this.newWorkflow(id), '');
            this.updateUrl();
        },
        startChain(id: string) {
            const chain = chains.find(item => item.id === id);
            if (!chain) return;
            if (chain.steps[0] === this.draft.workflowId && !this.draft.chain) {
                this.draft.chain = { id, step: 0 };
            } else {
                if (!this.confirmReplace(true)) return;
                const draft = this.newWorkflow(chain.steps[0]);
                draft.chain = { id, step: 0 };
                this.applyDraft(draft, '');
            }
            this.updateUrl();
        },
        loadExample() {
            if ((Object.values(this.draft.values).some(value => value?.trim()) || Object.keys(this.draft.edits).length) &&
                !window.confirm(this.t.replaceExample)) return;
            this.draft.values = Object.fromEntries(this.workflow.fields.map(field => [field.key, field.example[this.locale]]));
            this.draft.edits = {};
            this.editor = null;
            this.exampleLoaded = true;
        },
        prepareHandoff() {
            this.handoff = handoffContext(this.draft).slice(0, maxFieldLength);
            this.goal = this.draft.values.EXPECTED ?? '';
            this.handoffOpen = true;
        },
        continueChain() {
            const next = advanceChain(this.draft, this.handoff, this.goal);
            if (!next) return;
            this.applyDraft(next, '');
            this.updateUrl();
            document.getElementById('builder-input-heading')?.focus();
        },
        editPrompt(variant: Variant) {
            this.draft.edits[variant] ??= compilePrompt(this.draft, variant);
            this.variant = variant;
            this.editor = variant;
            requestAnimationFrame(() => document.getElementById('builder-editor-' + variant)?.focus());
        },
        finishEditing(variant: Variant) {
            this.editor = null;
            requestAnimationFrame(() => document.getElementById('builder-edit-' + variant)?.focus());
        },
        regenerate(variant: Variant) {
            if (!window.confirm(this.t.replaceEdit)) return;
            delete this.draft.edits[variant];
            this.finishEditing(variant);
        },
        exportAction(action: 'copy' | 'md' | 'txt' | 'json', text?: unknown) {
            document.getElementById('builder-export')?.querySelector('asset-export')?.dispatchEvent(new CustomEvent('asset-export', {
                detail: { action, text: text ?? this.activeText, messages: {
                    copied: this.t.copied, manual: this.t.manual, invalid: this.t.invalid, downloaded: this.t.downloaded,
                } },
            }));
        },
        async changeLibrary(change: Parameters<typeof updateLibrary>[0], success: CopyKey | '' = '') {
            try {
                this.library = await updateLibrary(change);
                this.status = success;
                return true;
            } catch {
                this.status = 'storageError';
                return false;
            }
        },
        async toggleFavorite() {
            const id = this.draft.workflowId;
            await this.changeLibrary(library => ({
                ...library, favorites: library.favorites.includes(id) ? library.favorites.filter(item => item !== id) : [...library.favorites, id],
            }));
        },
        async saveLocal(kind: LibraryEntry['kind']) {
            const name = this.name.trim() || this.workflow.title[this.locale];
            const existing = this.library.entries.find(entry => entry.id === this.localId && entry.kind === kind);
            const id = existing?.id ?? crypto.randomUUID();
            const draft = readDraft(this.draft);
            if (!draft) { this.status = 'invalid'; return; }
            if (kind === 'preset') { draft.runs = []; draft.chain = null; }
            const key = this.draftKey;
            const item = { id, name, kind, draft, updated: new Date().toISOString() };
            const stored = await this.changeLibrary(library => ({
                ...library, entries: [item, ...library.entries.filter(entry => entry.id !== id)],
            }), 'saveOk');
            if (stored && key === this.draftKey && kind === 'draft') {
                this.localId = id;
                this.name = name;
                this.baseline = JSON.stringify(draft);
            }
        },
        openLocal(item: LibraryEntry) {
            const draft = readDraft(item.draft);
            if (!draft || !this.confirmReplace()) return;
            this.applyDraft(draft, item.name, item.kind === 'draft' ? item.id : '');
            this.updateUrl();
        },
        async removeLocal(id: string) {
            if (!window.confirm(this.t.confirmDelete)) return;
            const removed = await this.changeLibrary(library => ({
                ...library, entries: library.entries.filter(entry => entry.id !== id),
            }), 'removed');
            if (removed && this.localId === id) this.localId = '';
        },
        async importFile(file: File | undefined) {
            if (!file || !this.confirmReplace()) return;
            const key = this.draftKey;
            let draft: Draft | null = null;
            try {
                if (file.size <= maxImportBytes) draft = readDraft(JSON.parse(await file.text()));
            } catch { /* Report a failed import through the shared status. */ }
            if (key !== this.draftKey) return;
            if (!draft) { this.status = 'invalid'; return; }
            this.applyDraft(draft, file.name.replace(/\.json$/i, '').slice(0, 120) || this.workflow.title[this.locale]);
            this.updateUrl();
            await this.saveLocal('draft');
            if (this.status !== 'storageError') this.status = 'imported';
        },
        openCloud(item: CloudDraft) {
            const draft = readDraft(item.payload);
            if (!draft) { this.status = 'invalid'; return; }
            if (!this.confirmReplace()) return;
            this.applyDraft(draft, item.name);
            this.cloud.attach(item);
            this.updateUrl();
        },
        async saveCloud(asCopy = false) {
            const name = this.name.trim() || this.workflow.title[this.locale];
            const draft = readDraft(this.draft);
            if (!draft) { this.status = 'invalid'; return; }
            const key = this.draftKey;
            const item = await this.cloud.save(name, draft, asCopy);
            if (item && key === this.draftKey && this.cloud.account) {
                this.cloud.attach(item);
                this.name = name;
                this.baseline = JSON.stringify(draft);
                this.cloud.status = 'saved';
            }
        },
        async reloadCloud() {
            const id = this.cloud.current?.id;
            if (!id) return;
            const item = await this.cloud.latest(id);
            if (item && this.cloud.current?.id === id) this.openCloud(item);
        },
        restoreVersion(version: Version) {
            const draft = readDraft(version.payload);
            if (!draft) { this.status = 'invalid'; return; }
            if (!this.confirmReplace()) return;
            const baseline = this.baseline;
            this.installDraft(draft);
            this.baseline = baseline;
            this.name = version.name;
            this.updateUrl();
            this.status = 'restored';
        },
        previewShare() {
            this.cloud.shareLink = '';
            this.cloud.sharePreview = { title: this.name.trim() || this.workflow.title[this.locale], prompt: this.activeText };
        },
        copySnapshot() {
            const snapshot = this.cloud.shared;
            if (!snapshot || !this.confirmReplace()) return;
            const draft = newDraft('blank', this.locale);
            draft.edits.concise = snapshot.prompt;
            this.applyDraft(draft, snapshot.title);
            this.variant = 'concise';
            this.cloud.shared = null;
            this.cloud.sharedError = false;
            history.replaceState(history.state, '', location.pathname);
            this.status = 'imported';
        },
        prepareAI(action: AIRequest['action']) {
            if (!this.cloud.account || this.cloud.busy) return;
            this.aiStatus = '';
            if (action === 'suggest' && this.aiNotes.trim()) {
                this.aiPending = { action, notes: this.aiNotes, fields: this.workflow.fields.map(field => ({
                    key: field.key, label: field.label[this.locale],
                })) };
            }
            if (action === 'run' && this.activeText.trim()) this.aiPending = { action, prompt: this.activeText };
            if (action === 'evaluate' && this.results[0] && this.results[1]) {
                this.aiPending = { action, runs: [this.results[0], this.results[1]], checks: this.workflow.checks.map(check => check[this.locale]) };
            }
        },
        async sendAI() {
            const request = this.aiPending;
            if (!request) return;
            const key = this.draftKey;
            const account = this.cloud.account?.id;
            const slot = this.runSlot;
            this.aiPending = null;
            const result = await this.cloud.perform(api => api.ai(request));
            if (key !== this.draftKey || this.cloud.account?.id !== account) return;
            if (!result) {
                this.aiStatus = cloudMessages[this.cloud.status as keyof typeof cloudMessages] ?? 'aiError';
                this.cloud.status = '';
                return;
            }
            if (result.action === 'suggest') {
                this.suggestions = result.fields.flatMap(suggestion => {
                    const field = this.workflow.fields.find(field => field.key === suggestion.key);
                    return field ? [{ ...suggestion, label: field.label[this.locale], selected: !this.draft.values[field.key]?.trim() }] : [];
                });
                if (!this.suggestions.length) this.aiStatus = 'noSuggestions';
            }
            if (result.action === 'run' && request.action === 'run') {
                this.results[slot] = { prompt: request.prompt, result: result.result };
                this.runSlot = this.results[0] ? 1 : 0;
                this.evaluation = [];
            }
            if (result.action === 'evaluate') this.evaluation = result.results;
        },
        applySuggestions() {
            for (const item of this.suggestions) {
                if (item.selected) this.draft.values[item.key] = item.value;
            }
            this.suggestions = [];
        },
        saveRun(index: number) {
            const run = this.results[index];
            if (!run || this.draft.runs.some(item => item.prompt === run.prompt && item.result === run.result)) return;
            this.draft.runs = [...this.draft.runs, { ...run }].slice(-maxSavedRuns);
            this.status = 'saveOk';
        },
    };
}

export default function registerPromptBuilder(alpine: typeof Alpine) {
    alpine.data('promptBuilder', createWorkspace);
}
