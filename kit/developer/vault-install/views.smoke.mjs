import assert from 'node:assert/strict';
import { test } from 'node:test';
import createViews from './src/kharbout/content/vault/saved-views-sticky-filters/model.ts';
import { setDemoStorage } from './src/kharbout/lib/kernels/demoStorage.ts';

test('a saved view is visible in its role and persists filters without row data', () => {
    const storage = new Map();
    setDemoStorage({
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
    });
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
    const view = createViews();
    try {
        view.init();
        view.name = 'North review';
        view.region = 'North';
        view.active = ['Restricted'];
        view.save();
        const stored = JSON.parse(storage.get('vault-register-views-v1'));
        assert.deepEqual(
            stored.map(({ name }) => name),
            ['North review'],
        );
        assert.ok(
            stored.every((item) => !Object.hasOwn(item, 'ids') && !Object.hasOwn(item, 'pay')),
        );
        view.changeRole('Employee');
        assert.ok(view.scopedViews.every(({ name }) => name !== 'North review'));
        view.changeRole('Regional HR');
        assert.ok(view.scopedViews.some(({ name }) => name === 'North review'));
    } finally {
        view.destroy();
        if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
        else Reflect.deleteProperty(globalThis, 'window');
    }
});
