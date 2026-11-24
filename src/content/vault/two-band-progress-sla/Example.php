<?php

namespace App\Livewire;

use App\Vault\FundingCurrency;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class TwoBandProgressSla extends Component
{
    public float $received = 40000;

    public float $committed = 60000;

    public string $currency = 'USD';

    #[Computed]
    public function funding(): array
    {
        try {
            return ['value' => FundingCurrency::capacity(max(0, $this->received), max(0, $this->committed), FundingCurrency::tryFrom($this->currency)), 'error' => null];
        } catch (\InvalidArgumentException $error) {
            return ['value' => null, 'error' => $error->getMessage()];
        }
    }

    public int $approved = 75;

    public int $pending = 12;

    public float $elapsed = 0;

    #[Locked]
    public int $lastTick;

    public function mount(): void
    {
        $this->lastTick = time();
    }

    public function updatedElapsed(): void
    {
        $this->lastTick = time();
    }

    public function updatedMode(): void
    {
        $this->lastTick = time();
    }

    public function tick(): void
    {
        $now = time();
        if ($this->mode === 'Open') {
            $this->elapsed += max(0, $now - $this->lastTick) / 60;
        }
        $this->lastTick = $now;
    }

    public bool $missing = false;

    public string $mode = 'Open';

    public string $locale = 'en';

    #[Computed]
    public function remaining(): string
    {
        if ($this->mode === 'Missing SLA') {
            return '—';
        }
        if ($this->mode === 'Closed') {
            return 'Closed';
        }
        $minutes = (int) (2880 - $this->elapsed);
        $hours = intdiv(abs($minutes), 60);
        $amount = $hours ?: abs($minutes);
        if ($this->locale === 'ar') {
            return ($minutes < 0 ? 'متأخر بمقدار ' : 'متبقي ').$amount.($hours ? ' ساعة' : ' دقيقة');
        }

        return $amount.($hours ? 'h' : 'm').($minutes < 0 ? ' overdue' : ' left');
    }

    public function render()
    {
        return view('livewire.two-band-progress-sla');
    }
}
