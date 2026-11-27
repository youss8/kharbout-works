import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from '../src/lib/kernels/safeCsv.ts';
import {
    createKpiReport,
    exportKpiReport,
    readKpiCsv,
    validateKpiMapping,
} from '../src/lib/tools/kpi-report.ts';

test('KPI report separates reporting periods, measured zero, and excluded records', () => {
    const dataset = readKpiCsv(
        [
            'Branch,Month,Retained,Eligible',
            'North Hub,2026-09,52,70',
            'Harbor Point,2026-09,9,20',
            'Valley Office,2026-09,,',
            'North Hub,2026-08,0,3',
            'Harbor Point,2026-08,5,0',
            'Valley Office,2026-08,42,4',
            'Other Site,,2,2',
        ].join('\n'),
    );
    const report = createKpiReport(dataset, dataset.mapping);
    assert.deepEqual(
        report.periods.map(({ numerator, denominator, included }) => [
            numerator,
            denominator,
            included,
        ]),
        [
            [61, 90, 2],
            [0, 3, 1],
        ],
    );
    assert.deepEqual(
        report.rows.map(({ status }) => status),
        ['Included', 'Included', 'Missing', 'Included', 'Invalid', 'Invalid', 'Missing'],
    );
    assert.equal(report.unassigned, 1);
    assert.equal(report.rows[3].reason, 'Measured zero included.');
});

test('KPI report requires a distinct column per field and excludes every duplicate', () => {
    const dataset = readKpiCsv(
        'Site,Site,Period,Numerator,Denominator\nNorth,Other,Q1,1,3\nNORTH,Other,q1,1,3\nNorth,Other,Q2,2,4',
    );
    assert.equal(dataset.mapping.site, -1);
    assert.match(validateKpiMapping(dataset, { ...dataset.mapping, site: 2 }), /different column/);
    const report = createKpiReport(dataset, { ...dataset.mapping, site: 0 });
    assert.deepEqual(
        report.rows.map(({ status }) => status),
        ['Duplicate', 'Duplicate', 'Included'],
    );
    assert.equal(report.periods[0].pooled, null);
    assert.equal(report.periods[1].pooled, 50);
});

test('KPI validation exports every row safely even when totals exceed integer precision', () => {
    const dataset = readKpiCsv(
        'Site,Period,Numerator,Denominator\n=1+1,Q1,1,9007199254740991\nNorth,Q1,7,10\nHarbor,Q1,1',
    );
    const report = createKpiReport(dataset, dataset.mapping);
    assert.equal(report.periods[0].precise, false);
    const [headers, summary, formula, , truncated] = parseCsv(exportKpiReport(report));
    assert.equal(headers.length, 12);
    assert.equal(summary[10], '');
    assert.equal(formula[2], "'=1+1");
    assert.equal(truncated[6], 'Invalid');
    assert.match(truncated[7], /Expected 4 columns/);
});
