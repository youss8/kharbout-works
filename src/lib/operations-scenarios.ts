import kpi from '../data/demos/pt-kpi-cockpit.json';
import { attendanceDesk } from '../components/demos/hr-alpine.js';
import { computePooledRatio } from './kernels/pooledRatio.ts';

export const scenarioVersion = '1';
export const sponsorScenario = '/scenarios/sponsor-report/';
export const timesheetScenario = '/scenarios/close-timesheet/';
export const reportCutoff = kpi.asOf;

const retention = kpi.tree[0].children[0].kpis.find(({ code }) => code === 'EMP-02');
if (!retention) throw new Error('The sponsor scenario requires the EMP-02 retention fixture.');

export const sponsorSites = kpi.sites.map((site) => {
    const target = retention.targets.find((candidate) => candidate.site === site.id);
    return {
        ...site,
        reading:
            target && 'readings' in target
                ? (target.readings?.find(({ month }) => month === reportCutoff.slice(0, 7)) ?? null)
                : null,
    };
});
export const lateReturn = { numerator: 12, denominator: 30 };
export const lateSite = sponsorSites.find((site) => site.id === 'S3');
if (!lateSite || lateSite.reading)
    throw new Error('The sponsor scenario requires a missing S3 return.');

export type Method = 'pooled' | 'average';
export type Cutoff = 'original' | 'revised';

export function sponsorChoice(search: string) {
    const query = new URLSearchParams(search);
    const method = query.get('method');
    const cutoff = query.get('cutoff');
    if (query.get('v') !== scenarioVersion || (method !== 'pooled' && method !== 'average')) {
        return { method: null, cutoff: null } as const;
    }
    return { method, cutoff: cutoff === 'original' || cutoff === 'revised' ? cutoff : null };
}

export function sponsorResult(cutoff: Cutoff) {
    return computePooledRatio(
        sponsorSites.map((site) =>
            site === lateSite && cutoff === 'revised' ? lateReturn : site.reading,
        ),
    );
}

export const timesheetActions = [
    {
        key: 'resolve',
        date: '2026-11-03',
        resolution: 'Worked Full (8h)',
        label: '3 November · Record 8 hours',
    },
    {
        key: 'resolve',
        date: '2026-11-09',
        resolution: 'Half Day (4h)',
        label: '9 November · Record 4 hours',
    },
    { key: 'confirm', label: 'Confirm as employee' },
    { key: 'self', label: 'Try approving your own timesheet' },
    { key: 'approve', label: 'Approve as a different manager' },
    { key: 'lock', label: 'Lock the month as HR' },
] as const;

export function timesheetStep(search: string) {
    const query = new URLSearchParams(search);
    const step = query.get('step');
    return query.get('v') === scenarioVersion && step && /^[1-6]$/.test(step) ? Number(step) : 0;
}

export function replayTimesheet(step: number) {
    const desk = attendanceDesk();
    const events: string[] = [];
    for (const action of timesheetActions.slice(0, step)) {
        if (action.key === 'resolve') {
            const option = desk.resolutions.find(({ label }) => label === action.resolution);
            desk.decisionDate = action.date;
            if (!option || desk.decisionDay?.status !== 'unresolved') {
                throw new Error(
                    `The timesheet scenario requires an unresolved punch on ${action.date}.`,
                );
            }
            desk.decide(option);
        } else if (action.key === 'self') {
            desk.selfApproval = true;
            desk.transition('approve');
        } else {
            desk.selfApproval = false;
            desk.transition(action.key);
        }
        events.push(desk.notice);
    }
    return {
        state: desk.month.state,
        unresolved: desk.unresolved,
        credit: desk.month.overtimeCreditGrantedHours,
        events,
    };
}
