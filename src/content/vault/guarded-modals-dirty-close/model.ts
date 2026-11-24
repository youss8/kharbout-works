import { isNormalizedDirty } from '../../../lib/kernels/dirtyGuard';
import { normalizeSchedule, scheduleGuard } from './public/vault/schedule-guard.js';

type Mode = 'edit' | 'reset' | 'note';
const dialog = () => document.querySelector<HTMLDialogElement>('#guard-modal');

export default function createGuards() {
    let navigation: ReturnType<typeof scheduleGuard> | undefined;
    let mounted = true;
    return {
        baseline: normalizeSchedule('5', ['1', '3'], '09:00'),
        hours: '5',
        days: ['1', '3'],
        startTime: '09:00',
        pendingFile: false,
        pending: false,
        rejectNext: false,
        error: '',
        mode: 'edit' as Mode,
        word: '',
        note: '',
        discard: false,
        message: '',
        revision: 1,
        init() {
            mounted = true;
            navigation = scheduleGuard({
                dirty: () => this.dirty,
                pending: () => this.pending,
                requestDiscard: () => {
                    this.discard = true;
                },
                close: (proceed) => this.close(proceed),
            });
        },
        destroy() {
            mounted = false;
            navigation?.destroy();
        },
        get dirty() {
            return (
                this.pendingFile ||
                isNormalizedDirty(
                    this.baseline,
                    normalizeSchedule(this.hours, this.days, this.startTime),
                )
            );
        },
        restore() {
            this.hours = this.baseline.hours;
            this.days = [...this.baseline.days];
            this.startTime = this.baseline.startTime;
            this.pendingFile = false;
            const file = dialog()?.querySelector<HTMLInputElement>('input[type=file]');
            if (file) file.value = '';
            this.rejectNext = false;
            this.error = '';
            this.discard = false;
        },
        open(mode: Mode) {
            this.mode = mode;
            this.word = '';
            this.note = '';
            this.restore();
            if (mode === 'note') {
                const popup = document.querySelector<HTMLElement>('#guard-note');
                popup?.showPopover();
                popup?.querySelector('textarea')?.focus();
                return;
            }
            dialog()?.showModal();
            if (mode === 'edit') navigation?.begin();
            requestAnimationFrame(() =>
                dialog()?.querySelector<HTMLElement>('[data-cancel]')?.focus(),
            );
        },
        toggle(day: string) {
            this.days = this.days.includes(day)
                ? this.days.filter((d) => d !== day)
                : [...this.days, day];
        },
        stage(files: FileList | null) {
            this.pendingFile = Boolean(files?.length);
        },
        close(proceed = false) {
            if (this.mode === 'note') {
                document.querySelector<HTMLElement>('#guard-note')?.hidePopover();
                document.querySelector<HTMLButtonElement>('[data-note-trigger]')?.focus();
            } else {
                if (this.mode === 'edit') navigation?.end(proceed);
                dialog()?.close();
            }
            this.restore();
        },
        keepEditing() {
            navigation?.stay();
            this.discard = false;
            requestAnimationFrame(() =>
                dialog()?.querySelector<HTMLElement>('[data-hours]')?.focus(),
            );
        },
        cancel() {
            if (this.pending) return;
            if (this.discard) this.keepEditing();
            else if (this.mode === 'edit' && this.dirty) this.discard = true;
            else this.close();
        },
        async save() {
            if (this.pending) return;
            if (this.mode === 'edit') {
                const draft = normalizeSchedule(this.hours, this.days, this.startTime);
                this.pending = true;
                const reject = this.rejectNext;
                this.rejectNext = false;
                this.error = '';
                // Simulate a request acknowledgement locally; attachments never enter its payload.
                await new Promise<void>((resolve) => setTimeout(resolve, 180));
                if (!mounted) return;
                this.pending = false;
                if (reject)
                    this.error = 'The demo service rejected this save. Your edits are retained.';
                else if (!/^\d+(?:\.\d+)?$/.test(draft.hours) || Number(draft.hours) > 24)
                    this.error = 'Enter hours between 0 and 24.';
                else if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime))
                    this.error = 'Enter a start time in 24-hour format, such as 09:00.';
                if (this.error) return;
                this.baseline = draft;
                this.message = 'Schedule saved.';
            } else if (this.mode === 'reset') {
                if (this.word !== 'RESET') return;
                this.message = 'Demo credentials reset to revision ' + ++this.revision + '.';
            } else {
                if (!this.note.trim()) return;
                this.message = 'Decision recorded: ' + this.note.trim();
            }
            this.close();
        },
    };
}
