export type LabProject = {
    id: string;
    title: string;
    summary: string;
    repoUrl?: string;
    liveUrl?: string;
    screenshot?: string;
};

export const labProjects: LabProject[] = [
    { id: 'date-planner', title: 'Plan Your Perfect Date', summary: 'Match preferences, a time window and a spending limit to a two-stop itinerary.' },
    { id: 'habit-tracker', title: 'Daily Habit Tracker', summary: 'Check in on a calendar and see how a missed day changes a streak.' },
    { id: 'landing-redesign', title: 'Landing Pages UX Redesigns', summary: 'Compare two treatments of the same workshop brief, then try the agenda in each.' },
    { id: 'meal-configurator', title: 'Customize Your Own Meal', summary: 'Compose a bowl within dietary constraints and see its price and nutrition change.' },
];
