import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('each curated kit cites the original component IDs assigned by the master blueprint', () => {
    const spec = readFileSync('VAULT_MASTER_BLUEPRINT.md', 'utf8');
    const counts = { PT: 44, IT: 28, HR: 25 };
    const sections = spec.split(/^#### /m).slice(1);
    assert.equal(sections.length, 20);
    for (const section of sections) {
        const [, order, slug] = section.match(/^(\d+)\..*?\(`([\w-]+)`\)/);
        const attribution = section.split('\n')[1];
        const ids = [];
        for (const [, system, numbers] of attribution.matchAll(/(PT|IT|HR) #(\d+(?:\/#\d+)*)/g)) {
            for (const number of numbers.split('/#')) {
                assert.ok(Number(number) >= 1 && Number(number) <= counts[system]);
                ids.push(system + '-' + number.padStart(2, '0'));
            }
        }
        const kit = JSON.parse(readFileSync('src/content/vault/' + slug + '/kit.json', 'utf8'));
        assert.equal(kit.order, Number(order));
        assert.deepEqual(kit.sourceIds, ids, slug);
        assert.ok(ids.length > 0);
    }
});
