<?php

namespace App\Vault;

use DomainException;

final class BalancePricing
{
    /** Return integer minor-unit balances keyed by currency. */
    public function group(array $ledger): array
    {
        $totals = [];
        foreach ($ledger as $row) {
            $code = Currency::parse($row['currency'] ?? null)->value;
            $totals[$code] = ($totals[$code] ?? 0) + $row['cents'];
        }

        return $totals;
    }

    public function singleCurrencyTotal(array $ledger): int
    {
        $totals = $this->group($ledger);
        if (count($totals) !== 1) {
            throw new DomainException('Select a single currency.');
        }

        return array_values($totals)[0];
    }

    public function remainingHours(float $deserved, float $used, float $overtimeCredit, float $pending): float
    {
        return $deserved + $overtimeCredit - $used - $pending;
    }
}
