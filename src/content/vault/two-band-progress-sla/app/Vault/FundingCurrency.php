<?php

namespace App\Vault;

enum FundingCurrency: string
{
    case USD = 'USD';
    case EUR = 'EUR';

    public static function capacity(float $received, float $committed, ?self $currency): array
    {
        if ($currency === null) {
            throw new \InvalidArgumentException('Choose a funding currency to show capacity.');
        }

        $percent = $committed > 0 ? $received / $committed * 100 : null;

        return [
            'received' => number_format($received, 2).' '.$currency->value,
            'committed' => number_format($committed, 2).' '.$currency->value,
            'width' => $percent === null ? null : max(0, min(100, $percent)),
            'over' => $percent !== null && $percent > 100,
            'label' => match (true) {
                $percent === null => 'No funding committed. Percentage unavailable.',
                $percent > 100 => 'Over by '.round($percent - 100, 2).'%',
                default => round($percent, 2).'% received',
            },
        ];
    }
}
