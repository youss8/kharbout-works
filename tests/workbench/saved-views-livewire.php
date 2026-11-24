<?php

declare(strict_types=1);

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;
use Livewire\Livewire;

return static function (array $snapshot): void {
    Gate::define('vault.regional-hr', static fn (?Authenticatable $user = null): bool => true);
    $step = static function (?string $method, array $args = [], array $updates = []) use (&$snapshot): array {
        [$snapshot,$effects] = Livewire::update($snapshot, $updates, $method === null ? [] : [['method' => $method, 'params' => $args]]);

        return $effects;
    };
    $assert = static function (bool $value, string $why): void {
        if (! $value) {
            throw new RuntimeException("Saved views: $why");
        }
    };
    $step(null, [], ['role' => 'Regional HR']);
    $step('applyRegion', ['North']);
    $step('applyFilters', [['Restricted']]);
    $html = $step('saveView', [], ['name' => 'Restricted work'])['html'];
    $assert(str_contains($html, 'Contract C') && ! str_contains($html, 'Contract A'), 'active filters not combined');
    $html = $step(null, [], ['role' => 'Employee'])['html'];
    $assert(! str_contains($html, 'Restricted work') && str_contains($html, 'Removed filters'), 'cross-role view or stale filter visible');
    $step('applyRegion', ['East']);
    $step('saveView', [], ['name' => 'East view']);
    $html = $step(null, [], ['role' => 'Regional HR'])['html'];
    $assert(str_contains($html, 'Restricted work') && ! str_contains($html, 'East view'), 'role scope lost on return');
    $id = hash('sha256', 'Regional HR|Restricted work');
    $step('applyView', [$id]);
    $assert($snapshot['data']['region'] === 'North' && $snapshot['data']['status'][0] === ['Restricted'], 'restored filter state incorrect');
    $step('deleteView', [$id]);
    $stored = session('example.register.views');
    $assert(count($stored) === 1 && reset($stored)['name'] === 'East view', 'deleting one view clobbered the other scope');
    session()->forget('example.register');
};
