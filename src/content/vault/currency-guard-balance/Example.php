<?php

namespace App\Livewire;

use App\Vault\BalancePricing;
use DomainException;
use Livewire\Component;

class CurrencyGuardBalance extends Component
{
    public bool $eligible = true;

    public bool $mix = false;

    public bool $credit = true;

    public bool $pending = true;

    public float $used = 40;

    private const LEDGER = [['cents' => 12500050, 'currency' => 'EUR'], ['cents' => 42000000, 'currency' => 'USD']];

    public function balances(): array
    {
        return app(BalancePricing::class)->group(self::LEDGER);
    }

    public function mixError(): ?string
    {
        if (! $this->mix) {
            return null;
        }
        try {
            app(BalancePricing::class)->singleCurrencyTotal(self::LEDGER);
        } catch (DomainException $error) {
            return $error->getMessage();
        }

        return null;
    }

    public function hours(): float
    {
        return app(BalancePricing::class)->remainingHours(120, $this->used, $this->credit ? 8 : 0, $this->pending ? 16 : 0);
    }

    public function render()
    {
        return view('livewire.currency-guard-balance');
    }
}
