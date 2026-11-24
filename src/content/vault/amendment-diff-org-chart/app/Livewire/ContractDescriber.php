<?php

namespace App\Livewire;

use Illuminate\Support\Facades\Crypt;

final class ContractDescriber
{
    private const LIVE = ['title' => 'Senior coordinator', 'site' => 'North Hub', 'hours' => 7];

    private const CHAIN = [
        ['AMD-01', '2025-09-01', 'Promotion and transfer', ['title' => 'Coordinator', 'site' => 'East Annex', 'hours' => 8], ['title' => 'Senior coordinator', 'site' => 'North Hub', 'hours' => 8]],
        ['AMD-02', '2026-03-01', 'Working week adjustment', ['title' => 'Senior coordinator', 'site' => 'North Hub', 'hours' => 8], self::LIVE],
    ];

    /** Build a view model from the current contract and the first signed snapshot. */
    public static function describe(bool $signed, bool $canViewPay): array
    {
        $chain = self::CHAIN;
        $terms = $signed ? ($chain[0][3] ?? self::LIVE) : self::LIVE;
        if ($canViewPay) {
            $pay = self::encryptedFixture();
            $terms['monthly pay'] = Crypt::decryptString($signed ? $pay[0] : $pay[2]);
            foreach ($chain as $i => &$amendment) {
                $amendment[3]['monthly pay'] = Crypt::decryptString($pay[$i]);
                $amendment[4]['monthly pay'] = Crypt::decryptString($pay[$i + 1]);
            }
            unset($amendment);
        }

        return ['terms' => $terms, 'chain' => $chain, 'payWithheld' => ! $canViewPay];
    }

    /** Synthetic encrypted pay columns stored separately from the amendment snapshots. */
    private static function encryptedFixture(): array
    {
        static $columns;

        return $columns ??= array_map(fn ($v) => Crypt::encryptString($v), ['EUR 2,800 / month', 'EUR 3,050 / month', 'EUR 3,200 / month']);
    }
}
