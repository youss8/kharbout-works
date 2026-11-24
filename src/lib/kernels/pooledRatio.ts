export interface SiteReading {
    numerator: number | null;
    denominator: number | null;
}

/** Each contributing person gets equal weight, regardless of their site's size. */
export function computePooledRatio(readings: readonly (SiteReading | null)[]) {
    let numerator = 0;
    let denominator = 0;
    let summedRatios = 0;
    let included = 0;
    for (const reading of readings) {
        if (!reading) continue;
        const { numerator: n, denominator: d } = reading;
        if (
            n === null ||
            d === null ||
            !Number.isFinite(n) ||
            !Number.isFinite(d) ||
            n < 0 ||
            d <= 0
        )
            continue;
        numerator += n;
        denominator += d;
        summedRatios += n / d;
        included++;
    }
    return {
        numerator,
        denominator,
        included,
        excluded: readings.length - included,
        pooled: included ? (100 * numerator) / denominator : null,
        average: included ? (100 * summedRatios) / included : null,
    };
}
