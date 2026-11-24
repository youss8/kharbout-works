export const stops = [
    'Brief',
    'Draft',
    'Review',
    'Approved',
    'Mobilized',
    'Active',
    'Complete',
] as const;
export type Stage = (typeof stops)[number] | 'Rejected';
const routes: Record<Stage, readonly Stage[]> = {
    Brief: ['Draft'],
    Draft: ['Review'],
    Review: ['Approved', 'Rejected', 'Draft'],
    Rejected: ['Draft'],
    Approved: ['Mobilized'],
    Mobilized: ['Active'],
    Active: ['Complete'],
    Complete: [],
};
export function centerStep(track: HTMLElement) {
    const active = track.querySelector<HTMLElement>('[aria-current=step]');
    if (active)
        track.scrollBy({
            left:
                active.getBoundingClientRect().x +
                active.offsetWidth / 2 -
                track.getBoundingClientRect().x -
                track.clientWidth / 2,
            behavior: 'instant',
        });
}
export default function createModel() {
    return {
        get stops(): readonly Stage[] {
            return stops.map((s) =>
                s === 'Review' && this.current === 'Rejected' ? 'Rejected' : s,
            );
        },
        current: 'Review' as Stage,
        held: false,
        dates: { Brief: '2026-01-12', Draft: '2026-01-20', Review: '2026-02-03' } as Partial<
            Record<Stage, string>
        >,
        expectedFrom: 'Review' as Stage,
        get stepViews() {
            const currentIndex = this.stops.indexOf(this.current);
            return this.stops.map((label, i) => {
                const state =
                    label === 'Rejected'
                        ? 'rejected'
                        : i === currentIndex
                          ? 'current'
                          : i < currentIndex
                            ? 'past'
                            : 'ahead';
                return {
                    label,
                    state,
                    active: label === this.current,
                    date: i <= currentIndex ? this.dates[label] : undefined,
                    glyph: { rejected: '■', current: '●', past: '✓', ahead: '○' }[state],
                };
            });
        },
        version: 1,
        expected: 1,
        target: 'Approved' as Stage,
        reason: '',
        signed: false,
        budget: false,
        notice: '',
        get legal() {
            return routes[this.current];
        },
        begin() {
            this.expected = this.version;
            this.expectedFrom = this.current;
            this.signed = false;
            this.budget = false;
            this.target = this.legal[0] ?? this.current;
            this.reason = '';
            this.notice = '';
        },
        get errors() {
            const errors: string[] = [];
            if (this.version !== this.expected || this.current !== this.expectedFrom)
                errors.push('Record changed. Reload the latest version.');
            if (!this.legal.includes(this.target)) errors.push('Transition unavailable.');
            if (this.held) errors.push('Release the hold.');
            if (this.target === 'Approved' && !this.signed)
                errors.push('Attach a signed funding agreement.');
            if (this.target === 'Approved' && !this.budget)
                errors.push('Confirm budget and dates.');
            if (this.reason.trim().length < 10)
                errors.push('Enter a reason of at least 10 characters.');
            return errors;
        },
        apply() {
            if (this.errors.length) return false;
            this.current = this.target;
            this.dates = { ...this.dates, [this.current]: '2026-02-04' };
            this.version++;
            this.notice = 'Moved to ' + this.current + ' · ' + this.reason.trim();
            return true;
        },
        center: centerStep,
    };
}
