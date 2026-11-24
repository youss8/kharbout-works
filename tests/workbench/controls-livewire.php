<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use Livewire\Livewire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return static function (string $slug, array $snapshot): void {
    $call = static function (string $method, array $args) use (&$snapshot) {
        [$snapshot, $effects] = Livewire::update($snapshot, [], [['method' => $method, 'params' => $args]]);

        return $effects['returns'][0] ?? null;
    };
    $expect = static function ($actual, $expected) use ($slug): void {
        if ($actual !== $expected) {
            throw new RuntimeException("$slug returned an unexpected action result.");
        }
    };
    if ($slug === 'guarded-modals-dirty-close') {
        $expect($call('hasUnsavedSchedule', [' 5 ', ['3', '1', '1']]), false);
        $expect($call('hasUnsavedSchedule', ['005', ['1', '3']]), true);
        $expect($call('resetCredentials', ['RESET']), true);
        $expect($call('recordDecision', ['Reviewed terms']), true);
    }
    if ($slug === 'office-pdf-preview') {
        $expect($call('previewAdjacent', [1, 0, 4]), 1);
        $expect($call('previewAdjacent', [-1, 0, 4]), 0);
        $expect($call('previewAdjacent', [1, 3, 4]), 3);
    }
    if ($slug === 'fail-closed-role-drawer') {
        Gate::define('vault.regional-hr', fn (?object $user = null) => true);
        $expect($call('switchRole', ['Regional HR']), 'Regional HR');
        $expect($call('inspectProfile', [88])['id'], 88);
        $expect($call('switchRole', ['Employee']), 'Employee');
        foreach ([88, 404] as $unavailable) {
            try {
                $call('inspectProfile', [$unavailable]);
                throw new RuntimeException('Unavailable profile disclosed.');
            } catch (NotFoundHttpException $e) {
                $expect($e->getStatusCode(), 404);
            }
        }
    }
};
