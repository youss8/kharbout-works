import test from 'node:test';
import assert from 'node:assert/strict';
import createViews from '../src/content/vault/saved-views-sticky-filters/model.ts';

test('saved table state merges scopes, strips unexpected fields and ignores malformed preferences', (t) => {
    const memory = new Map();
    const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const restore = (key, old) =>
        old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key];
    Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key) => memory.get(key) ?? null,
            setItem: (key, value) => memory.set(key, value),
        },
    });
    let model;
    t.after(() => {
        model?.destroy();
        restore('window', oldWindow);
        restore('localStorage', oldStorage);
    });
    memory.set('vault-register-state-v2', '{bad');
    memory.set(
        'vault-register-views-v1',
        JSON.stringify([
            {
                role: 'Employee',
                name: 'Mine',
                status: ['Restricted', 'Current'],
                sort: 'invalid',
                query: '',
                ids: [123],
                pay: 2400,
            },
        ]),
    );
    const m = model = createViews();
    m.init();
    assert.equal(m.scopedViews.length, 0);
    m.name = 'North work';
    m.region = 'North';
    m.active = ['Restricted'];
    m.save();
    const stored = JSON.parse(memory.get('vault-register-views-v1'));
    assert.equal(stored.length, 2);
    assert.deepEqual(stored[0].status, ['Current']);
    assert.ok(stored.every((v) => !Object.hasOwn(v, 'ids') && !Object.hasOwn(v, 'pay')));
    m.changeRole('Employee');
    assert.deepEqual(m.active, []);
    assert.deepEqual(
        m.scopedViews.map((v) => v.name),
        ['Mine'],
    );
    m.remove(stored[1]);
    assert.equal(m.views.length, 2);
    m.changeRole('Regional HR');
    assert.deepEqual(m.active, ['Restricted']);
    assert.equal(m.region, 'North');
});
