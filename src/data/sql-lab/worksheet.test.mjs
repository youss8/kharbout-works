import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

test('the reference queries expose and correct the duplicate funding total', () => {
    const db = new DatabaseSync(':memory:');
    try {
        db.exec(read('fixture.sql'));
        const expected = JSON.parse(read('expected.json'));
        for (const name of ['original', 'corrected']) {
            const actual = db
                .prepare(read(name + '.sql'))
                .all()
                .map((row) => ({ ...row }));
            assert.deepEqual(actual, expected[name]);
        }
        const joinedRows = db.prepare(read('joined-rows.sql')).all();
        assert.deepEqual(
            joinedRows.filter((row) => row.copies === 2).map((row) => row.award),
            [101, 101, 102, 102],
        );
    } finally {
        db.close();
    }
});
