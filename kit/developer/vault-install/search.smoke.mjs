import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSearchShortcut } from './.vault-smoke/SearchDialog.js';

test('the search component accepts Ctrl+K, Cmd+K, and Arabic keyboard layout', () => {
    const event = { key: 'k', code: 'KeyK', ctrlKey: true };
    assert.equal(isSearchShortcut(event), true);
    assert.equal(isSearchShortcut({ ...event, ctrlKey: false, metaKey: true }), true);
    assert.equal(isSearchShortcut({ ...event, key: 'ن' }), true);
    assert.equal(isSearchShortcut({ ...event, isComposing: true }), false);
    assert.equal(isSearchShortcut({ ...event, shiftKey: true }), false);
});
