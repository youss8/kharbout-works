<?php

namespace App\Livewire;

use RuntimeException;

final class WorkInbox
{
    public static function digest(?string $unavailable): array
    {
        $adapters = [
            'loans' => ['Overdue loans', 'crit', fn () => count(array_filter([-4, -2, 3, -1, -7], fn ($d) => $d < 0))],
            'licenses' => ['Expiring licenses', 'warn', fn () => count(array_filter([5, 12, 50], fn ($d) => $d <= 30))],
            'returns' => ['Late site returns', 'crit', fn () => self::countState(['late', 'late', 'submitted', 'late'], 'late')],
            'access' => ['Access reviews', 'warn', fn () => self::countState(['complete', 'complete'], 'pending')],
            'leave' => ['Leave requests', 'warn', fn () => self::countState(['pending', 'approved', 'pending'], 'pending')],
            'contracts' => ['Ending contracts', 'warn', fn () => count(array_filter([9, 40, 83], fn ($d) => $d <= 30))],
        ];
        $rows = [];
        $failed = [];
        foreach ($adapters as $key => [$label,$urgency,$read]) {
            try {
                if ($unavailable === $key) {
                    throw new RuntimeException($label.' unavailable');
                }
                $count = $read();
                $tone = $count === 0 ? 'neutral' : $urgency;
                $glyph = ['neutral' => '○', 'crit' => '■', 'warn' => '◐'][$tone];
                $rows[] = compact('key', 'label', 'count', 'tone', 'glyph');
            } catch (RuntimeException $error) {
                $failed[$key] = $error->getMessage();
            }
        }

        return compact('rows', 'failed');
    }

    private static function countState(array $records, string $status): int
    {
        return count(array_filter($records, fn ($state) => $status === $state));
    }

    public static function checkDecision(array $row, int $expected): InboxOutcome
    {
        if ($row[2] !== null) {
            return InboxOutcome::AlreadyHandled;
        }

        return $row[1] === $expected ? InboxOutcome::Done : InboxOutcome::Changed;
    }
}

enum InboxOutcome: string
{
    case Changed = 'changed';
    case AlreadyHandled = 'already_handled';
    case Done = 'done';
}
