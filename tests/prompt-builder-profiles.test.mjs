import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceChain, compilePrompt, invalidResponseExample, newDraft, readDraft, visiblePrompt } from '../src/lib/prompt-builder/model.ts';
import { modelProfiles } from '../src/lib/prompt-builder/profiles.ts';
import { presets } from '../src/lib/prompt-builder/workflows.ts';

test('every profile compiles the eight presets in English and Arabic and declares an official source', () => {
    assert.equal(modelProfiles.length, 15);
    for (const profile of modelProfiles) {
        if (profile.id !== 'universal') assert.equal(new URL(profile.source).protocol, 'https:');
        for (const preset of presets) {
            for (const locale of ['en', 'ar']) {
                const draft = newDraft(preset.id, locale);
                draft.preferences.profile = profile.id;
                draft.values = Object.fromEntries(preset.fields.map(field => [field.key, field.example[locale]]));
                for (const variant of ['concise', 'detailed']) {
                    const prompt = compilePrompt(draft, variant);
                    assert.ok(prompt.includes(preset.instruction[locale]), profile.id);
                    assert.ok(!/\{\{[A-Z_]+\}\}/.test(prompt), profile.id);
                }
            }
        }
    }
});

test('Claude contains literal markup, Gemini puts the query last, and Copilot labels work sources', () => {
    const draft = newDraft('summarize-notes');
    draft.values.NOTES = 'Read <b>الحالة</b> & {{BUILDER_SOURCES}}';
    draft.preferences.sources = 'Meeting notes.docx';
    draft.preferences.criteria = 'Include the decision date.';
    draft.preferences.profile = 'claude';
    const claude = compilePrompt(draft, 'concise');
    assert.match(claude, /<context>\n<notes>\nSource notes\nRead &lt;b&gt;الحالة&lt;\/b&gt; &amp; \{\{BUILDER_SOURCES\}\}/);
    assert.match(claude, /<sources>\nMeeting notes\.docx\n<\/sources>/);

    draft.preferences.profile = 'gemini';
    const gemini = compilePrompt(draft, 'concise');
    assert.ok(gemini.startsWith('## Response requirements\n'));
    assert.ok(gemini.indexOf('## Provided context') < gemini.indexOf('## Task'));
    assert.ok(gemini.includes(draft.values.NOTES));

    draft.preferences.profile = 'copilot';
    const copilot = compilePrompt(draft, 'concise');
    assert.ok(copilot.startsWith('## Goal\n'));
    assert.ok(copilot.includes('## Sources\nMeeting notes.docx\n\n## Expectations'));
    assert.ok(copilot.includes('Include the decision date.'));
});

test('JSON examples are validated and coding instructions follow the task', () => {
    const draft = newDraft('draft-email');
    draft.preferences.profile = 'deepseek';
    draft.preferences.format = 'json';
    draft.preferences.example = '["not an object"]';
    assert.equal(invalidResponseExample(draft.preferences), true);
    assert.doesNotMatch(compilePrompt(draft, 'concise'), /not an object/);
    draft.preferences.example = '{"subject":"Workshop","body":"Please reply."}';
    assert.equal(invalidResponseExample(draft.preferences), false);
    assert.match(compilePrompt(draft, 'concise'), /single valid JSON object/);
    assert.ok(compilePrompt(draft, 'concise').includes(draft.preferences.example));

    draft.preferences.profile = 'codex';
    assert.doesNotMatch(compilePrompt(draft, 'concise'), /repository’s instructions/);
    draft.preferences.target = 'coding';
    assert.match(compilePrompt(draft, 'concise'), /repository’s instructions/);
});

test('existing version-one drafts open, manual text stays intact, and the model carries to the next step', () => {
    const draft = newDraft('bug-to-spec');
    const { profile, sources, criteria, example, ...oldPreferences } = draft.preferences;
    assert.equal(readDraft({ ...draft, preferences: oldPreferences }).preferences.profile, 'universal');
    assert.equal(readDraft({ ...draft, preferences: { ...oldPreferences, profile: 'unknown' } }), null);
    draft.preferences.profile = 'claude';
    draft.preferences.example = 'A fictional bug issue.';
    draft.edits.concise = 'Keep this text.';
    assert.equal(visiblePrompt(readDraft(draft), 'concise'), draft.edits.concise);
    draft.chain = { id: 'bug-fix', step: 0 };
    const next = advanceChain(draft, 'Confirmed evidence.', 'Fix the filter.');
    assert.equal(next.preferences.profile, 'claude');
    assert.equal(next.preferences.example, '');
});
