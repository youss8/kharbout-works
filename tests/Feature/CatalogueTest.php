<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the catalogue and its example entry', function (string $url, string $page) {
    $this->withoutVite()
        ->get($url)
        ->assertOk()
        ->assertInertia(fn (Assert $response) => $response->component($page));
})->with([
    'browse' => ['/', 'Browse'],
    'entry' => ['/entries/keyboard-shortcut-label', 'Entry'],
]);
