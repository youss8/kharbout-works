<?php

declare(strict_types=1);

use Livewire\Livewire;

return static function (string $slug, array $snapshot): void {
    $check = static function (bool $ok, string $context) use ($slug): void {
        if (! $ok) {
            throw new RuntimeException("$slug: $context");
        }
    };
    $step = static function (?string $method, array $args = [], array $values = []) use (&$snapshot): array {
        $calls = $method === null ? [] : [['method' => $method, 'params' => $args]];
        [$snapshot,$effects] = Livewire::update($snapshot, $values, $calls);

        return $effects;
    };

    if ($slug === 'bilingual-ask-palette') {
        foreach (['retrns' => 'Monthly site returns', 'العائدات' => 'Monthly site returns', ';hk' => 'Historical records', 'what is late' => 'Overdue submissions', 'new' => 'New support request', 'dark' => 'Dark appearance'] as $query => $label) {
            $html = $step('ask', [$query])['html'];
            $check(str_contains(strip_tags($html), $label) && str_contains($html, '<mark>'), "Missing highlighted result for $query");
            $check(str_contains($html, 'intent ') && str_contains($html, 'layout −') && str_contains($html, 'recent '), 'Missing score breakdown');
        }
        $step('pick', ['returns']);
        $check(str_contains($step('ask', ['retrns'])['html'], 'recent 2.0'), 'Missing recency bonus');
    }

    if ($slug === 'status-gate-lifecycle') {
        $step('begin');
        $step('concurrentEdit');
        $effects = $step('changeStatus', [], ['signed' => true, 'budget' => true, 'reason' => 'Agreement reviewed']);
        $check(str_contains($effects['html'], 'Record changed.') && $snapshot['data']['current'] === 'Review', 'Stale transition was accepted');
        $step('reloadVersion');
        $step('changeStatus');
        $check($snapshot['data']['current'] === 'Approved', 'Validated transition did not commit');
        $check(str_contains($step(null, [], ['held' => true])['html'], '◐ On hold'), 'Missing hold chip');
    }

    if ($slug === 'needs-action-inbox') {
        $html = $step(null, [], ['fault' => true])['html'];
        $check(str_contains($html, 'digest incomplete') && ! str_contains($html, 'Expiring licenses'), 'Unavailable source leaked into the digest');
        $check(str_contains($step(null, [], ['fault' => false])['html'], 'Expiring licenses'), 'Retry did not restore the source');
        $step('stale', ['leave:81']);
        foreach ([[1, 'changed'], [2, 'done'], [2, 'already_handled']] as [$version,$outcome]) {
            $effects = $step('decide', ['leave:81', $version, 'Approve']);
            $check(($effects['returns'][0] ?? null) === ['outcome' => $outcome], "Decision must return $outcome");
        }
        $check(str_contains($step('undo')['html'], 'Decision undone.'), 'Undo did not restore the row');
    }

    if ($slug === 'spreadsheet-importer-register') {
        $html = $step('loadSample')['html'];
        $check(str_contains($html, 'paste.csv:4') && str_contains($html, '2025-12-31'), 'Missing CSV warning or Excel date');
        $html = $step('loadRows')['html'];
        $check(str_contains($html, 'Backup overdue') && str_contains($html, 'Run date missing'), 'Missing row tones');
        $step('edit', [1]);
        $step('save', [], ['form.values.interval' => '', 'form.values.notes' => 'unexpected']);
        $patch = $snapshot['data']['payload'][0];
        $check(array_key_exists('interval', $patch) && $patch['interval'] === null && ! array_key_exists('notes', $patch), 'Partial Form write failed');
    }

    if ($slug === 'amendment-diff-org-chart') {
        $html = $step('switchTerms')['html'];
        $check(str_contains($html, 'East Annex') && ! str_contains($html, 'EUR 2,800'), 'Restricted original terms leaked pay');
        $check(str_contains($step(null, [], ['viewer' => 'HR manager'])['html'], 'EUR 2,800'), 'Authorized signed pay missing');
        $check(! str_contains($step(null, [], ['viewer' => 'Coordinator'])['html'], 'EUR 2,800'), 'Role change did not redact pay');
        $html = $step(null, [], ['tab' => 'Org chart', 'hide' => true])['html'];
        $check(substr_count($html, 'data-position=') === 4 && str_contains($html, 'stroke-dasharray="5 4"') && str_contains($html, '@keydown.enter.prevent'), 'Visible chart nodes or technical edge missing');
    }
};
