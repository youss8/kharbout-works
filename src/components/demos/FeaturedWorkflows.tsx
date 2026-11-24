import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, ChartNoAxesCombined } from 'lucide-react';

interface Ratio {
    value: string;
    detail: string;
}

interface LeaveQuote {
    value: string;
    days: { date: string; label: string; hours: number }[];
}

interface Props {
    tracking: {
        indicator: string;
        title: string;
        pooled: Ratio;
        average: Ratio;
        exclusions: string[];
        href: string;
    };
    hr: {
        full: LeaveQuote;
        am: LeaveQuote;
        href: string;
    };
}

const methodChoices = [['pooled', 'Pooled ratio'], ['average', 'Site average']] as const;
const leaveChoices = [['full', 'Full day'], ['am', 'Morning only']] as const;
const dateLabel = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const workflowChoice = 'flex min-h-11 items-center justify-center gap-2 rounded-md px-2 text-sm! font-bold! text-[#deeee6] hover:bg-white/10 aria-pressed:bg-[#f0f9f4] aria-pressed:text-[#103c31] focus-visible:outline-[#c1f4df]';
const inputChoice = 'min-h-11 rounded-md border border-strong px-2.5 text-[0.8rem]! font-bold! text-ink-secondary hover:bg-accent-tint aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent';

export default function FeaturedWorkflows({ tracking, hr }: Props) {
    const [ready, setReady] = useState(false);
    const [workflow, setWorkflow] = useState<'tracking' | 'hr'>('tracking');
    const [method, setMethod] = useState<'pooled' | 'average'>('pooled');
    const [partOfDay, setPartOfDay] = useState<'full' | 'am'>('full');
    useEffect(() => { setReady(true); }, []);

    const isTracking = workflow === 'tracking';
    const ratio = tracking[method];
    const quote = hr[partOfDay];

    return (
        <section id="featured-workflows" aria-labelledby="featured-workflow-title"
            className="min-w-0 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_18px_45px_-28px_#09291f55]">
            <div role="group" aria-label="Choose a workflow" data-workflow-controls
                className="grid grid-cols-2 gap-1.5 bg-[#103c31] p-2 dark:bg-[#15372e]">
                <button type="button" disabled={!ready} aria-pressed={isTracking} onClick={() => setWorkflow('tracking')} className={workflowChoice}>
                    <ChartNoAxesCombined size={17} aria-hidden="true" /> Portfolio tracking
                </button>
                <button type="button" disabled={!ready} aria-pressed={!isTracking} onClick={() => setWorkflow('hr')} className={workflowChoice}>
                    <CalendarDays size={17} aria-hidden="true" /> HR workflows
                </button>
            </div>
            <div className="grid gap-3 px-[clamp(0.85rem,2.4vw,1.5rem)] py-[clamp(0.9rem,2.3vw,1.4rem)]">
                <div>
                    <p className="font-mono text-[0.71rem] font-semibold text-accent">
                        {isTracking ? <><bdi>{tracking.indicator}</bdi> · Sample KPI</> : 'Sample leave request · Before approval'}
                    </p>
                    <h2 id="featured-workflow-title" className="mt-1.5 text-[clamp(1.2rem,2.4vw,1.65rem)] leading-tight font-bold [text-wrap:pretty]">
                        {isTracking ? tracking.title : 'How much leave will be charged?'}
                    </h2>
                </div>
                {isTracking ? (
                    <>
                        <div role="group" aria-label="Rollup method" data-workflow-controls className="flex flex-wrap gap-1.5">
                            {methodChoices.map(([key, label]) => <button key={key} type="button" className={inputChoice}
                                disabled={!ready} aria-pressed={method === key} onClick={() => setMethod(key)}>{label}</button>)}
                        </div>
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-hairline bg-accent-tint p-3 text-accent motion-safe:transition-colors"
                            role="status" aria-live="polite" aria-atomic="true">
                            <bdi className="font-mono text-[clamp(1.35rem,3vw,2rem)] font-semibold leading-tight">{ratio.value}</bdi>
                            <p className="text-xs font-semibold">{ratio.detail}</p>
                        </div>
                        {tracking.exclusions.map(note => <p key={note} className="text-xs text-ink-secondary">{note}</p>)}
                    </>
                ) : (
                    <>
                        <div role="group" aria-label="Part of day" data-workflow-controls className="flex flex-wrap gap-1.5">
                            {leaveChoices.map(([key, label]) => <button key={key} type="button" className={inputChoice}
                                disabled={!ready} aria-pressed={partOfDay === key} onClick={() => setPartOfDay(key)}>{label}</button>)}
                        </div>
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-hairline bg-accent-tint p-3 text-accent motion-safe:transition-colors"
                            role="status" aria-live="polite" aria-atomic="true">
                            <bdi className="font-mono text-[clamp(1.35rem,3vw,2rem)] font-semibold leading-tight">{quote.value}</bdi>
                            <p className="text-xs font-semibold">Quoted leave · holidays and weekends excluded</p>
                        </div>
                        <ul aria-label="Day-by-day quote" className="grid grid-cols-2 gap-1.5 min-[410px]:grid-cols-4">
                            {quote.days.map(day => (
                                <li key={day.date} className="min-w-0 rounded-md border border-hairline bg-subtle px-2 py-1.5 text-xs">
                                    <time className="block text-ink-secondary" dateTime={day.date}>{dateLabel.format(new Date(day.date))}</time>
                                    <strong>{day.hours ? <bdi>{day.hours}h</bdi> : day.label.replace(' excluded', '')}</strong>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <a href={isTracking ? tracking.href : hr.href}
                    className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-accent underline-offset-4 hover:underline">
                    {isTracking ? 'Open KPI cockpit' : 'Open leave approval desk'} <ArrowRight size={15} className="directional-icon" aria-hidden="true" />
                </a>
            </div>
        </section>
    );
}
