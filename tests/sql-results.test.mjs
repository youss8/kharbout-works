import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareRows } from '../src/lib/tools/sql-results.ts';
import '../src/data/sql-lab/worksheet.test.mjs';

const result = (rows, columns = ['code'], truncated = false) => ({ rows, columns, truncated });

test('result comparison keeps multiplicity, type and null distinct without depending on row order', () => {
    const left = result([[5], [null], [5], ['5']]);
    const right = result([['5'], [null], [5], ['7']]);
    assert.deepEqual(compareRows(left, right), {
        original: [false, false, true, false],
        corrected: [false, false, false, true],
        exact: false,
    });
    assert.equal(compareRows(left, result([...left.rows].reverse())).exact, true);
});

test('result comparison excludes incomplete and differently shaped results', () => {
    assert.equal(compareRows(result([[5]]), result([[5]], ['other'])), null);
    assert.equal(compareRows(result([[5]], ['code'], true), result([[5]])), null);
});

test('large SQLite integers and infinite reals retain their exact types', () => {
    const left = result([[9_007_199_254_740_992n], [Infinity], [null]]);
    const right = result([[9_007_199_254_740_993n], [null], ['Infinity']]);
    assert.deepEqual(compareRows(left, right), {
        original: [true, true, false],
        corrected: [true, false, true],
        exact: false,
    });
});
