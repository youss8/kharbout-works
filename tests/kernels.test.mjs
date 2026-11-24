import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { computePooledRatio } from '../src/lib/kernels/pooledRatio.ts';
import './grid-guard-cases.mjs';
import './register-cases.mjs';
import './bilingual-cases.mjs';

test('the September retention KPI pools people across sites and counts the missing site', () => {
    const data = JSON.parse(
        readFileSync(new URL('../src/data/demos/pt-kpi-cockpit.json', import.meta.url)),
    );
    const indicator = data.tree[0].children[0].kpis.find((kpi) => kpi.code === 'EMP-02');
    const result = computePooledRatio(
        indicator.targets.map((site) => site.readings.at(-1) ?? null),
    );
    assert.deepEqual([result.numerator, result.denominator, result.excluded], [61, 90, 1]);
    assert.equal(result.pooled.toFixed(1), '67.8');
    assert.equal(result.average.toFixed(1), '59.6');
});

test('a measured zero is retained while unusable readings stay missing', () => {
    const missing = [null, { numerator: null, denominator: 5 }, { numerator: 8, denominator: 0 }];
    assert.equal(computePooledRatio(missing).pooled, null);
    assert.deepEqual(computePooledRatio([...missing, { numerator: 0, denominator: 1 }]), {
        numerator: 0,
        denominator: 1,
        included: 1,
        excluded: 3,
        pooled: 0,
        average: 0,
    });
});
