<?php

namespace App\Livewire\Concerns;

trait WithDirtyGuard
{
    protected function normalizedSchedule(string $hours, array $days, string $startTime = '09:00'): array
    {
        $days = array_values(array_unique(array_map(strval(...), $days)));
        sort($days, SORT_STRING);
        $startTime = preg_replace('/^((?:[01]\d|2[0-3]):[0-5]\d):00$/D', '$1', trim($startTime));

        return ['hours' => trim($hours), 'days' => $days, 'startTime' => $startTime];
    }

    public function hasUnsavedSchedule(string $hours, array $days, string $startTime = '09:00', bool $pendingFile = false): bool
    {
        return $pendingFile || $this->normalizedSchedule($hours, $days, $startTime) !== $this->saved;
    }
}
