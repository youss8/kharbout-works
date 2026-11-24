<?php

namespace App\Livewire;

use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class ZeroSafeSignalTiles extends Component
{
    #[Locked]
    public array $rows = ['ready', 'waiting', 'breach', 'ready', 'breach', 'waiting', 'ready', 'ready', 'ready', 'breach', 'waiting', 'ready'];

    public string $slice = '';

    public const GROUPS = ['ready' => ['On track', 'ok', '●'], 'breach' => ['Breached', 'crit', '■'], 'waiting' => ['Waiting', 'warn', '◐'], 'missing' => ['Missing asset', 'warn', '◐']];

    #[Computed]
    public function counts(): array
    {
        // Build all four counters from the whole queue in one pass.
        return array_replace(array_fill_keys(array_keys(self::GROUPS), 0), array_count_values($this->rows));
    }

    public function toggleSlice(string $id): void
    {
        if (isset(self::GROUPS[$id])) {
            $this->slice = $this->slice === $id ? '' : $id;
        }
    }

    public function clearBreaches(): void
    {
        $this->rows = array_map(fn ($state) => $state === 'breach' ? 'ready' : $state, $this->rows);
    }

    public function render()
    {
        return view('livewire.zero-safe-signal-tiles');
    }
}
