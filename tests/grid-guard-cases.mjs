import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLayout, flushRows, resizePanel } from '../src/lib/kernels/flushRows.ts';
import { isNormalizedDirty } from '../src/lib/kernels/dirtyGuard.ts';

const catalog = [
  { panel: 'returns', cols: 6, minCols: 4 }, { panel: 'money', cols: 6, minCols: 4 },
  { panel: 'queue', cols: 8, minCols: 4 }, { panel: 'digest', cols: 4, minCols: 4 },
];

test('every packed row totals twelve, preserves order and stays packed on replay', () => {
  assert.deepEqual(flushRows([]), []);
  for (const widths of [[4], [4, 4, 3, 6, 2], [2, NaN, -4, 13, 6.5], Array(20).fill(5)]) {
    const panels = widths.map((cols, i) => ({ panel: String(i), cols, minCols: 2 }));
    const rows = flushRows(panels);
    assert.ok(rows.every(row => row.length > 0 && row.reduce((sum, p) => sum + p.cols, 0) === 12));
    assert.deepEqual(rows.flat().map(p => p.panel), panels.map(p => p.panel));
    assert.deepEqual(flushRows(rows.flat()), rows);
    assert.deepEqual(panels.map(p => p.cols), widths);
  }
});

test('resize transfers columns at the logical edge and honors both minima', () => {
  const grown = resizePanel(catalog, 'returns', 'end', 8);
  assert.deepEqual(grown.map(p => p.cols), [8, 4, 8, 4]);
  assert.deepEqual(resizePanel(grown, 'money', 'start', 2), catalog);
  assert.deepEqual(resizePanel(catalog, 'money', 'end', 3), catalog);
  assert.deepEqual(resizePanel(catalog, 'returns', 'end', -20).map(p => p.cols), [4, 8, 8, 4]);
});

test('stored layouts retain supported widths, restore missing defaults and ignore injected fields', () => {
  const result = cleanLayout([null, { panel: 'gone' }, { panel: 'money', cols: 8, minCols: 1 },
    { panel: 'money', cols: 1 }, { panel: 'returns', cols: 3 }], catalog);
  assert.deepEqual(result.map(p => [p.panel, p.cols, p.minCols]), [
    ['money', 8, 4], ['returns', 4, 4], ['queue', 8, 4], ['digest', 4, 4],
  ]);
  assert.deepEqual(cleanLayout('invalid', catalog), catalog);
});

test('dirty checks compare form number representations and preserve significant leading zeros', () => {
  assert.equal(isNormalizedDirty({ hours: 5 }, { hours: ' 5 ' }), false);
  assert.equal(isNormalizedDirty({ id: '001' }, { id: '1' }), true);
  assert.equal(isNormalizedDirty({ note: '' }, {}), true);
  assert.equal(isNormalizedDirty('false', false), true);
  assert.equal(isNormalizedDirty(null, '  '), false);
  assert.equal(isNormalizedDirty('09:00:00', '09:00'), false);
  assert.equal(isNormalizedDirty('09:00:42', '09:00'), true);
});

test('multiselect IDs are sets and nested form keys are order independent', () => {
  assert.equal(isNormalizedDirty({ person: { age: 5, ids: [2, '1', 2] } },
    { person: { ids: ['1', '2'], age: ' 5 ' } }), false);
  assert.equal(isNormalizedDirty(['1,2', '3'], ['1', '2,3']), true);
});
