// Synthetic authorized response for the static role demonstration.
export const pay = {
    original: 'EUR 2,800 / month',
    live: 'EUR 3,200 / month',
    amendments: {
        'AMD-01': { before: 'EUR 2,800 / month', after: 'EUR 3,050 / month' },
        'AMD-02': { before: 'EUR 3,050 / month', after: 'EUR 3,200 / month' },
    } as Record<string, { before: string; after: string }>,
};
