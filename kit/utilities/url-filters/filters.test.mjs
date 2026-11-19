import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { readFilters, writeFilters } from './filters.ts';

test('reads blank, missing and repeated parameters consistently', () => {
    const url = new URL('https://example.test/?q=%20%20&category=pages&category=tools');
    deepEqual(readFilters(url), { query: '', category: 'pages' });
    deepEqual(readFilters(new URL('https://example.test')), { query: '', category: '' });
});

test('preserves the source URL, unrelated parameters and fragment', () => {
    const input = new URL('https://example.test/browse?view=list&page=4#entries');
    const output = writeFilters(input, { query: '  C++ & React  ', category: 'utilities' });
    deepEqual(readFilters(output), { query: 'C++ & React', category: 'utilities' });
    equal(output.searchParams.get('view'), 'list');
    equal(output.hash, '#entries');
    equal(output.searchParams.has('page'), false);
    equal(input.href, 'https://example.test/browse?view=list&page=4#entries');
});

test('retains pagination when normalized filters are unchanged', () => {
    const input = new URL('https://example.test/?q=نسخ&category=pages&page=3');
    const output = writeFilters(input, { query: ' نسخ ', category: 'pages' });
    equal(output.searchParams.get('page'), '3');
    equal(output.searchParams.get('q'), 'نسخ');
});

test('clears all repeated filter parameters when removing filters', () => {
    const input = new URL('https://example.test/?q=tools&q=copy&category=pages&page=2');
    equal(writeFilters(input, { query: '', category: ' ' }).search, '');
});
