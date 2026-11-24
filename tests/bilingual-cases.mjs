import assert from 'node:assert/strict';
import test from 'node:test';
import {
    bilingualSearch,
    editDistance,
    frecency,
    normalizeAr,
    prepareAskIndex,
    swapLayout,
} from '../src/lib/kernels/bilingualAsk.ts';

const items = [
    { key: 'returns', label: 'Monthly Site Returns', aliases: ['العائدات الشهرية', 'reports'] },
    { key: 'queue', label: 'Overdue queue', aliases: ['متأخر'] },
    { key: 'create', label: 'Create ticket', aliases: ['تذكرة'] },
    { key: 'theme', label: 'Dark mode', aliases: ['الثيم'] },
    { key: 'board', label: 'Workflow board', aliases: ['كانبان'] },
];
const search = (query) => bilingualSearch(query, { items });
test('Arabic search folds spelling, marks and elongation, preserving short words', () => {
    assert.equal(normalizeAr('أإآ ة ى الْعَائِـدات'), 'ااا ه ي عائدات');
    assert.equal(normalizeAr('الآن منزل'), 'الان منزل');
    assert.equal(search('عائِدات')[0].item.key, 'returns');
    assert.equal(search('العائدات')[0].item.key, 'returns');
});

test('Arabic 101 keyboard fallback matches in both directions and supports the B ligature', () => {
    assert.equal(swapLayout(';hk'), 'كان');
    assert.equal(swapLayout('b'), 'لا');
    assert.equal(swapLayout('لا'), 'b');
    assert.equal(search(';hk')[0].item.key, 'board');
    assert.equal(search(swapLayout('returns'))[0].item.key, 'returns');
    assert.equal(search('returns')[0].breakdown.layoutPenalty, 0);
});

test('typo budget is one edit at four letters and two at seven', () => {
    assert.equal(editDistance('retrns', 'returns', 1), 1);
    assert.equal(editDistance('ret', 'returns', 1), 2);
    assert.equal(search('retrns')[0].item.key, 'returns');
    assert.equal(search('rxturxs')[0].item.key, 'returns');
    assert.deepEqual(search('dqr'), []);
    assert.deepEqual(search('zopx'), []);
});

test('intent grammar and bilingual aliases resolve commands and multi-word queries', () => {
    for (const [query, key] of [
        ['what is late', 'queue'],
        ['new', 'create'],
        ['داكن', 'theme'],
        ['اعرض المتأخرة', 'queue'],
    ]) {
        const match = search(query)[0];
        assert.equal(match.item.key, key);
        assert.ok(match.breakdown.intent > 0);
    }
    assert.deepEqual(search('overdue impossible'), []);
});

test('highlight ranges preserve original punctuation and Arabic marks as literal text', () => {
    const label = '<القَائِمة> / عائِدات';
    const [{ highlights }] = bilingualSearch('قائمه', { items: [{ key: 'label', label }] });
    assert.equal(highlights.map((part) => part.text).join(''), label);
    assert.equal(highlights.find((part) => part.matched).text, 'القَائِمة');
    assert.deepEqual(search('retrns')[0].highlights, [
        { text: 'Monthly Site ', matched: false },
        { text: 'Returns', matched: true },
    ]);
});

test('prepared index and raw items agree; repeated recent picks break ties without creating matches', () => {
    const recent = ['theme', 'theme', 'queue'];
    assert.ok(frecency('theme', recent) > frecency('queue', recent));
    assert.equal(bilingualSearch('', { items, recent })[0].item.key, 'theme');
    assert.deepEqual(
        bilingualSearch('returns', { items: prepareAskIndex(items), recent }),
        bilingualSearch('returns', { items, recent }),
    );
    assert.deepEqual(bilingualSearch('zxjxkk', { items, recent }), []);
});
