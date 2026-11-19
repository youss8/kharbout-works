<?php

use Inertia\Testing\AssertableInertia as Assert;

it('lists entries with shareable links covering each collection', function () {
    $response = $this->withoutVite()->get('/')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Browse')->has('entries', 7));

    $entries = $response->inertiaProps('entries');
    expect(array_values(array_unique(array_column($entries, 'category'))))->toEqualCanonicalizing([
        'Components', 'Pages', 'Utilities', 'Modules', 'AI tools',
    ]);

    foreach ($entries as $entry) {
        $this->get($entry['href'])->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Entry')
                ->where('entry', $entry)->where('entries', $entries));
    }
});

it('returns 404 for an unknown entry', function () {
    $this->get('/entries/does-not-exist')->assertNotFound();
});

it('supplies Vault workflows with sample values for every prompt token', function () {
    $response = $this->withoutVite()->get('/')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Browse')->has('workflows'));

    $workflows = $response->inertiaProps('workflows');
    expect(array_unique(array_column($workflows, 'id')))->toHaveCount(count($workflows));
    expect(array_values(array_unique(array_column($workflows, 'platform'))))->toEqualCanonicalizing([
        'claude', 'gemini', 'codex', 'multi-agent',
    ]);

    foreach ($workflows as $workflow) {
        $declared = array_column($workflow['variables'], 'name');
        preg_match_all('/\{\{([A-Z][A-Z0-9_]*)\}\}|\[([A-Z][A-Z0-9_]*)\]/', $workflow['template'], $matches, PREG_SET_ORDER | PREG_UNMATCHED_AS_NULL);
        $tokens = array_column($matches, 1);
        $aliases = array_intersect(array_column($matches, 2), $declared);
        $expected = array_values(array_unique(array_merge(array_filter($tokens), $aliases)));

        expect($expected)->not->toBeEmpty();
        expect($declared)->toEqualCanonicalizing($expected);
        expect($workflow['status'])->toBeIn(['planned', 'example-tested']);
        expect(array_column($workflow['variables'], 'example'))->each->not->toBeEmpty();
        expect($workflow['sampleOutput']['before'])->not->toBeEmpty();
        expect($workflow['sampleOutput']['after'])->not->toBeEmpty();
        expect($workflow['setup'])->toHaveCount(2)->each->not->toBeEmpty();
    }
});
