<?php

declare(strict_types=1);

use Livewire\Livewire;

return static function (array $snapshot): void {
    $call = static function (string $method, array $args) use (&$snapshot) {
        [$snapshot, $effects] = Livewire::update($snapshot, [], [['method' => $method, 'params' => $args]]);

        return $effects['returns'][0] ?? null;
    };
    $assert = static function (bool $ok, string $message): void {
        if (! $ok) {
            throw new RuntimeException('Schedule guard: '.$message);
        }
    };
    $initial = $snapshot['data']['saved'];
    $assert($call('hasUnsavedSchedule', [' 5 ', [3, 1, 1], '09:00:00']) === false, 'equivalent time, IDs or scalars marked dirty');
    $assert($call('hasUnsavedSchedule', ['5', ['1', '3'], '09:00', true]) === true, 'pending file alone ignored');
    foreach ([[' 6 ', [2], '10:30', true], ['80', [1], '09:00'], ['5', [1], '26:01']] as $invalid) {
        $assert($call('saveSchedule', $invalid) === false, 'rejected edit acknowledged');
        $assert($snapshot['data']['saved'] === $initial && $snapshot['data']['saveError'] !== '', 'rejection changed stored baseline or omitted error');
    }
    $assert($call('saveSchedule', [' 6 ', ['2', 1, 2], '10:30:00']) === true, 'valid retry rejected');
    $assert($call('hasUnsavedSchedule', ['6', [1, 2], '10:30']) === false, 'confirmed normalized baseline not restored');
};
