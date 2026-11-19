<?php

use Inertia\Testing\AssertableInertia as Assert;

it('lists entries with shareable links covering each collection', function () {
    $response = $this->withoutVite()->get('/')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Browse')->has('entries', 6));

    $entries = $response->inertiaProps('entries');
    expect(array_values(array_unique(array_column($entries, 'category'))))->toEqualCanonicalizing([
        'Components', 'Pages', 'Utilities', 'Modules', 'AI tools',
    ]);

    foreach ($entries as $entry) {
        $this->get($entry['href'])->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Entry')->where('entry', $entry));
    }
});

it('returns 404 for an unknown entry', function () {
    $this->get('/entries/does-not-exist')->assertNotFound();
});
