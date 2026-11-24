import { rankPriority } from '../../../lib/kernels/sla';

export const toneMap = {
    work: { label: 'In progress', shape: 'solid', glyph: '●', tone: 'accent' },
    done: { label: 'Approved', shape: 'surface', glyph: '●', tone: 'ok' },
    attn: { label: 'Needs review', shape: 'outline', glyph: '◐', tone: 'warn' },
    stop: { label: 'Blocked', shape: 'dashed', glyph: '■', tone: 'crit' },
    wait: { label: 'Waiting', shape: 'hairline', glyph: '○', tone: 'neutral' },
} as const;

const urgencyMap = {
    act: { variant: 'act', label: 'Active' },
    late: { variant: 'late', label: 'Overdue' },
    rush: { variant: 'rush', label: 'Starts in 2d' },
    soft: { variant: 'soft', label: 'Scheduled' },
} as const;

export const states = [
    { ...toneMap.work, urgency: urgencyMap.act },
    { ...toneMap.done, urgency: null },
    { ...toneMap.attn, urgency: urgencyMap.rush },
    { ...toneMap.stop, urgency: urgencyMap.late },
    { ...toneMap.wait, urgency: urgencyMap.soft },
];
export const ratings: Record<string, string> = {
    '1': 'Low',
    '2': 'Medium',
    '3': 'High',
    '': 'Not rated',
};
const priorities = ['Critical', 'High', 'Medium', 'Low'];
export const readPriority = (raw: string) =>
    priorities[rankPriority(raw)] ?? 'Unknown · sorted last';
export function writePriority(raw: string) {
    if (!priorities.includes(raw)) throw new Error('Choose Critical, High, Medium or Low.');
    return raw;
}
export default function vocabulary() {
    return {
        states,
        held: true,
        rating: '3',
        ratings,
        readPriority,
        raw: 'urgent',
        saved: 'Medium',
        message: '',
        save() {
            try {
                this.saved = writePriority(this.raw);
                this.message = 'Saved ' + this.saved;
            } catch (error) {
                this.message = (error as Error).message;
            }
        },
    };
}
